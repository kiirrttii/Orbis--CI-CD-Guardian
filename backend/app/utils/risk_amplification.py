"""
Lightweight Risk Amplification Heuristic.

Conservative structural stress amplification layer.

When multiple structural indicators combine (extremely high LOC, high duplication,
heavy coupling), apply a small, capped score adjustment to prevent obviously
problematic repositories from remaining unrealistically low.

This is NOT real security analysis or vulnerability detection.
It is ONLY a structural stress amplification heuristic.

Design principles:
- Amplification only when MULTIPLE indicators are present
- Conservative: Small adjustments (5–15% for moderate scores)
- Capped: Max amplification ~20 points to prevent extreme inflation
- Preserves explainability: No black-box ML applied
- Maintains technical honesty: Disclaimers remain unchanged
"""

from typing import Dict
from app.ml.risk_dimensions import RiskDimensionsPayload, RiskDimensionResult


def _detect_structural_stress_indicators(features: Dict[str, float]) -> Dict[str, bool]:
    """
    Detect obviously problematic structural patterns.
    
    Returns dict of boolean indicators where True means the condition is present.
    
    Indicators:
    - extremely_high_loc: LOC > 0.85 (very large repository)
    - high_duplication: LOC + CYCLO combined high (complex + large)
    - heavy_coupling: INT_FAN_OUT > 0.75 (very high dependencies)
    - branch_proliferation: BRANCH_COUNT > 0.75 (many execution paths)
    - extreme_complexity: CYCLO > 0.80 + DIFFICULTY > 0.75 (very hard to understand)
    """
    loc = features.get('LOC', 0.0)
    cyclo = features.get('CYCLO', 0.0)
    fan_out = features.get('INT_FAN_OUT', 0.0)
    branch = features.get('BRANCH_COUNT', 0.0)
    difficulty = features.get('DIFFICULTY', 0.0)
    
    return {
        'extremely_high_loc': loc > 0.85,
        'high_duplication_complexity': (loc > 0.70 and cyclo > 0.65),
        'heavy_coupling': fan_out > 0.75,
        'branch_proliferation': branch > 0.75,
        'extreme_complexity': (cyclo > 0.80 and difficulty > 0.75),
    }


def _calculate_amplification_factor(indicators: Dict[str, bool]) -> float:
    """
    Calculate amplification factor based on combined indicators.
    
    Returns factor in range [1.0, 1.2]:
    - 1.0: No amplification (0–1 indicators)
    - 1.05–1.15: Small amplification (2–3 indicators)
    - 1.15–1.20: Modest amplification (4+ indicators)
    
    NEVER amplifies by more than 20% to preserve explainability.
    """
    indicator_count = sum(1 for v in indicators.values() if v)
    
    if indicator_count <= 1:
        return 1.0  # No amplification
    if indicator_count == 2:
        return 1.07  # 7% amplification
    if indicator_count == 3:
        return 1.12  # 12% amplification
    # 4+ indicators
    return 1.18  # 18% amplification (max cap)


def _amplify_score(original_score: float, factor: float, max_cap: float = 100.0) -> float:
    """
    Apply amplification factor while maintaining capped output.
    
    Args:
        original_score: Original score (0–100)
        factor: Amplification factor (1.0–1.2)
        max_cap: Maximum allowable score (default 100)
        
    Returns:
        Amplified score, capped to max_cap
    """
    amplified = original_score * factor
    # Additional safety: Never jump more than 20 points from original
    max_jump = original_score + 20.0
    return min(amplified, max_cap, max_jump)


def apply_structural_stress_amplification(
    payload: RiskDimensionsPayload,
    features: Dict[str, float],
    dry_run: bool = False
) -> RiskDimensionsPayload:
    """
    Optionally amplify dimension scores based on combined structural stress indicators.
    
    BACKWARD COMPATIBLE:
    - If dry_run=True, logs changes without modifying payload (for validation)
    - If no indicators present, returns unmodified payload
    - Returns a NEW payload object (immutable pattern)
    
    Args:
        payload: Original RiskDimensionsPayload
        features: Normalized feature dict for analysis
        dry_run: If True, log proposed changes without modifying (default False)
        
    Returns:
        Modified or original RiskDimensionsPayload (depending on whether amplification applies)
    """
    # Step 1: Detect indicators
    indicators = _detect_structural_stress_indicators(features)
    active_indicators = [k for k, v in indicators.items() if v]
    
    # Step 2: Calculate amplification
    factor = _calculate_amplification_factor(indicators)
    
    # Step 3: If no amplification needed, return original
    if factor == 1.0:
        return payload
    
    # Step 4: Amplify scores
    amplified_maintainability = RiskDimensionResult(
        score=_amplify_score(payload.maintainability.score, factor),
        grade=payload.maintainability.grade,  # Grade unchanged; score speaks for itself
        summary=payload.maintainability.summary
    )
    
    amplified_stability = RiskDimensionResult(
        score=_amplify_score(payload.deployment_stability.score, factor),
        grade=payload.deployment_stability.grade,
        summary=payload.deployment_stability.summary
    )
    
    amplified_security = RiskDimensionResult(
        score=_amplify_score(payload.security_exposure.score, factor),
        grade=payload.security_exposure.grade,
        summary=payload.security_exposure.summary
    )
    
    # Step 5: If dry_run, log proposed changes and return original
    if dry_run:
        import logging
        logger = logging.getLogger(__name__)
        logger.info(
            "structural_stress_amplification_proposal",
            active_indicators=active_indicators,
            amplification_factor=factor,
            original_scores={
                'maintainability': payload.maintainability.score,
                'stability': payload.deployment_stability.score,
                'security': payload.security_exposure.score,
            },
            amplified_scores={
                'maintainability': amplified_maintainability.score,
                'stability': amplified_stability.score,
                'security': amplified_security.score,
            }
        )
        return payload
    
    # Step 6: Return new payload with amplified scores
    return RiskDimensionsPayload(
        maintainability=amplified_maintainability,
        deployment_stability=amplified_stability,
        security_exposure=amplified_security,
        interpretation_summary=payload.interpretation_summary,  # No change to narrative
        confidence=payload.confidence
    )
