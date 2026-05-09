#!/usr/bin/env python
"""
scripts/generate_test_model.py
-------------------------------
Generates a synthetic XGBoost classifier trained on random data
and saves it as app/ml/artifacts/model.pkl.

Purpose:
  - Local development when the real trained model is not yet available
  - CI/CD test pipelines

Usage:
  cd backend/
  python scripts/generate_test_model.py

Requirements (dev deps):
  pip install -r requirements/dev.txt
"""

import sys
from pathlib import Path

import joblib
import numpy as np
from xgboost import XGBClassifier

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
REPO_ROOT = Path(__file__).resolve().parent.parent
ARTIFACTS_DIR = REPO_ROOT / "app" / "ml" / "artifacts"
OUTPUT_PATH = ARTIFACTS_DIR / "model.pkl"

# ---------------------------------------------------------------------------
# Feature definition (must match FEATURE_COLUMNS in schemas/prediction.py)
# ---------------------------------------------------------------------------
FEATURE_COLUMNS = [
    "LOC",
    "CYCLO",
    "LENGTH",
    "VOLUME",
    "DIFFICULTY",
    "INT_FAN_IN",
    "INT_FAN_OUT",
    "NUM_OPERATORS",
    "NUM_OPERANDS",
    "BRANCH_COUNT",
]

N_FEATURES = len(FEATURE_COLUMNS)
N_SAMPLES = 1000
RANDOM_SEED = 42


def generate_synthetic_data(
    n_samples: int = N_SAMPLES,
    n_features: int = N_FEATURES,
    seed: int = RANDOM_SEED,
) -> tuple[np.ndarray, np.ndarray]:
    """
    Generate normalized feature matrix and binary labels.
    Features in [0.0, 1.0]; label skewed toward 0 (realistic class imbalance).
    """
    rng = np.random.default_rng(seed)
    X = rng.uniform(low=0.0, high=1.0, size=(n_samples, n_features))

    # Simulate defect risk: higher values in first 3 cols → higher risk
    risk_signal = X[:, 0] * 0.4 + X[:, 1] * 0.35 + X[:, 2] * 0.25
    y = (risk_signal > 0.55).astype(int)

    print(f"  Samples: {n_samples}")
    print(f"  Features: {n_features}  →  {FEATURE_COLUMNS}")
    print(f"  Class distribution — 0: {(y == 0).sum()}  1: {(y == 1).sum()}")
    return X, y


def train_model(X: np.ndarray, y: np.ndarray) -> XGBClassifier:
    """Train a lightweight XGBoost classifier."""
    model = XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.1,
        use_label_encoder=False,
        eval_metric="logloss",
        random_state=RANDOM_SEED,
    )
    model.fit(X, y)
    return model


def save_model(model: XGBClassifier, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, path)
    size_kb = path.stat().st_size / 1024
    print(f"  Saved → {path}  ({size_kb:.1f} KB)")


def smoke_test(model: XGBClassifier) -> None:
    """Quick sanity check — 5 random samples."""
    rng = np.random.default_rng(99)
    X_test = rng.uniform(0.0, 1.0, size=(5, N_FEATURES))
    preds = model.predict(X_test)
    probas = model.predict_proba(X_test)[:, 1]
    print("\n  Smoke test (5 random samples):")
    for i, (pred, prob) in enumerate(zip(preds, probas)):
        risk = round(prob * 100, 1)
        print(f"    [{i}] prediction={pred}  probability={prob:.4f}  risk_score={risk}")


def main() -> int:
    print("=" * 55)
    print("  Synthetic Risk Model Generator")
    print("=" * 55)

    print("\n[1/4] Generating synthetic training data …")
    X, y = generate_synthetic_data()

    print("\n[2/4] Training XGBoost classifier …")
    model = train_model(X, y)
    print(f"  Model type: {type(model).__name__}")

    print("\n[3/4] Running smoke test …")
    smoke_test(model)

    print("\n[4/4] Saving model …")
    save_model(model, OUTPUT_PATH)

    print("\n✅  Done. Model is ready for inference.")
    print(f"    Path: {OUTPUT_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
