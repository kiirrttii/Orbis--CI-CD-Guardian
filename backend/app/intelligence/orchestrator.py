"""
Intelligence Orchestrator.

Manages the complete intelligence flow:
Validation → Inference → SHAP → Categorization → Recommendations → Persistence → Assembly.
"""

import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.schemas.prediction import PredictionRequest, PredictionResponse
from app.schemas.intelligence import IntelligenceResponse
from app.ml.predictor import predict_single
from app.explainability.explainer import generate_explanations
from app.recommendations.engine import generate_recommendations
from app.ml.risk_dimensions import compute_risk_dimensions
from app.utils.risk_amplification import apply_structural_stress_amplification

from app.models.prediction import Prediction
from app.models.feature_contribution import FeatureContribution
from app.models.recommendation import Recommendation, RecommendationStatus
from app.models.workflow_run import WorkflowRun

from app.repositories.intelligence_repo import IntelligenceRepository
from app.repositories.telemetry_repo import TelemetryRepository

logger = get_logger(__name__)

async def analyze_and_persist(
    request: PredictionRequest,
    session: AsyncSession,
    workflow_run_id: Optional[uuid.UUID] = None,
    analysis_type: str = "manual"
) -> IntelligenceResponse:
    """
    Orchestrate the full intelligence flow.
    """
    logger.info("orchestration_started", workflow_run_id=str(workflow_run_id))
    
    # If no workflow_run_id is provided, create a dummy WorkflowRun for ad-hoc persistence
    telemetry_repo = TelemetryRepository(session)
    # If no workflow_run_id is provided, create a dummy WorkflowRun for ad-hoc persistence
    telemetry_repo = TelemetryRepository(session)
    if workflow_run_id is None:
        # Fetch the first repository to avoid foreign key violation
        from app.models.repository import Repository
        from sqlalchemy import select
        repo_stmt = select(Repository).limit(1)
        repo_result = await session.execute(repo_stmt)
        default_repo = repo_result.scalars().first()
        
        if not default_repo:
            logger.error("no_repository_found_for_ad_hoc_analysis")
            raise RuntimeError("Database must have at least one repository to perform analysis.")

        run = WorkflowRun(
            repository_id=default_repo.id,
            github_run_id=int(uuid.uuid4().int >> 96), # Random dummy GH ID
            workflow_name="Ad-hoc Analysis",
            status="completed",
            conclusion="success"
        )
        await telemetry_repo.create_workflow_run(run)
        workflow_run_id = run.id
        logger.info("created_ad_hoc_workflow_run", workflow_run_id=str(workflow_run_id))
    else:
        # Validate existence
        run = await telemetry_repo.get_workflow_run_by_id(workflow_run_id)
        if not run:
            # Fetch the first repository to avoid foreign key violation
            from app.models.repository import Repository
            from sqlalchemy import select
            repo_stmt = select(Repository).limit(1)
            repo_result = await session.execute(repo_stmt)
            default_repo = repo_result.scalars().first()
            
            if not default_repo:
                logger.error("no_repository_found_for_ad_hoc_analysis")
                raise RuntimeError("Database must have at least one repository to perform analysis.")

            run = WorkflowRun(
                id=workflow_run_id,
                repository_id=default_repo.id,
                github_run_id=int(workflow_run_id.int >> 96),
                workflow_name="Ad-hoc Analysis",
                status="completed",
                conclusion="success"
            )
            await telemetry_repo.create_workflow_run(run)
    
    # 1. Inference
    inference_result: PredictionResponse = predict_single(request)
    
    # 2. SHAP Analysis
    feature_vector = request.to_feature_vector()
    explanations = generate_explanations(feature_vector)
    
    # 3. Risk Dimensions (additive interpretation layer — fault-tolerant)
    # Moved up so recommendations can use dimensional scores for better context
    feature_dict = request.to_feature_dict()
    risk_dimensions_payload = None
    try:
        dims = compute_risk_dimensions(
            features=feature_dict,
            overall_risk_score=inference_result.risk_score,
        )
        # Convert dataclasses to Pydantic-compatible dicts for schema validation
        from app.schemas.intelligence import RiskDimensionsPayload, RiskDimensionResult as RDR
        risk_dimensions_payload = RiskDimensionsPayload(
            maintainability=RDR(
                score=dims.maintainability.score,
                grade=dims.maintainability.grade,
                summary=dims.maintainability.summary,
            ),
            deployment_stability=RDR(
                score=dims.deployment_stability.score,
                grade=dims.deployment_stability.grade,
                summary=dims.deployment_stability.summary,
            ),
            security_exposure=RDR(
                score=dims.security_exposure.score,
                grade=dims.security_exposure.grade,
                summary=dims.security_exposure.summary,
            ),
            interpretation_summary=dims.interpretation_summary,
            confidence=dims.confidence,
        )
        
        # 3.1 Risk Amplification (structural stress heuristic — Task 1-4)
        if risk_dimensions_payload:
            risk_dimensions_payload, inference_result.risk_score = apply_structural_stress_amplification(
                payload=risk_dimensions_payload,
                features=feature_dict,
                overall_risk_score=inference_result.risk_score
            )
            # Re-classify severity based on amplified score
            from app.core.risk_policy import classify_severity
            inference_result.severity = classify_severity(inference_result.risk_score)
            
            # Sync confidence level for UI consistency
            inference_result.confidence_level = risk_dimensions_payload.confidence
            
        logger.info("risk_dimensions_computed", amplified_score=inference_result.risk_score)
    except Exception as exc:
        logger.warning("risk_dimensions_failed", error=str(exc))

    # 4. Recommendations (Strengthened Engine — Task 1-6)
    recommendations = []
    try:
        recommendations = generate_recommendations(
            contributions=explanations,
            severity=inference_result.severity,
            features=feature_dict,
            risk_dimensions=risk_dimensions_payload
        )
    except Exception as exc:
        logger.error("recommendation_generation_failed", error=str(exc))
        # Fallback recommendations if the engine crashes (Stability Requirement Task 6)
        from app.schemas.recommendation import ActionableInsight
        from app.models.recommendation import RecommendationPriority
        recommendations = [
            ActionableInsight(
                title="Review Repository Structural Trends",
                explanation="An error occurred during specific recommendation generation, but overall structural indicators remain available.",
                impact="Generic structural oversight may be reduced if specific insights are unavailable.",
                suggested_action="Monitor repository complexity and maintainability metrics through the multidimensional analysis panel.",
                triggered_by=["System Safety Fallback"],
                priority=RecommendationPriority.MEDIUM,
                action_type="review"
            )
        ]


    # 4. Persistence
    intelligence_repo = IntelligenceRepository(session)
    
    prediction_model = Prediction(
        workflow_run_id=workflow_run_id,
        model_name="model",
        model_version=inference_result.model_version,
        risk_score=inference_result.risk_score,
        severity=inference_result.severity.value if hasattr(inference_result.severity, 'value') else str(inference_result.severity),
        analysis_type=analysis_type,
        confidence=inference_result.confidence,
        confidence_level=inference_result.confidence_level,
        failure_probability=inference_result.probability,
        predicted_label=str(inference_result.prediction),
        raw_output={"risk_dimensions": risk_dimensions_payload.model_dump()} if risk_dimensions_payload else None
    )
    
    fc_models = []
    for i, exp in enumerate(explanations):
        fc_models.append(
            FeatureContribution(
                feature_name=exp.feature,
                feature_value=getattr(request, exp.feature),
                contribution_value=exp.shap_value,
                impact_percent=exp.impact_percent,
                contribution_rank=i+1,
                direction=exp.direction,
                interpretation=exp.interpretation
            )
        )
        
    rec_models = []
    for i, rec in enumerate(recommendations):
        rec_models.append(
            Recommendation(
                title=rec.title,
                description=f"{rec.explanation}\nImpact: {rec.impact}\nAction: {rec.suggested_action}",
                action_type=rec.action_type,
                priority=rec.priority,
                status=RecommendationStatus.GENERATED,
                sort_order=i
            )
        )
        
    persisted_prediction = await intelligence_repo.save_intelligence_payload(
        prediction_model, fc_models, rec_models
    )
    
    logger.info("orchestration_completed", prediction_id=str(persisted_prediction.id))
    
    # 5. Assembly
    target_name = "Manual Analysis"
    if run:
        target_name = run.workflow_name
        repo = None
        if hasattr(run, 'repository_id') and run.repository_id:
            from app.models.repository import Repository
            from sqlalchemy import select
            repo_stmt = select(Repository).where(Repository.id == run.repository_id)
            repo_result = await session.execute(repo_stmt)
            repo = repo_result.scalars().first()
            
        # Target Name Resolution (Task 1: REAL repository names)
        name_candidate = repo.name if repo else None
        
        # Priority: Extract from URL if name is generic or missing (Task 1: derived label)
        if (not name_candidate or name_candidate == "riskops-demo") and repo and repo.repo_url:
            try:
                url = repo.repo_url.lower()
                # Strip protocol and domains
                clean_url = url.replace("https://", "").replace("http://", "")
                clean_url = clean_url.replace("www.github.com/", "").replace("github.com/", "")
                
                # Ensure we have user/repo format
                if "/" in clean_url:
                    name_candidate = clean_url.strip("/")
                else:
                    # Fallback to last part if no slash remains
                    url_parts = repo.repo_url.rstrip('/').split('/')
                    if len(url_parts) >= 2:
                        name_candidate = url_parts[-1]
            except Exception:
                pass
        
        # Fallback to workflow name
        if not name_candidate or name_candidate == "Ad-hoc Analysis":
            name_candidate = run.workflow_name
            
        if name_candidate:
            target_name = name_candidate

    return IntelligenceResponse(
        workflow_run_id=workflow_run_id,
        prediction_id=persisted_prediction.id,
        target_name=target_name,
        inference=PredictionResponse(
            prediction=inference_result.prediction,
            probability=inference_result.probability,
            risk_score=inference_result.risk_score,
            severity=inference_result.severity,
            analysis_type=analysis_type,
            confidence=inference_result.confidence,
            confidence_level=inference_result.confidence_level,
            model_version=inference_result.model_version,
            timestamp=persisted_prediction.created_at
        ),
        explainability=explanations,
        recommendations=recommendations,
        risk_dimensions=risk_dimensions_payload,
    )
