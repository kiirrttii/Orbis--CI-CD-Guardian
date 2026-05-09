"""
ML package public API.

Import from here to avoid coupling to internal module paths.
"""

from app.ml.model_loader import (  # noqa: F401
    ModelLoadError,
    ModelNotLoadedError,
    ModelRegistry,
    get_model,
    load_model,
)
from app.ml.predictor import predict_batch, predict_single  # noqa: F401
from app.ml.risk_scoring import (  # noqa: F401
    RiskSeverity,
    classify_severity,
    compute_risk_score,
    score_and_classify,
)

__all__ = [
    "ModelRegistry",
    "ModelLoadError",
    "ModelNotLoadedError",
    "load_model",
    "get_model",
    "predict_single",
    "predict_batch",
    "RiskSeverity",
    "compute_risk_score",
    "classify_severity",
    "score_and_classify",
]
