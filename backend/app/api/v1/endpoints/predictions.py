"""
Prediction API endpoints.

Routes:
  POST /api/v1/predictions/predict        — single inference
  POST /api/v1/predictions/predict/batch  — batch inference
  GET  /api/v1/predictions/model/status   — model health check
"""

from fastapi import APIRouter, HTTPException, status

from app.core.logging import get_logger
from app.ml.model_loader import ModelNotLoadedError, ModelRegistry
from app.ml.predictor import predict_batch, predict_single
from app.schemas.prediction import (
    BatchPredictionRequest,
    BatchPredictionResponse,
    PredictionRequest,
    PredictionResponse,
)

logger = get_logger(__name__)

router = APIRouter()


# ---------------------------------------------------------------------------
# Model status endpoint
# ---------------------------------------------------------------------------

@router.get(
    "/model/status",
    summary="ML model status",
    description="Check whether the risk model is loaded and ready.",
)
async def model_status() -> dict:
    return {
        "model_loaded": ModelRegistry.is_loaded,
        "status": "ready" if ModelRegistry.is_loaded else "not_loaded",
    }


# ---------------------------------------------------------------------------
# Single prediction
# ---------------------------------------------------------------------------

@router.post(
    "/predict",
    response_model=PredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Predict deployment risk (single)",
    description=(
        "Submit a normalized 10-feature software metric vector. "
        "Returns a binary prediction, failure probability, risk score (0–100), "
        "and severity label (LOW / MEDIUM / HIGH / CRITICAL)."
    ),
)
async def predict(payload: PredictionRequest) -> PredictionResponse:
    logger.info("predict_endpoint_called")
    try:
        return predict_single(payload)
    except ModelNotLoadedError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "MODEL_NOT_LOADED",
                "message": str(exc),
            },
        )
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INFERENCE_ERROR",
                "message": str(exc),
            },
        )


# ---------------------------------------------------------------------------
# Batch prediction
# ---------------------------------------------------------------------------

@router.post(
    "/predict/batch",
    response_model=BatchPredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Predict deployment risk (batch)",
    description=(
        "Submit up to 100 feature vectors in one request. "
        "Returns a prediction for each instance in the same order."
    ),
)
async def predict_batch_endpoint(
    payload: BatchPredictionRequest,
) -> BatchPredictionResponse:
    logger.info("batch_predict_endpoint_called", batch_size=len(payload.instances))
    try:
        return predict_batch(payload)
    except ModelNotLoadedError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "MODEL_NOT_LOADED",
                "message": str(exc),
            },
        )
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INFERENCE_ERROR",
                "message": str(exc),
            },
        )
