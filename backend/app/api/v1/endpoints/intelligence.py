"""
Intelligence endpoints.

Exposes the production-grade orchestration endpoint that combines ML inference,
explainability, and context-aware recommendations into a single response.
"""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.prediction import PredictionRequest
from app.schemas.intelligence import IntelligenceResponse
from app.intelligence.orchestrator import analyze_and_persist

router = APIRouter()

@router.post(
    "/analyze",
    response_model=IntelligenceResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze deployment risk and generate insights",
    description="Run the full intelligence pipeline: inference, SHAP analysis, and recommendation generation.",
)
async def analyze_risk(
    request: PredictionRequest,
    workflow_run_id: Optional[uuid.UUID] = Query(None, description="Optional ID for real telemetry linking. If omitted, an ad-hoc run is created."),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> IntelligenceResponse:
    """
    Production-grade endpoint for full intelligence payload.
    """
    return await analyze_and_persist(request, db, workflow_run_id)
