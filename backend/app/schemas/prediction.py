"""
Pydantic schemas for ML prediction requests and responses.

These schemas form the contract between:
  - API layer  (FastAPI route validation)
  - ML layer   (feature vector construction)
  - SHAP layer (future explainability, receives the same feature dict)
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.ml.risk_scoring import RiskSeverity


# ---------------------------------------------------------------------------
# Feature columns — ordered list used to build the numpy array
# ---------------------------------------------------------------------------

FEATURE_COLUMNS: list[str] = [
    "LOC",
    "CYCLO",
    "LENGTH",
    "VOLUME",
    "DIFFICULTY",
    "INT_FAN_IN",
    "INT_FAN_OUT",
    "NUM_OPERATORS",
    "NUM_OPERANDS",
    "BRANCH_COUNT",
]


# ---------------------------------------------------------------------------
# Request schema
# ---------------------------------------------------------------------------

class PredictionRequest(BaseModel):
    """
    Feature vector for a single inference request.
    All values must be normalized to [0.0, 1.0] before sending.
    """

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "LOC": 0.45,
                "CYCLO": 0.30,
                "LENGTH": 0.55,
                "VOLUME": 0.60,
                "DIFFICULTY": 0.72,
                "INT_FAN_IN": 0.15,
                "INT_FAN_OUT": 0.25,
                "NUM_OPERATORS": 0.40,
                "NUM_OPERANDS": 0.38,
                "BRANCH_COUNT": 0.50,
            }
        }
    )

    LOC: float = Field(
        ..., ge=0.0, le=1.0,
        description="Lines of code (normalized)",
    )
    CYCLO: float = Field(
        ..., ge=0.0, le=1.0,
        description="Cyclomatic complexity (normalized)",
    )
    LENGTH: float = Field(
        ..., ge=0.0, le=1.0,
        description="Halstead length (normalized)",
    )
    VOLUME: float = Field(
        ..., ge=0.0, le=1.0,
        description="Halstead volume (normalized)",
    )
    DIFFICULTY: float = Field(
        ..., ge=0.0, le=1.0,
        description="Halstead difficulty (normalized)",
    )
    INT_FAN_IN: float = Field(
        ..., ge=0.0, le=1.0,
        description="Internal fan-in (normalized)",
    )
    INT_FAN_OUT: float = Field(
        ..., ge=0.0, le=1.0,
        description="Internal fan-out (normalized)",
    )
    NUM_OPERATORS: float = Field(
        ..., ge=0.0, le=1.0,
        description="Number of distinct operators (normalized)",
    )
    NUM_OPERANDS: float = Field(
        ..., ge=0.0, le=1.0,
        description="Number of distinct operands (normalized)",
    )
    BRANCH_COUNT: float = Field(
        ..., ge=0.0, le=1.0,
        description="Branch count (normalized)",
    )

    def to_feature_vector(self) -> list[float]:
        """Return feature values in canonical FEATURE_COLUMNS order."""
        return [getattr(self, col) for col in FEATURE_COLUMNS]

    def to_feature_dict(self) -> dict[str, float]:
        """Return feature name → value mapping (used by SHAP layer)."""
        return {col: getattr(self, col) for col in FEATURE_COLUMNS}


# ---------------------------------------------------------------------------
# Response schema
# ---------------------------------------------------------------------------

class PredictionResponse(BaseModel):
    """Structured ML inference result."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "prediction": 1,
                "probability": 0.82,
                "risk_score": 82.0,
                "severity": "CRITICAL",
                "model_version": "v1",
                "timestamp": "2026-05-09T18:42:15Z"
            }
        }
    )

    prediction: int = Field(
        ...,
        description="Binary prediction: 1 = defect-risk detected, 0 = no risk",
    )
    probability: float = Field(
        ..., ge=0.0, le=1.0,
        description="Failure probability from model.predict_proba()",
    )
    risk_score: float = Field(
        ..., ge=0.0, le=100.0,
        description="Risk score = probability × 100",
    )
    severity: RiskSeverity = Field(
        ...,
        description="Severity band: LOW | MEDIUM | HIGH | CRITICAL",
    )
    analysis_type: str = Field(
        default="manual",
        description="Type of analysis performed (e.g., repository, telemetry, metrics)",
    )
    model_version: str = Field(
        default="v1",
        description="Model version tag for traceability",
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Time when the prediction was generated"
    )
    # Reserved for future SHAP integration
    feature_contributions: Optional[dict[str, float]] = Field(
        default=None,
        description="Per-feature SHAP contributions (populated in Phase 3)",
    )


# ---------------------------------------------------------------------------
# Batch request / response (future-ready, Phase 2+)
# ---------------------------------------------------------------------------

class BatchPredictionRequest(BaseModel):
    """Submit multiple feature vectors in a single call."""

    instances: list[PredictionRequest] = Field(
        ..., min_length=1, max_length=100,
        description="List of feature vectors (1–100 items)",
    )


class BatchPredictionResponse(BaseModel):
    """Batch inference results."""

    predictions: list[PredictionResponse]
    total: int
