from typing import Dict, Tuple, Union, Any, Optional
from app.core.risk_policy import RiskSeverity, classify_severity

class HybridRiskEngine:
    """
    Hybrid Risk Engine.
    Combines deterministic engineering heuristics with ML-assisted refinement.
    """

    # Weights for heuristic baseline (0-100 scale)
    HEURISTIC_WEIGHTS = {
        "LOC": 20,           # Size impact
        "CYCLO": 20,         # Logic risk
        "INT_FAN_OUT": 15,   # Dependency coupling
        "BRANCH_COUNT": 15,  # Coordination/Path risk
        "VOLUME": 15,        # Review surface area
        "DIFFICULTY": 15,    # Maintenance load
    }

    @staticmethod
    def compute_heuristic_score(features: Dict[str, float]) -> float:
        """
        Calculates a deterministic baseline score based on DevSecOps heuristics.
        Features are expected to be normalized [0.0, 1.0].
        """
        score = 15.0  # Base constant for any deployment
        
        for feature, weight in HybridRiskEngine.HEURISTIC_WEIGHTS.items():
            val = features.get(feature, 0.0)
            # Use a slightly non-linear boost for high values
            contribution = val * weight
            if val > 0.7:
                contribution *= 1.1 # Extra penalty for extreme values
            score += contribution
            
        return min(round(score, 2), 100.0)

    @staticmethod
    def compute_hybrid_score(
        features: Dict[str, float], 
        ml_probability: float
    ) -> Tuple[float, float, str]:
        """
        Orchestrates the hybrid scoring logic.
        Returns: (final_score, confidence_value, confidence_level)
        """
        # 1. Base Heuristic Score
        heuristic_base = HybridRiskEngine.compute_heuristic_score(features)
        
        # 2. ML Refinement
        # ML can adjust the score by up to +/- 15 points
        # If prob > 0.5, it increases risk. If prob < 0.5, it decreases risk.
        ml_refinement = (ml_probability - 0.5) * 30.0
        
        # 3. Hybrid Combination
        final_score = heuristic_base + ml_refinement
        
        # Ensure we stay within realistic calibrated ranges (10-100)
        final_score = max(10.0, min(100.0, final_score))
        
        # 4. Confidence Calibration
        # Confidence reflects how "sure" the model is (distance from 0.5)
        # plus a check for feature completeness
        raw_confidence = abs(ml_probability - 0.5) * 2.0
        
        # Check for "thin" data (reliability signal)
        active_features = sum(1 for v in features.values() if v > 0)
        reliability_factor = min(1.0, active_features / 8.0) # Expecting at least 8 features for high reliability
        
        calibrated_confidence = raw_confidence * reliability_factor
        
        # Map to readable levels
        if calibrated_confidence > 0.7:
            level = "HIGH"
        elif calibrated_confidence > 0.3:
            level = "MEDIUM"
        else:
            level = "LOW"
            
        return round(final_score, 2), round(calibrated_confidence, 4), level

def score_and_classify(
    features_or_prob: Union[Dict[str, float], float], 
    probability: Optional[float] = None
) -> Tuple[float, RiskSeverity, float, str]:
    """
    Unified entry point for the hybrid risk engine.
    Supports legacy calls: score_and_classify(probability)
    And new hybrid calls: score_and_classify(features, probability)
    """
    if probability is None:
        # Legacy mode
        prob = float(features_or_prob)
        features = {}
    else:
        # Hybrid mode
        features = features_or_prob if isinstance(features_or_prob, dict) else {}
        prob = probability

    risk_score, confidence, confidence_level = HybridRiskEngine.compute_hybrid_score(features, prob)
    severity = classify_severity(risk_score)
    return risk_score, severity, confidence, confidence_level

def compute_risk_score(probability: float) -> float:
    """
    Legacy compatibility wrapper. 
    Warning: Does not include heuristic refinement.
    """
    if not (0.0 <= probability <= 1.0):
        raise ValueError("probability must be between 0.0 and 1.0")
    # Fallback to simple mapping if features are not available
    return round(10.0 + (probability * 90.0), 2)
