"""
Risk Engine.

Centralizes risk aggregation and scoring. Currently handles single-signal ML probabilities,
but is designed to be extended for multi-signal fusion (e.g., combining ML risk with static analysis risk).
"""

from app.core.risk_policy import RiskSeverity, classify_severity

def compute_risk_score(probability: float) -> float:
    """
    Convert a model probability [0.0, 1.0] to a risk score [0.0, 100.0].
    Uses a baseline risk floor of 10.0 for analytics visibility.
    """
    if not 0.0 <= probability <= 1.0:
        raise ValueError(
            f"probability must be in [0.0, 1.0], got {probability!r}"
        )
    # Calibrate: 0.0 probability -> 10.0 score, 1.0 probability -> 100.0 score
    return round(10.0 + (probability * 90.0), 2)

def score_and_classify(probability: float) -> tuple[float, RiskSeverity]:
    """
    Compute risk score and classify severity in one call.
    """
    risk_score = compute_risk_score(probability)
    severity = classify_severity(risk_score)
    return risk_score, severity
