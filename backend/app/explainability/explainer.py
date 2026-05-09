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
                raise RuntimeError(f"Failed to load SHAP explainer: {exc}") from exc

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

    explainer = SHAPRegistry.get()
    X = np.array(feature_vector, dtype=np.float64).reshape(1, -1)
    
    try:
        # shap_values returns an array of shape (1, num_features) for binary classification
        shap_values = explainer.shap_values(X)
        
        # Depending on SHAP version and model, it might return a list for each class.
        # We usually want the positive class (index 1) or it just returns a 2D array.
        if isinstance(shap_values, list):
            # Binary classification usually has 2 elements in the list
            if len(shap_values) > 1:
                contributions = shap_values[1][0]
            else:
                contributions = shap_values[0][0]
        else:
            if len(shap_values.shape) == 3: # (num_samples, num_features, num_classes)
                contributions = shap_values[0, :, 1]
            else: # (num_samples, num_features)
                contributions = shap_values[0]

        total_abs_shap = np.sum(np.abs(contributions))
        
        results = []
        for i, feature_name in enumerate(FEATURE_COLUMNS):
            raw_val = float(contributions[i])
            abs_val = abs(raw_val)
            
            # direction mapping
            direction = "increase_risk" if raw_val > 0 else "decrease_risk"
            
            impact_percent = (abs_val / total_abs_shap * 100.0) if total_abs_shap > 0 else 0.0
            
            results.append(
                FeatureContributionSchema(
                    feature=feature_name,
                    shap_value=round(abs_val, 4),
                    impact_percent=round(impact_percent, 2),
                    direction=direction
                )
            )
            
        # Sort by impact_percent descending
        results.sort(key=lambda x: x.impact_percent, reverse=True)
        return results
        
    except Exception as exc:
        logger.error("shap_explanation_failed", error=str(exc), exc_info=True)
        return []
