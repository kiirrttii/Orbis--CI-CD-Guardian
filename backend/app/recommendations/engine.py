"""
Recommendation Engine.

Generates context-aware recommendations by combining:
1. Feature values
2. SHAP contribution magnitude and direction
3. Overall Risk Severity

This avoids static feature thresholds and makes recommendations explainable.
"""

from typing import List, Optional, Dict
from app.core.risk_policy import RiskSeverity
from app.schemas.explainability import FeatureContributionSchema
from app.schemas.recommendation import ActionableInsight
from app.models.recommendation import RecommendationPriority
from app.schemas.intelligence import RiskDimensionsPayload

def generate_recommendations(
    contributions: List[FeatureContributionSchema],
    severity: RiskSeverity,
    features: Dict[str, float],
    risk_dimensions: Optional[RiskDimensionsPayload] = None
) -> List[ActionableInsight]:
    """
    Generate prioritized actionable insights by combining:
    1. Feature contributions (SHAP)
    2. Raw feature values (Thresholds)
    3. Multidimensional risk scores
    4. Overall risk severity
    """
    insights: List[ActionableInsight] = []
    seen_titles = set()

    def add_insight(insight: ActionableInsight):
        if insight.title not in seen_titles:
            insights.append(insight)
            seen_titles.add(insight.title)

    # 1. Process SHAP-driven insights (explainable logic)
    for contrib in contributions:
        # Lower threshold for HIGH/CRITICAL to get more actionable items
        threshold = 4.0 if severity in (RiskSeverity.HIGH, RiskSeverity.CRITICAL) else 7.0
        
        if contrib.direction == "increase_risk" and contrib.impact_percent >= threshold:
            prio = RecommendationPriority.MEDIUM
            if severity == RiskSeverity.CRITICAL and contrib.impact_percent > 15:
                prio = RecommendationPriority.CRITICAL
            elif severity in (RiskSeverity.HIGH, RiskSeverity.CRITICAL):
                prio = RecommendationPriority.HIGH
            elif severity == RiskSeverity.LOW:
                prio = RecommendationPriority.LOW

            # Feature-specific logic
            if contrib.feature == "CYCLO":
                add_insight(ActionableInsight(
                    title="Simplify Complex Logic Paths",
                    explanation="The analysis detected highly complex logic paths with excessive branching.",
                    impact="Complex logic increases the likelihood of edge-case failures during deployment.",
                    suggested_action="Refactor oversized functions by extracting complex conditions into smaller, testable modules.",
                    triggered_by=["High Cyclomatic Complexity", f"Impact: {contrib.impact_percent}%"],
                    priority=prio,
                    action_type="simplify"
                ))
            elif contrib.feature == "BRANCH_COUNT":
                add_insight(ActionableInsight(
                    title="Consolidate Branching Logic",
                    explanation="An elevated number of conditional branches was identified, complicating validation.",
                    impact="Excessive branching makes exhaustive pre-deployment testing nearly impossible.",
                    suggested_action="Consolidate nested if/else structures and ensure unit tests cover the most critical paths.",
                    triggered_by=["Branch Density", f"Impact: {contrib.impact_percent}%"],
                    priority=prio,
                    action_type="simplify"
                ))
            elif contrib.feature == "LOC":
                add_insight(ActionableInsight(
                    title="Modularize Large Components",
                    explanation="Significant code volume was detected in specific files or functions.",
                    impact="Large monolithic components increase review burden and regression risk.",
                    suggested_action="Partition oversized modules into smaller, logically independent files.",
                    triggered_by=["Code Volume (LOC)", f"Impact: {contrib.impact_percent}%"],
                    priority=prio,
                    action_type="modularize"
                ))
            elif contrib.feature == "INT_FAN_OUT":
                add_insight(ActionableInsight(
                    title="Reduce Dependency Coupling",
                    explanation="This module relies on an exceptionally large number of external module dependencies.",
                    impact="High fan-out creates tight coupling, making the system fragile to downstream changes.",
                    suggested_action="Decouple modules using interfaces or abstract layers to limit dependency spread.",
                    triggered_by=["Internal Fan-Out", f"Impact: {contrib.impact_percent}%"],
                    priority=prio,
                    action_type="refactor"
                ))
            elif contrib.feature == "DIFFICULTY":
                add_insight(ActionableInsight(
                    title="Reduce Cognitive Load",
                    explanation="High algorithmic difficulty was detected, indicating dense and potentially confusing code.",
                    impact="High cognitive load leads to human error during maintenance and slow review cycles.",
                    suggested_action="Simplify operator interactions and use more descriptive variable naming conventions.",
                    triggered_by=["Halstead Difficulty", f"Impact: {contrib.impact_percent}%"],
                    priority=prio,
                    action_type="optimize"
                ))

    # 2. Add raw feature threshold insights (Task 2: coverage)
    # This captures issues that might not be top SHAP contributors but are still problematic
    if features.get("LENGTH", 0) > 0.7:
        add_insight(ActionableInsight(
            title="Refactor Oversized Sequences",
            explanation="The total number of operators and operands exceeds stability thresholds.",
            impact="Long instruction sequences are harder to audit and prone to subtle logic regressions.",
            suggested_action="Break down long algorithmic sequences into smaller, named utility functions.",
            triggered_by=["High Length Metric"],
            priority=RecommendationPriority.MEDIUM,
            action_type="refactor"
        ))
    
    if features.get("INT_FAN_IN", 0) > 0.8:
        add_insight(ActionableInsight(
            title="Audit High-Impact Core Interfaces",
            explanation="This module is a central dependency for a large portion of the repository.",
            impact="Changes to core modules have a massive blast radius across the entire deployment.",
            suggested_action="Ensure 100% test coverage on public interfaces for this module before merging.",
            triggered_by=["Critical Fan-In"],
            priority=RecommendationPriority.HIGH if severity != RiskSeverity.LOW else RecommendationPriority.MEDIUM,
            action_type="audit"
        ))

    # 3. Add Multidimensional Insights (Task 2 & 3: prioritization)
    if risk_dimensions:
        if risk_dimensions.maintainability.score > 60:
            add_insight(ActionableInsight(
                title="Immediate Maintainability Review",
                explanation="Overall code quality metrics have fallen below acceptable maintainability standards.",
                impact="Sustained low maintainability leads to technical debt and increased deployment friction.",
                suggested_action="Schedule a dedicated refactoring sprint to address structural maintainability concerns.",
                triggered_by=["Low Maintainability Grade"],
                priority=RecommendationPriority.HIGH,
                action_type="refactor"
            ))
        
        if risk_dimensions.deployment_stability.score > 60:
            add_insight(ActionableInsight(
                title="Stabilize Integration Boundaries",
                explanation="Structural coupling and integration indicators suggest high deployment instability.",
                impact="Proceeding with deployment carries an elevated risk of integration failure.",
                suggested_action="Verify integration contracts and perform a staging environment smoke test.",
                triggered_by=["Low Deployment Stability Grade"],
                priority=RecommendationPriority.HIGH,
                action_type="stabilize"
            ))

        if risk_dimensions.security_exposure.score > 60:
             add_insight(ActionableInsight(
                title="Structural Complexity Audit",
                explanation="High structural complexity was detected in security-sensitive or core logic paths.",
                impact="Complex structural patterns can obscure logic errors or unintentional side effects.",
                suggested_action="Perform a targeted manual review of recent changes in complex modules.",
                triggered_by=["High Structural Review Complexity"],
                priority=RecommendationPriority.HIGH if severity != RiskSeverity.LOW else RecommendationPriority.MEDIUM,
                action_type="audit"
            ))

    # 4. Mandatory Fallbacks (Task 1: ensure at least 1–3 always appear)
    if not insights:
        if severity in (RiskSeverity.HIGH, RiskSeverity.CRITICAL):
            add_insight(ActionableInsight(
                title="Enhanced Manual Peer Review",
                explanation="An elevated risk score was detected without a single dominant structural cause.",
                impact="Proceeding without manual verification carries high risk due to aggregated signals.",
                suggested_action="Requirement: At least two senior engineers should review this deployment manually.",
                triggered_by=["Aggregated Risk Indicators"],
                priority=RecommendationPriority.HIGH,
                action_type="review"
            ))
        
        # Base fallback for all
        add_insight(ActionableInsight(
            title="Monitor Structural Complexity Trends",
            explanation="The current analysis shows a baseline of structural complexity typical of evolving repositories.",
            impact="Gradual complexity growth can lead to long-term maintainability degradation.",
            suggested_action="Continue to monitor maintainability grades during subsequent deployment cycles.",
            triggered_by=["Baseline Structural Analysis"],
            priority=RecommendationPriority.LOW,
            action_type="optimize"
        ))

    # Final sorting and capping (Task 3: Prioritization)
    priority_order = {
        RecommendationPriority.CRITICAL: 0,
        RecommendationPriority.HIGH: 1,
        RecommendationPriority.MEDIUM: 2,
        RecommendationPriority.LOW: 3
    }
    
    insights.sort(key=lambda x: priority_order.get(x.priority, 3))
    
    # Return 2-4 best recommendations as requested (Task 2)
    return insights[:4]
