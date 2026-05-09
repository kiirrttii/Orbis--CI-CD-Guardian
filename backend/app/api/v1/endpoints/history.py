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
        # Map ORM to IntelligenceResponse
        # Note: In a production app, we'd use a more efficient mapper or partial schema
        results.append(
            IntelligenceResponse(
                workflow_run_id=pred.workflow_run_id,
                prediction_id=pred.id,
                inference=PredictionResponse(
                    prediction=int(pred.predicted_label == "fail"),
                    probability=pred.failure_probability,
                    risk_score=pred.risk_score,
                    severity=pred.severity, # derived property if added to model, or calculated
                    model_version=pred.model_version,
                    timestamp=pred.created_at
                ),
                explainability=[], # Omit details in list view for performance
                recommendations=[] 
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
        
    # Manual mapping for now to ensure all fields are populated correctly
    # In a real app, use a proper mapping layer or Pydantic.from_orm
    return IntelligenceResponse(
        workflow_run_id=pred.workflow_run_id,
        prediction_id=pred.id,
        inference=PredictionResponse(
            prediction=int(pred.predicted_label == "fail"),
            probability=pred.failure_probability,
            risk_score=pred.risk_score,
            severity=pred.severity, 
            model_version=pred.model_version,
            timestamp=pred.created_at
        ),
        explainability=[
            # Map FeatureContribution to FeatureExplanation
            {
                "feature": fc.feature_name,
                "shap_value": fc.contribution_value,
                "impact_percent": fc.impact_percent,
                "direction": fc.direction
            } for fc in pred.feature_contributions
        ],
        recommendations=[
            # Map Recommendation model to Recommendation schema
            {
                "id": str(rec.id),
                "title": rec.title,
                "reason": rec.description,
                "action_type": rec.action_type,
                "priority": rec.priority,
                "status": rec.status
            } for rec in pred.recommendations
        ]
    )
