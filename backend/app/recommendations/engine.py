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
                        title="Reduce Logic Complexity",
                        explanation="The workflow contains functions with high branching complexity (e.g., too many if/else statements or loops).",
                        impact="High logic complexity increases maintenance difficulty, makes the code harder to read, and elevates the risk of deployment instability.",
                        suggested_action="Consider splitting complex logic into smaller, reusable functions to improve readability and testability.",
                        triggered_by=["Logic Complexity", f"Impact: {contrib.impact_percent}%"],
                        priority=prio,
                        action_type="refactor"
                    )
                )
            elif contrib.feature == "BRANCH_COUNT":
                insights.append(
                    ActionableInsight(
                        title="Consolidate Execution Paths",
                        explanation="The codebase has an elevated density of execution paths, meaning there are many different ways the code can flow.",
                        impact="Having too many branches makes it nearly impossible to achieve full test coverage, increasing the risk of unexpected bugs in production.",
                        suggested_action="Consolidate overlapping logic and review test cases to ensure all critical execution paths are properly covered.",
                        triggered_by=["Branch Density", f"Impact: {contrib.impact_percent}%"],
                        priority=prio,
                        action_type="testing"
                    )
                )
            elif contrib.feature == "DIFFICULTY":
                insights.append(
                    ActionableInsight(
                        title="Simplify Code Interactions",
                        explanation="The ratio of unique operators to operands is high, indicating high cognitive load for developers trying to understand the code.",
                        impact="Hard-to-read code leads to a steeper learning curve for new developers and a higher likelihood of introducing defects during maintenance.",
                        suggested_action="Simplify operator interactions, use descriptive variable names, and break down dense algorithmic sections.",
                        triggered_by=["Cognitive Load", f"Impact: {contrib.impact_percent}%"],
                        priority=prio,
                        action_type="review"
                    )
                )
            elif contrib.feature == "LOC":
                insights.append(
                    ActionableInsight(
                        title="Modularize Large Files",
                        explanation="The volume of code in single files or functions is significantly higher than standard thresholds.",
                        impact="Large monolithic components are difficult to audit, harder to test, and exponentially more prone to regressions during updates.",
                        suggested_action="Extract separate responsibilities into their own modules or files to reduce volume and improve modularity.",
                        triggered_by=["Code Volume", f"Impact: {contrib.impact_percent}%"],
                        priority=prio,
                        action_type="refactor"
                    )
                )
            elif contrib.feature == "INT_FAN_OUT":
                insights.append(
                    ActionableInsight(
                        title="Reduce Module Dependency Spread",
                        explanation="This module relies on a large number of external components or services to function.",
                        impact="High dependency spread (Fan-Out) creates tight coupling. If any of those external dependencies change or fail, this module will likely break.",
                        suggested_action="Decouple components where possible. Consider using interfaces, dependency injection, or an event-driven architecture.",
                        triggered_by=["External Dependencies", f"Impact: {contrib.impact_percent}%"],
                        priority=prio,
                        action_type="refactor"
                    )
                )
            elif contrib.feature == "INT_FAN_IN":
                insights.append(
                    ActionableInsight(
                        title="Audit Core Dependency Interfaces",
                        explanation="This module is heavily depended upon by many other components within the system.",
                        impact="Because it is a core module, any changes made here have high stakes and a massive blast radius if something goes wrong.",
                        suggested_action="Ensure rigorous integration testing before merging. Implement backward-compatible changes to prevent downstream breakages.",
                        triggered_by=["Core Module Indicator", f"Impact: {contrib.impact_percent}%"],
                        priority=prio,
                        action_type="testing"
                    )
                )
            elif contrib.feature == "VOLUME":
                insights.append(
                    ActionableInsight(
                        title="Review Information Density",
                        explanation="The codebase has a high overall information volume, packing complex logic into dense spaces.",
                        impact="High density may obscure subtle logic errors, making them easily missed during standard code reviews.",
                        suggested_action="Perform a focused, deliberate peer-review of the implementation details, potentially using pair-programming.",
                        triggered_by=["Information Density", f"Impact: {contrib.impact_percent}%"],
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
                explanation="The analyzed code metrics align closely with industry stability best practices.",
                impact="Keeping risk low ensures smooth deployments, minimal production incidents, and high engineering velocity.",
                suggested_action="Continue monitoring trends. No immediate refactoring or mitigation is required for this deployment.",
                triggered_by=["Overall Stability"],
                priority=RecommendationPriority.LOW,
                action_type="monitoring"
            )
        )
    
    # Ensure high-risk analyses always have a catch-all if specifics are thin
    if not [i for i in insights if i.priority in (RecommendationPriority.HIGH, RecommendationPriority.CRITICAL)] \
       and severity in (RiskSeverity.HIGH, RiskSeverity.CRITICAL):
        insights.append(
            ActionableInsight(
                title="Enhanced Security & Logic Review",
                explanation="An elevated overall operational risk was detected across the deployment profile.",
                impact="Proceeding without mitigation carries a significant risk of deployment failure or critical runtime regressions.",
                suggested_action="Perform a manual security and logic audit of the latest changes before merging this deployment.",
                triggered_by=["Aggregated Risk Score"],
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
