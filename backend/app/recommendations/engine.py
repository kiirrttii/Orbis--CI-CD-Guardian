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
    
    # Process each contribution for specific insights
    for contrib in contributions:
        # We process both risk-increasers (for mitigation) and risk-reducers (for confirmation)
        # though we prioritize risk-increasers in the output.
        
        # Thresholds vary by severity to ensure even LOW risk gets informational feedback
        threshold = 5.0 if severity == RiskSeverity.LOW else 8.0
        
        if contrib.direction == "increase_risk" and contrib.impact_percent >= threshold:
            # Prioritization logic
            prio = RecommendationPriority.MEDIUM
            if severity == RiskSeverity.CRITICAL and contrib.impact_percent > 20:
                prio = RecommendationPriority.CRITICAL
            elif severity in (RiskSeverity.HIGH, RiskSeverity.CRITICAL):
                prio = RecommendationPriority.HIGH
            elif severity == RiskSeverity.LOW:
                prio = RecommendationPriority.LOW

            # Rule mapping based on feature name
            if contrib.feature == "CYCLO":
                insights.append(
                    ActionableInsight(
                        title="Reduce Logic Branching",
                        reason=f"Cyclomatic complexity ({contrib.impact_percent}% impact) is high. Complex branching increases the likelihood of edge-case bugs. Consider extracting sub-functions.",
                        priority=prio,
                        action_type="refactor"
                    )
                )
            elif contrib.feature == "BRANCH_COUNT":
                insights.append(
                    ActionableInsight(
                        title="Consolidate Execution Paths",
                        reason=f"The codebase has an elevated branch density ({contrib.impact_percent}% impact). Consolidate logic to ensure full test coverage of all paths.",
                        priority=prio,
                        action_type="testing"
                    )
                )
            elif contrib.feature == "DIFFICULTY":
                insights.append(
                    ActionableInsight(
                        title="Simplify Code Interactions",
                        reason=f"Halstead difficulty ({contrib.impact_percent}% impact) suggests high cognitive load. Simplify operator/operand interactions to reduce maintenance risk.",
                        priority=prio,
                        action_type="review"
                    )
                )
            elif contrib.feature == "LOC":
                insights.append(
                    ActionableInsight(
                        title="Modularize Large Files",
                        reason=f"Code volume ({contrib.impact_percent}% impact) is a significant risk driver. Large monolithic components are difficult to audit and more prone to regressions.",
                        priority=prio,
                        action_type="refactor"
                    )
                )
            elif contrib.feature == "INT_FAN_OUT":
                insights.append(
                    ActionableInsight(
                        title="Reduce Module Coupling",
                        reason=f"High fan-out ({contrib.impact_percent}% impact) indicates excessive external dependencies. Decouple components to improve system resilience.",
                        priority=prio,
                        action_type="refactor"
                    )
                )
            elif contrib.feature == "INT_FAN_IN":
                insights.append(
                    ActionableInsight(
                        title="Critical Dependency Audit",
                        reason=f"High fan-in ({contrib.impact_percent}% impact) identifies this as a core module. Changes here are high-stakes; ensure thorough integration testing.",
                        priority=prio,
                        action_type="testing"
                    )
                )
            elif contrib.feature == "VOLUME":
                insights.append(
                    ActionableInsight(
                        title="Information Density Review",
                        reason=f"High code volume ({contrib.impact_percent}% impact) may obscure logic errors. Perform a focused peer-review of the implementation details.",
                        priority=prio,
                        action_type="review"
                    )
                )

    # If severity is LOW and we have no specific risk-mitigation insights, 
    # provide a 'Best Practice' confirmation.
    if not insights and severity == RiskSeverity.LOW:
        insights.append(
            ActionableInsight(
                title="Maintain Current Standards",
                reason="Overall risk is low. Current code metrics align with stability best practices. Continue monitoring trends.",
                priority=RecommendationPriority.LOW,
                action_type="monitoring"
            )
        )
    
    # Ensure high-risk analyses always have a catch-all if specifics are thin
    if not [i for i in insights if i.priority in (RecommendationPriority.HIGH, RecommendationPriority.CRITICAL)] \
       and severity in (RiskSeverity.HIGH, RiskSeverity.CRITICAL):
        insights.append(
            ActionableInsight(
                title="Enhanced Security Review",
                reason="Elevated overall risk detected. Perform a manual security and logic audit before merging this deployment.",
                priority=RecommendationPriority.HIGH,
                action_type="review"
            )
        )

    # Priority sorting mapping
    priority_order = {
        RecommendationPriority.CRITICAL: 0,
        RecommendationPriority.HIGH: 1,
        RecommendationPriority.MEDIUM: 2,
        RecommendationPriority.LOW: 3
    }
    
    insights.sort(key=lambda x: priority_order.get(x.priority, 3))
    
    # Cap at 5 recommendations to avoid UI clutter
    return insights[:5]
