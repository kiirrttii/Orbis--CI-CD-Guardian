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
                logger.info(
                    "model_loaded_successfully",
                    path=str(path),
                    model_type=type(self._model).__name__,
                )
            except Exception as exc:
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
