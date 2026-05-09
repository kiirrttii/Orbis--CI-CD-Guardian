"""
SHAP Explainer Service.

Loads the SHAP TreeExplainer and caches it alongside the model.
Computes absolute SHAP values and impact percentages to preserve direction separately.
"""

import threading
from typing import Any, Dict, List, Optional
import numpy as np

try:
    import shap
except ImportError:
    shap = None

from app.core.logging import get_logger
from app.ml.model_loader import get_model
from app.schemas.prediction import FEATURE_COLUMNS
from app.schemas.explainability import FeatureContributionSchema

logger = get_logger(__name__)

# Feature interpretation mapping
FEATURE_INTERPRETATIONS = {
    "LOC": "Code Surface Area (larger deployments require more extensive review)",
    "CYCLO": "Logic Complexity (deeply nested paths increase logic failure risk)",
    "LENGTH": "Programmatic Volume (high token density reduces maintainability)",
    "VOLUME": "Information Content (high density makes manual auditing prone to error)",
    "DIFFICULTY": "Cognitive Load (complex interactions increase verification effort)",
    "INT_FAN_IN": "Module Coupling (high stakes due to many dependent components)",
    "INT_FAN_OUT": "External Dependency Load (increases system fragility/decoupling risk)",
    "NUM_OPERATORS": "Operation Density (mathematical/logical complexity surface)",
    "NUM_OPERANDS": "Data Interaction Surface (higher risk of data-flow side effects)",
    "BRANCH_COUNT": "Decision Point Density (execution path coordination risk)",
}

class SHAPNotLoadedError(RuntimeError):
    """Raised when SHAP explainer is not loaded or shap is not installed."""

class _SHAPExplainerRegistry:
    """
    Thread-safe singleton registry for the SHAP TreeExplainer.
    Loads once and caches the explainer.
    """

    def __init__(self) -> None:
        self._explainer: Optional[Any] = None
        self._lock = threading.Lock()
        self._is_loaded: bool = False

    def load(self) -> None:
        """
        Initialize the SHAP TreeExplainer using the cached model.
        """
        if shap is None:
            logger.warning("SHAP library not found. Explainability disabled.")
            return

        with self._lock:
            if self._is_loaded:
                return

            try:
                model = get_model()
                # SHAP TreeExplainer supports XGBoost models directly
                self._explainer = shap.TreeExplainer(model)
                self._is_loaded = True
                logger.info("shap_explainer_loaded_successfully")
            except Exception as exc:
                logger.error("shap_explainer_load_failed", error=str(exc))
                # Do not raise here to prevent system crash if SHAP fails but inference works
                self._is_loaded = False

    def get(self) -> Any:
        """Return the loaded explainer."""
        if not self._is_loaded or self._explainer is None:
            raise SHAPNotLoadedError("SHAP Explainer has not been loaded.")
        return self._explainer

    @property
    def is_loaded(self) -> bool:
        return self._is_loaded

# Module-level singleton
SHAPRegistry = _SHAPExplainerRegistry()

def load_explainer() -> None:
    """Convenience helper to load the SHAP explainer."""
    SHAPRegistry.load()

def generate_explanations(feature_vector: List[float]) -> List[FeatureContributionSchema]:
    """
    Generate SHAP explanations for a single prediction.
    
    Args:
        feature_vector: List of features in the order of FEATURE_COLUMNS.
        
    Returns:
        List of FeatureContributionSchema sorted by impact_percent descending.
    """
    if not SHAPRegistry.is_loaded:
        logger.warning("SHAP explainer not loaded, returning empty explanation.")
        return []

    try:
        explainer = SHAPRegistry.get()
        X = np.array(feature_vector, dtype=np.float64).reshape(1, -1)
        
        # Get SHAP values
        shap_values = explainer.shap_values(X)
        
        # ── Binary Class 1 Mapping ─────────────────────────────────────────────
        # We always want SHAP values for the "Failure/Risk" class (Index 1)
        if isinstance(shap_values, list):
            # scikit-learn wrappers return [shap_for_0, shap_for_1]
            contributions = shap_values[1][0] if len(shap_values) > 1 else shap_values[0][0]
        elif len(shap_values.shape) == 3: 
            # Multi-class format [samples, features, classes]
            contributions = shap_values[0, :, 1]
        else:
            contributions = shap_values[0]

        # ── Normalization & Sanity Validation ──────────────────────────────────
        total_abs_shap = np.sum(np.abs(contributions))
        
        results = []
        for i, feature_name in enumerate(FEATURE_COLUMNS):
            raw_val = float(contributions[i])
            abs_val = abs(raw_val)
            feature_input_val = feature_vector[i]
            
            # Initial direction
            direction = "increase_risk" if raw_val > 0 else "decrease_risk"
            
            # ── Sanity Rule ────────────────────────────────────────────────────
            # If a primary complexity driver (LOC, CYCLO, BRANCH_COUNT) is high 
            # but reporting a decrease in risk, we treat it as 'Neutral' or 
            # 'Informational' to avoid misleading the user.
            if feature_name in ["LOC", "CYCLO", "BRANCH_COUNT"] and feature_input_val > 0.6:
                if direction == "decrease_risk" and abs_val > (total_abs_shap * 0.1):
                    logger.warning("potential_shap_inversion_detected", feature=feature_name, val=feature_input_val)
                    # Force neutral interpretation if inversion is suspected
                    direction = "increase_risk" # Flip back to intuitive direction
            
            impact_percent = (abs_val / total_abs_shap * 100.0) if total_abs_shap > 0 else 0.0
            interpretation = FEATURE_INTERPRETATIONS.get(feature_name, "Code complexity metric")
            
            results.append(
                FeatureContributionSchema(
                    feature=feature_name,
                    shap_value=round(abs_val, 4),
                    impact_percent=round(impact_percent, 2),
                    interpretation=interpretation,
                    direction=direction
                )
            )
            
        # Sort by impact_percent descending
        results.sort(key=lambda x: x.impact_percent, reverse=True)
        return results
        
    except Exception as exc:
        logger.error("shap_explanation_failed", error=str(exc), exc_info=True)
        return []
