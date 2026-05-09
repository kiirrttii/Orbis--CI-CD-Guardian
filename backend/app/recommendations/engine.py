"""
Recommendation Engine.

Generates context-aware recommendations by combining:
1. Feature values
2. SHAP contribution magnitude and direction
3. Overall Risk Severity

This avoids static feature thresholds and makes recommendations explainable.
"""

from typing import List

from app.core.risk_policy import RiskSeverity
from app.schemas.explainability import FeatureContributionSchema
from app.schemas.recommendation import ActionableInsight
from app.models.recommendation import RecommendationPriority


def generate_recommendations(
    contributions: List[FeatureContributionSchema],
    severity: RiskSeverity
) -> List[ActionableInsight]:
    """
    Generate prioritized actionable insights based on explainability output and risk severity.
    """
    insights: List[ActionableInsight] = []
    
    # We only care about generating recommendations if the risk is elevated.
    if severity in (RiskSeverity.LOW, RiskSeverity.MEDIUM):
        # We could still generate 'best practices' for medium, but for now we focus on mitigation.
        return insights
        
    for contrib in contributions:
        # Only look at features that significantly increase risk
        if contrib.direction != "increase_risk":
            continue
            
        # Ignore low-impact features (less than 10% of total SHAP impact)
        if contrib.impact_percent < 10.0:
            continue
            
        # Rule mapping based on feature name
        if contrib.feature == "CYCLO":
            insights.append(
                ActionableInsight(
                    title="Reduce Cyclomatic Complexity",
                    reason=f"High complexity strongly increased deployment risk ({contrib.impact_percent}% impact). Consider refactoring this module to split logic.",
                    priority=RecommendationPriority.HIGH if severity == RiskSeverity.CRITICAL else RecommendationPriority.MEDIUM,
                    action_type="refactor"
                )
            )
        elif contrib.feature == "BRANCH_COUNT":
            insights.append(
                ActionableInsight(
                    title="Simplify Control Flow",
                    reason=f"A high branch count is a top contributor to risk ({contrib.impact_percent}% impact). Try reducing the number of if/else or switch statements.",
                    priority=RecommendationPriority.HIGH,
                    action_type="refactor"
                )
            )
        elif contrib.feature == "DIFFICULTY":
            insights.append(
                ActionableInsight(
                    title="Lower Code Difficulty",
                    reason=f"Halstead difficulty is high, making the code harder to understand and test ({contrib.impact_percent}% impact).",
                    priority=RecommendationPriority.MEDIUM,
                    action_type="review"
                )
            )
        elif contrib.feature == "LOC":
            insights.append(
                ActionableInsight(
                    title="Split Large Files",
                    reason=f"The size of the codebase/module significantly elevated risk ({contrib.impact_percent}% impact). Consider splitting the file.",
                    priority=RecommendationPriority.LOW,
                    action_type="refactor"
                )
            )
            
    # Priority sorting mapping
    priority_order = {
        RecommendationPriority.CRITICAL: 0,
        RecommendationPriority.HIGH: 1,
        RecommendationPriority.MEDIUM: 2,
        RecommendationPriority.LOW: 3
    }
    
    insights.sort(key=lambda x: priority_order[x.priority])
    return insights
