"""
Centralized Risk Policy.

Defines severity thresholds, risk interpretation, and risk categorization logic.
Ensures a unified interpretation of risk across APIs, recommendations, and dashboards.
"""

from enum import Enum
from typing import NamedTuple

class RiskSeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class _Threshold(NamedTuple):
    upper: float          # exclusive upper bound
    severity: RiskSeverity

# 0.0–0.35 (LOW)
# 0.35–0.65 (MEDIUM)
# 0.65–1.0 (HIGH/CRITICAL)
# We map 0.65–0.85 to HIGH, >0.85 to CRITICAL for better granularity.
_THRESHOLDS: tuple[_Threshold, ...] = (
    _Threshold(upper=35.0,  severity=RiskSeverity.LOW),
    _Threshold(upper=65.0,  severity=RiskSeverity.MEDIUM),
    _Threshold(upper=85.0,  severity=RiskSeverity.HIGH),
    _Threshold(upper=100.1, severity=RiskSeverity.CRITICAL),
)

def classify_severity(risk_score: float) -> RiskSeverity:
    """
    Map a risk score [0.0, 100.0] to a RiskSeverity label based on policy thresholds.
    """
    for threshold in _THRESHOLDS:
        if risk_score < threshold.upper:
            return threshold.severity
    return RiskSeverity.CRITICAL

def get_severity_weight(severity: RiskSeverity) -> float:
    """
    Returns a normalized weight [0.0, 1.0] for a severity band.
    Used for risk aggregation and recommendation prioritization.
    """
    _weights = {
        RiskSeverity.LOW: 0.1,
        RiskSeverity.MEDIUM: 0.4,
        RiskSeverity.HIGH: 0.8,
        RiskSeverity.CRITICAL: 1.0
    }
    return _weights[severity]
