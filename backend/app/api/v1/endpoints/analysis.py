"""
Operational Analysis Endpoints.
Higher-level orchestration routes that hide ML internals.
"""

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status, Query

from sqlalchemy.ext.asyncio import AsyncSession
from app.core.auth import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.repositories.telemetry_repo import TelemetryRepository
from app.schemas.analysis import RepositoryAnalysisRequest, TelemetryAnalysisRequest
from app.schemas.prediction import PredictionRequest
from app.schemas.intelligence import IntelligenceResponse
from app.intelligence.feature_extraction.extractor import FeatureExtractionOrchestrator
from app.intelligence.orchestrator import analyze_and_persist
from app.core.logging import get_logger

router = APIRouter()
logger = get_logger(__name__)

@router.post(
    "/repository",
    response_model=IntelligenceResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze deployment risk for a repository",
)
async def analyze_repository(
    payload: RepositoryAnalysisRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> IntelligenceResponse:
    """
    Operational endpoint to analyze risk based on repository metadata.
    Hides internal ML feature generation.
    """
    # 1. Extract metrics (mock/simulated)
    metrics = FeatureExtractionOrchestrator.from_repository(
        payload.repository_url, payload.branch
    )
    
    # 2. Map to internal PredictionRequest
    request = PredictionRequest(**metrics)
    
    # 3. Call intelligence engine
    return await analyze_and_persist(request, db, analysis_type="repository")


@router.post(
    "/telemetry",
    response_model=IntelligenceResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze risk for a specific workflow run",
)
async def analyze_telemetry(
    payload: TelemetryAnalysisRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> IntelligenceResponse:
    """
    Analyzes deployment risk using telemetry metadata for a specific run.
    """
    print(f"DEBUG: Telemetry Analysis for Workflow Run ID: {payload.workflow_run_id}")
    telemetry_repo = TelemetryRepository(db)
    run = await telemetry_repo.get_workflow_run_by_id(payload.workflow_run_id)
    
    if not run:
        logger.warning(
            "telemetry_run_not_found", 
            workflow_run_id=str(payload.workflow_run_id)
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "WORKFLOW_RUN_NOT_FOUND",
                "message": f"Workflow run {payload.workflow_run_id} not found in database.",
                "hint": "Ensure the repository is connected and telemetry ingestion has processed this run."
            }
        )
        
    # 1. Extract metrics from run metadata
    metrics = FeatureExtractionOrchestrator.from_telemetry(run)
    
    # 2. Map to internal PredictionRequest
    request = PredictionRequest(**metrics)
    
    # 3. Call intelligence engine
    return await analyze_and_persist(request, db, workflow_run_id=payload.workflow_run_id, analysis_type="telemetry")


@router.post(
    "/upload",
    response_model=IntelligenceResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze risk from an uploaded workflow file",
)
async def analyze_upload(
    request: Request,
    filename: str = Query(..., description="Name of the file being uploaded"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> IntelligenceResponse:
    """
    Accepts raw file content (YAML/JSON) and analyzes deployment risk.
    """
    body = await request.body()
    content = body.decode("utf-8")
    
    # 1. Parse and extract metrics
    metrics = FeatureExtractionOrchestrator.from_upload(content, filename)
    
    # 2. Map to internal PredictionRequest
    prediction_req = PredictionRequest(**metrics)
    
    # 3. Call intelligence engine
    return await analyze_and_persist(prediction_req, db, analysis_type="upload")
