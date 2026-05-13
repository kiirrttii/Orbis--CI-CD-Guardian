"""
History API Endpoints.
Routes for retrieving past intelligence analyses.
"""

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from sqlalchemy.ext.asyncio import AsyncSession
from app.core.auth import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.repositories.intelligence_repo import IntelligenceRepository
from app.schemas.intelligence import IntelligenceResponse
from app.schemas.prediction import PredictionResponse
from app.utils.risk_dimensions_serializer import deserialize_risk_dimensions

router = APIRouter()

@router.get(
    "/",
    response_model=List[IntelligenceResponse],
    summary="List historical analyses",
)
async def list_history(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    severity: Optional[str] = Query(None, description="Filter by severity"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[IntelligenceResponse]:
    """
    Returns a paginated list of historical intelligence analyses.
    """
    repo = IntelligenceRepository(db)
    history = await repo.get_history(limit=limit, offset=offset)
    
    results = []
    for pred in history:
        # ── Target Name Resolution (Task 1: Simple URL display) ──────────────
        target_name = "Unknown Repository"
        
        if pred.workflow_run:
            if pred.workflow_run.repository and pred.workflow_run.repository.repo_url:
                target_name = pred.workflow_run.repository.repo_url
            else:
                target_name = pred.workflow_run.workflow_name or "Unknown Repository"
        # ──────────────────────────────────────────────────────────────────────

        results.append(
            IntelligenceResponse(
                workflow_run_id=pred.workflow_run_id,
                prediction_id=pred.id,
                target_name=target_name,
                inference=PredictionResponse(
                    prediction=int(pred.predicted_label == "fail"),
                    probability=pred.failure_probability,
                    risk_score=pred.risk_score,
                    severity=pred.severity,
                    analysis_type=pred.analysis_type,
                    confidence=pred.confidence,
                    confidence_level=pred.confidence_level,
                    model_version=pred.model_version,
                    timestamp=pred.created_at
                ),
                explainability=[], # Omit details in list view for performance
                recommendations=[],
                risk_dimensions=deserialize_risk_dimensions(pred.raw_output)
            )
        )
    return results

@router.get(
    "/{prediction_id}",
    response_model=IntelligenceResponse,
    summary="Get detailed analysis report",
)
async def get_history_detail(
    prediction_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> IntelligenceResponse:
    """
    Returns the full intelligence payload for a specific historical prediction.
    """
    repo = IntelligenceRepository(db)
    pred = await repo.get_prediction_with_details(prediction_id)
    
    if not pred:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis report not found"
        )
        
    # ── Target Name Resolution (Task 1: Simple URL display) ──────────────
    target_name = "Unknown Repository"
    
    if pred.workflow_run:
        if pred.workflow_run.repository and pred.workflow_run.repository.repo_url:
            target_name = pred.workflow_run.repository.repo_url
        else:
            target_name = pred.workflow_run.workflow_name or "Unknown Repository"
    # ──────────────────────────────────────────────────────────────────────

    def parse_recommendation(rec):
        desc = rec.description or ""
        parts = desc.split("\nImpact: ")
        explanation = parts[0] if parts else "No explanation available"
        impact = "N/A"
        action = "N/A"
        if len(parts) > 1:
            impact_parts = parts[1].split("\nAction: ")
            impact = impact_parts[0]
            if len(impact_parts) > 1:
                action = impact_parts[1]
                
        return {
            "title": rec.title,
            "explanation": explanation,
            "impact": impact,
            "suggested_action": action,
            "triggered_by": [],
            "priority": rec.priority,
            "action_type": rec.action_type or "general",
        }

    # Manual mapping for now to ensure all fields are populated correctly
    # In a real app, use a proper mapping layer or Pydantic.from_orm
    return IntelligenceResponse(
        workflow_run_id=pred.workflow_run_id,
        prediction_id=pred.id,
        target_name=target_name,
        inference=PredictionResponse(
            prediction=int(pred.predicted_label == "fail"),
            probability=pred.failure_probability,
            risk_score=pred.risk_score,
            severity=pred.severity, 
            analysis_type=pred.analysis_type,
            confidence=pred.confidence,
            confidence_level=pred.confidence_level,
            model_version=pred.model_version,
            timestamp=pred.created_at
        ),
        explainability=[
            # Map FeatureContribution to FeatureExplanation
            {
                "feature": fc.feature_name,
                "shap_value": fc.contribution_value,
                "impact_percent": fc.impact_percent,
                "direction": fc.direction,
                "interpretation": fc.interpretation
            } for fc in pred.feature_contributions
        ],
        recommendations=[parse_recommendation(rec) for rec in pred.recommendations],
        risk_dimensions=deserialize_risk_dimensions(pred.raw_output)
    )
