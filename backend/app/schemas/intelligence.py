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

class IntelligenceResponse(BaseModel):
    """
    Orchestrated intelligence output including inference, explainability, and recommendations.
    """
    workflow_run_id: uuid.UUID = Field(..., description="ID of the workflow run")
    prediction_id: uuid.UUID = Field(..., description="ID of the persisted prediction")
    inference: PredictionResponse = Field(..., description="Raw model prediction and risk score")
    explainability: List[FeatureContributionSchema] = Field(..., description="SHAP feature contributions")
    recommendations: List[ActionableInsight] = Field(..., description="Prioritized recommendations")

