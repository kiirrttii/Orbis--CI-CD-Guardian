"""
Explainability schemas.

Defines the structure for feature contributions (SHAP values) and explainability reports.
"""

from typing import List, Literal
from pydantic import BaseModel, ConfigDict, Field

class FeatureContributionSchema(BaseModel):
    """
    A single feature's contribution to the predicted risk.
    """
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "feature": "CYCLO",
                "shap_value": 0.18,
                "impact_percent": 22.4,
                "direction": "increase_risk"
            }
        }
    )

    feature: str = Field(..., description="Name of the feature")
    shap_value: float = Field(..., description="Absolute magnitude of the SHAP contribution")
    impact_percent: float = Field(..., description="Percentage of total absolute SHAP impact")
    direction: Literal["increase_risk", "decrease_risk"] = Field(
        ..., description="Direction of the contribution"
    )

class ExplainabilityResponse(BaseModel):
    """
    Explainability report for a single prediction.
    """
    top_contributors: List[FeatureContributionSchema] = Field(
        ..., description="List of feature contributions sorted by impact"
    )
