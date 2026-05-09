"""
Inference predictor — the core ML pipeline.

Responsibilities:
  1. Accept a validated feature vector (from Pydantic schema)
  2. Convert to numpy array in canonical column order
  3. Call model.predict() and model.predict_proba()
  4. Delegate scoring and classification to risk_scoring module
  5. Return a structured PredictionResponse

Designed to be extended with SHAP in Phase 3 without modification.
"""

import numpy as np

from app.core.logging import get_logger
from app.ml.model_loader import get_model
from app.ml.risk_scoring import RiskSeverity, score_and_classify
from app.schemas.prediction import (
    FEATURE_COLUMNS,
    BatchPredictionRequest,
    BatchPredictionResponse,
    PredictionRequest,
    PredictionResponse,
)

logger = get_logger(__name__)

# Index of the positive class in predict_proba output
# XGBoost / sklearn convention: class 1 is at index 1
_POSITIVE_CLASS_INDEX: int = 1
_MODEL_VERSION: str = "v1"


# ---------------------------------------------------------------------------
# Single prediction
# ---------------------------------------------------------------------------

def predict_single(request: PredictionRequest) -> PredictionResponse:
    """
    Run inference for a single feature vector.

    Pipeline:
        feature dict → numpy array → predict() + predict_proba()
        → risk_score → severity → PredictionResponse

    Args:
        request: Validated PredictionRequest Pydantic model.

    Returns:
        PredictionResponse with prediction, probability, risk_score, severity.

    Raises:
        ModelNotLoadedError: If model registry has not been initialised.
        RuntimeError: On unexpected inference failure.
    """
    model = get_model()

    # ── Build feature array in canonical column order ──────────────────────────
    feature_vector = request.to_feature_vector()
    X = np.array(feature_vector, dtype=np.float64).reshape(1, -1)

    logger.debug(
        "inference_start",
        features={col: val for col, val in zip(FEATURE_COLUMNS, feature_vector)},
    )

    # ── Inference ─────────────────────────────────────────────────────────────
    try:
        raw_prediction: int = int(model.predict(X)[0])
        proba_array = model.predict_proba(X)[0]
        probability: float = float(proba_array[_POSITIVE_CLASS_INDEX])
    except Exception as exc:
        logger.error("inference_failed", error=str(exc), exc_info=True)
        raise RuntimeError(f"Model inference failed: {exc}") from exc

    # ── Risk scoring & severity ────────────────────────────────────────────────
    risk_score, severity = score_and_classify(probability)

    logger.info(
        "inference_complete",
        prediction=raw_prediction,
        probability=round(probability, 4),
        risk_score=risk_score,
        severity=severity.value,
    )

    return PredictionResponse(
        prediction=raw_prediction,
        probability=round(probability, 4),
        risk_score=risk_score,
        severity=severity,
        model_version=_MODEL_VERSION,
        # feature_contributions populated in Phase 3 (SHAP)
        feature_contributions=None,
    )


# ---------------------------------------------------------------------------
# Batch prediction
# ---------------------------------------------------------------------------

def predict_batch(request: BatchPredictionRequest) -> BatchPredictionResponse:
    """
    Run inference for multiple feature vectors in a single model call.

    More efficient than calling predict_single() in a loop because
    it passes a single (n, 10) array to the model rather than n (1, 10) arrays.

    Args:
        request: BatchPredictionRequest with 1–100 feature vectors.

    Returns:
        BatchPredictionResponse with one PredictionResponse per instance.
    """
    model = get_model()
    instances = request.instances

    # ── Stack into (n, 10) matrix ─────────────────────────────────────────────
    matrix = np.array(
        [inst.to_feature_vector() for inst in instances],
        dtype=np.float64,
    )

    logger.info("batch_inference_start", batch_size=len(instances))

    try:
        raw_predictions = model.predict(matrix)               # shape (n,)
        proba_matrix = model.predict_proba(matrix)           # shape (n, 2)
        probabilities = proba_matrix[:, _POSITIVE_CLASS_INDEX]
    except Exception as exc:
        logger.error("batch_inference_failed", error=str(exc), exc_info=True)
        raise RuntimeError(f"Batch model inference failed: {exc}") from exc

    # ── Build individual responses ─────────────────────────────────────────────
    responses: list[PredictionResponse] = []
    for raw_pred, prob in zip(raw_predictions, probabilities):
        risk_score, severity = score_and_classify(float(prob))
        responses.append(
            PredictionResponse(
                prediction=int(raw_pred),
                probability=round(float(prob), 4),
                risk_score=risk_score,
                severity=severity,
                model_version=_MODEL_VERSION,
                feature_contributions=None,
            )
        )

    logger.info("batch_inference_complete", batch_size=len(responses))

    return BatchPredictionResponse(predictions=responses, total=len(responses))
