"""
Intelligence Schemas.

Defines the structure for the aggregated intelligence response.
"""

from typing import List, Optional
import uuid
from pydantic import BaseModel, Field

from app.schemas.prediction import PredictionResponse
from app.schemas.explainability import FeatureContributionSchema
from app.schemas.recommendation import ActionableInsight


# ---------------------------------------------------------------------------
# Risk Dimensions — additive output schemas (never modify existing schemas)
# ---------------------------------------------------------------------------

class RiskDimensionResult(BaseModel):
    """
    Score, grade, and reasoning for a single derived risk dimension.
    """
    score: float = Field(..., ge=0.0, le=100.0, description="Heuristic risk score (0–100)")
    grade: str = Field(..., description="Letter grade: A (best) through E (worst)")
    summary: str = Field(..., description="Short plain-English reasoning for this dimension")


class RiskDimensionsPayload(BaseModel):
    """
    Aggregated payload for all three derived risk dimensions.
    Populated as an optional extension on IntelligenceResponse.
    """
    maintainability: RiskDimensionResult = Field(..., description="Maintainability risk (CYCLO, LENGTH, LOC, VOLUME, DIFFICULTY)")
    deployment_stability: RiskDimensionResult = Field(..., description="Deployment stability risk (BRANCH_COUNT, INT_FAN_IN, INT_FAN_OUT, LOC, VOLUME)")
    security_exposure: RiskDimensionResult = Field(..., description="Security exposure risk (conservative heuristic proxy)")
    interpretation_summary: str = Field(..., description="Top-level narrative summarising all three dimensions")

class IntelligenceResponse(BaseModel):
    """
    Orchestrated intelligence output including inference, explainability, and recommendations.
    """
    workflow_run_id: uuid.UUID = Field(..., description="ID of the workflow run")
    prediction_id: uuid.UUID = Field(..., description="ID of the persisted prediction")
    target_name: str = Field(default="Unknown Target", description="Meaningful name for the analysis target (e.g., repository name)")
    inference: PredictionResponse = Field(..., description="Raw model prediction and risk score")
    explainability: List[FeatureContributionSchema] = Field(..., description="SHAP feature contributions")
    recommendations: List[ActionableInsight] = Field(..., description="Prioritized recommendations")
    # Optional additive extension — never breaks existing consumers
    risk_dimensions: Optional[RiskDimensionsPayload] = Field(
        default=None,
        description="Derived multidimensional risk interpretation (additive, optional)",
    )

