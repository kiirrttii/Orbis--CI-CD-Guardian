"""
Recommendation Schemas.

Defines the structure for actionable insights output by the Recommendation Engine.
"""

from typing import List, Optional
from pydantic import BaseModel, Field

from app.models.recommendation import RecommendationPriority


class ActionableInsight(BaseModel):
    """
    A single recommendation to mitigate deployment risk.
    """
    title: str = Field(..., description="Short, descriptive title of the recommendation")
    reason: str = Field(..., description="Explanation of why this recommendation was triggered")
    priority: RecommendationPriority = Field(..., description="Priority level of the recommendation")
    action_type: str = Field(..., description="Category of action (e.g., refactor, testing, review)")
    

class RecommendationResponse(BaseModel):
    """
    List of recommendations generated for a prediction.
    """
    recommendations: List[ActionableInsight] = Field(..., description="Prioritized recommendations")
