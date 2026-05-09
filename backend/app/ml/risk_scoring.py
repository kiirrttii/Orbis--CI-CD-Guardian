"""
Proxy for backward compatibility. 
Redirects risk scoring and severity logic to the new centralized Intelligence Layer and Risk Policy.
"""

from app.core.risk_policy import RiskSeverity, classify_severity
from app.intelligence.risk_engine import compute_risk_score, score_and_classify

__all__ = [
    "RiskSeverity",
    "classify_severity",
    "compute_risk_score",
    "score_and_classify",
]
