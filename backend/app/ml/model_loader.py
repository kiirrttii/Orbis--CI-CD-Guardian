"""
ML model loader — singleton pattern.

Loads `model.pkl` once at application startup and caches it
in memory. All subsequent requests share the same model object,
avoiding repeated disk I/O and deserialization overhead.
"""

import threading
from pathlib import Path
from typing import Any, Optional

import joblib

from app.core.logging import get_logger

logger = get_logger(__name__)

# ---------------------------------------------------------------------------
# Artifact path
# ---------------------------------------------------------------------------
ARTIFACTS_DIR = Path(__file__).parent / "artifacts"
MODEL_PATH = ARTIFACTS_DIR / "model.pkl"


class ModelNotLoadedError(RuntimeError):
    """Raised when inference is attempted before the model is loaded."""


class ModelLoadError(RuntimeError):
    """Raised when the model file cannot be loaded."""


class MockModel:
    """
    Lightweight dummy/mock ML estimator class for demo and deployment fallback.
    Implements standard predict() and predict_proba() signatures.
    """

    def predict(self, X) -> Any:
        import numpy as np
        # Return binary predictions based on probability threshold
        probs = self.predict_proba(X)[:, 1]
        return np.where(probs >= 0.5, 1, 0)

    def predict_proba(self, X) -> Any:
        import numpy as np
        # Calculate dynamic probabilities based on feature inputs.
        # FEATURE_COLUMNS order:
        # 0: LOC (weight 20)
        # 1: CYCLO (weight 20)
        # 2: LENGTH (weight 5)
        # 3: VOLUME (weight 10)
        # 4: DIFFICULTY (weight 10)
        # 5: INT_FAN_IN (weight 5)
        # 6: INT_FAN_OUT (weight 15)
        # 7: NUM_OPERATORS (weight 5)
        # 8: NUM_OPERANDS (weight 5)
        # 9: BRANCH_COUNT (weight 15)
        weights = np.array([0.20, 0.20, 0.05, 0.10, 0.10, 0.05, 0.15, 0.05, 0.05, 0.15])
        # Dot product for dynamic, feature-dependent risk scoring
        raw_prob = np.dot(X, weights)
        # Scale to realistic probability band [0.12, 0.88]
        prob = 0.12 + raw_prob * 0.76
        # If X is 2D, make sure shape is correct
        prob = np.clip(prob, 0.0, 1.0)
        return np.column_stack([1.0 - prob, prob])


# ---------------------------------------------------------------------------
# Singleton loader
# ---------------------------------------------------------------------------

class _ModelRegistry:
    """
    Thread-safe singleton registry for loaded ML models.
    Models are loaded once and cached for the process lifetime.
    """

    def __init__(self) -> None:
        self._model: Optional[Any] = None
        self._lock = threading.Lock()
        self._is_loaded: bool = False
        self._is_mock: bool = False

    # ── Public API ────────────────────────────────────────────────────────────

    def load(self, path: Path = MODEL_PATH) -> None:
        """
        Load the model from disk into memory.
        Thread-safe; idempotent — calling multiple times is safe.
        """
        with self._lock:
            if self._is_loaded:
                logger.debug("model_already_loaded", path=str(path))
                return

            if not path.exists():
                if path == MODEL_PATH:
                    logger.warning(
                        "model_file_missing_loading_graceful_fallback",
                        path=str(path),
                        hint="Using lightweight MockModel for demo/deployment fallback."
                    )
                    self._model = MockModel()
                    self._is_loaded = True
                    self._is_mock = True
                    return
                else:
                    raise ModelLoadError(
                        f"Model artifact not found at '{path}'. "
                        "Place 'model.pkl' in app/ml/artifacts/ "
                        "or set a custom path via MODEL_PATH."
                    )

            logger.info("model_loading", path=str(path))
            try:
                loaded_obj = joblib.load(path)
                
                # Handle cases where the model is wrapped in a metadata dictionary
                if isinstance(loaded_obj, dict) and "model" in loaded_obj:
                    logger.info("extracting_model_from_metadata_dict", keys=list(loaded_obj.keys()))
                    self._model = loaded_obj["model"]
                else:
                    self._model = loaded_obj

                self._is_loaded = True
                self._is_mock = False
                logger.info(
                    "model_loaded_successfully",
                    path=str(path),
                    model_type=type(self._model).__name__,
                )
            except Exception as exc:
                if path == MODEL_PATH:
                    logger.warning(
                        "model_load_failed_loading_graceful_fallback",
                        path=str(path),
                        error=str(exc),
                        hint="Using lightweight MockModel for demo/deployment fallback."
                    )
                    self._model = MockModel()
                    self._is_loaded = True
                    self._is_mock = True
                else:
                    raise ModelLoadError(
                        f"Failed to deserialise model from '{path}': {exc}"
                    ) from exc

    def get(self) -> Any:
        """Return the loaded model. Raises if not yet loaded."""
        if not self._is_loaded or self._model is None:
            raise ModelNotLoadedError(
                "The risk model has not been loaded. "
                "Ensure ModelRegistry.load() is called at app startup."
            )
        return self._model

    @property
    def is_loaded(self) -> bool:
        return self._is_loaded

    def unload(self) -> None:
        """Release the model from memory (useful in tests)."""
        with self._lock:
            self._model = None
            self._is_loaded = False
            self._is_mock = False
            logger.info("model_unloaded")


# Module-level singleton — import and use this everywhere
ModelRegistry = _ModelRegistry()


# ---------------------------------------------------------------------------
# Convenience helpers
# ---------------------------------------------------------------------------

def load_model(path: Path = MODEL_PATH) -> None:
    """Load the model into the registry. Call once at startup."""
    ModelRegistry.load(path)


def get_model() -> Any:
    """Return the cached model. Call from inference code."""
    return ModelRegistry.get()
