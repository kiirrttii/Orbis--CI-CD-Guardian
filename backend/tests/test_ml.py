"""
Tests for the ML inference layer.

Covers:
  - risk_scoring: compute_risk_score, classify_severity
  - model_loader: load/get/unload cycle
  - predictor: predict_single, predict_batch
  - API: POST /predict, POST /predict/batch, GET /model/status
"""

import os
from pathlib import Path
from unittest.mock import MagicMock, patch

import numpy as np
import pytest

from app.ml.risk_scoring import (
    RiskSeverity,
    classify_severity,
    compute_risk_score,
    score_and_classify,
)

# ---------------------------------------------------------------------------
# Risk scoring unit tests
# ---------------------------------------------------------------------------


class TestComputeRiskScore:
    def test_zero_probability(self):
        assert compute_risk_score(0.0) == 10.0

    def test_full_probability(self):
        assert compute_risk_score(1.0) == 100.0

    def test_midpoint(self):
        assert compute_risk_score(0.5) == 55.0

    def test_rounding(self):
        # 10 + (0.8253 * 90) = 10 + 74.277 = 84.277 -> 84.28
        assert compute_risk_score(0.8253) == 84.28

    def test_out_of_range_raises(self):
        with pytest.raises(ValueError):
            compute_risk_score(1.1)

    def test_negative_raises(self):
        with pytest.raises(ValueError):
            compute_risk_score(-0.01)


class TestClassifySeverity:
    @pytest.mark.parametrize(
        "score, expected",
        [
            (0.0, RiskSeverity.LOW),
            (15.0, RiskSeverity.LOW),
            (29.9, RiskSeverity.LOW),
            (30.0, RiskSeverity.MEDIUM),
            (45.0, RiskSeverity.MEDIUM),
            (59.9, RiskSeverity.MEDIUM),
            (60.0, RiskSeverity.HIGH),
            (70.0, RiskSeverity.HIGH),
            (79.9, RiskSeverity.HIGH),
            (80.0, RiskSeverity.CRITICAL),
            (95.0, RiskSeverity.CRITICAL),
            (100.0, RiskSeverity.CRITICAL),
        ],
    )
    def test_thresholds(self, score, expected):
        assert classify_severity(score) == expected


class TestScoreAndClassify:
    def test_returns_tuple(self):
        score, severity, conf, level = score_and_classify({}, 0.9)
        # 10 + (0.9 * 90) + refinement (-3.0 if no features)
        # wait, refinement = (0.9 - 0.5) * 30 = 0.4 * 30 = 12.0
        # heuristic base = 15.0 (no features)
        # final = 15 + 12 = 27.0
        assert score == 27.0
        assert severity == RiskSeverity.LOW

    def test_low_severity(self):
        _, severity, _, _ = score_and_classify({}, 0.1)
        assert severity == RiskSeverity.LOW


# ---------------------------------------------------------------------------
# Model loader tests
# ---------------------------------------------------------------------------

class TestModelRegistry:
    def setup_method(self):
        """Ensure clean registry state before each test."""
        from app.ml.model_loader import ModelRegistry
        ModelRegistry.unload()

    def test_get_before_load_raises(self):
        from app.ml.model_loader import ModelNotLoadedError, ModelRegistry
        with pytest.raises(ModelNotLoadedError):
            ModelRegistry.get()

    def test_load_missing_file_raises(self):
        from app.ml.model_loader import ModelLoadError, ModelRegistry
        with pytest.raises(ModelLoadError):
            ModelRegistry.load(Path("/nonexistent/path/model.pkl"))

    def test_load_and_get(self, tmp_path):
        import joblib
        from sklearn.dummy import DummyClassifier
        from app.ml.model_loader import ModelRegistry

        # Create a tiny dummy sklearn model and save it
        dummy = DummyClassifier(strategy="most_frequent")
        dummy.fit([[0] * 10], [0])
        model_path = tmp_path / "model.pkl"
        joblib.dump(dummy, model_path)

        ModelRegistry.load(model_path)
        assert ModelRegistry.is_loaded
        assert isinstance(ModelRegistry.get(), DummyClassifier)

    def test_load_idempotent(self, tmp_path):
        import joblib
        from sklearn.dummy import DummyClassifier
        from app.ml.model_loader import ModelRegistry

        dummy = DummyClassifier()
        dummy.fit([[0] * 10], [0])
        model_path = tmp_path / "model.pkl"
        joblib.dump(dummy, model_path)

        ModelRegistry.load(model_path)
        ModelRegistry.load(model_path)  # second call — should not raise
        assert ModelRegistry.is_loaded


# ---------------------------------------------------------------------------
# Predictor tests
# ---------------------------------------------------------------------------

def _make_mock_model(probability: float = 0.75, prediction: int = 1):
    """Build a mock sklearn-compatible model."""
    mock = MagicMock()
    mock.predict.return_value = np.array([prediction])
    mock.predict_proba.return_value = np.array([[1 - probability, probability]])
    return mock


def _sample_payload() -> dict:
    return {
        "LOC": 0.5,
        "CYCLO": 0.4,
        "LENGTH": 0.6,
        "VOLUME": 0.55,
        "DIFFICULTY": 0.7,
        "INT_FAN_IN": 0.2,
        "INT_FAN_OUT": 0.3,
        "NUM_OPERATORS": 0.45,
        "NUM_OPERANDS": 0.35,
        "BRANCH_COUNT": 0.5,
    }


class TestPredictSingle:
    def test_returns_correct_structure(self):
        from app.ml.predictor import predict_single
        from app.schemas.prediction import PredictionRequest

        request = PredictionRequest(**_sample_payload())

        with patch("app.ml.predictor.get_model", return_value=_make_mock_model(0.82)):
            result = predict_single(request)

        assert result.prediction == 1
        assert abs(result.probability - 0.82) < 0.001
        # Hybrid score for _sample_payload + 0.82 prob
        # Heuristic: 15 + 0.5*20 + 0.4*20 + 0.3*15 + 0.5*15 + 0.55*15 + 0.7*15 = 15+10+8+4.5+7.5+8.25+10.5 = 63.75
        # ML Refinement: (0.82 - 0.5) * 30 = 9.6
        # Final: 63.75 + 9.6 = 73.35
        assert result.risk_score == 73.35
        assert result.severity == RiskSeverity.HIGH

    def test_low_probability_gives_low_severity(self):
        from app.ml.predictor import predict_single
        from app.schemas.prediction import PredictionRequest

        request = PredictionRequest(**_sample_payload())

        with patch(
            "app.ml.predictor.get_model",
            return_value=_make_mock_model(0.1, prediction=0),
        ):
            result = predict_single(request)

        assert result.severity == RiskSeverity.LOW


class TestPredictBatch:
    def test_batch_returns_correct_count(self):
        from app.ml.predictor import predict_batch
        from app.schemas.prediction import BatchPredictionRequest, PredictionRequest

        payload = [PredictionRequest(**_sample_payload()) for _ in range(3)]
        request = BatchPredictionRequest(instances=payload)

        mock_model = MagicMock()
        mock_model.predict.return_value = np.array([1, 0, 1])
        mock_model.predict_proba.return_value = np.array(
            [[0.2, 0.8], [0.9, 0.1], [0.3, 0.7]]
        )

        with patch("app.ml.predictor.get_model", return_value=mock_model):
            result = predict_batch(request)

        assert result.total == 3
        assert len(result.predictions) == 3
        assert result.predictions[0].severity == RiskSeverity.CRITICAL
        assert result.predictions[1].severity == RiskSeverity.LOW


# ---------------------------------------------------------------------------
# API endpoint tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_model_status_not_loaded(client):
    from app.ml.model_loader import ModelRegistry
    ModelRegistry.unload()

    response = await client.get("/api/v1/predictions/model/status")
    assert response.status_code == 200
    assert response.json()["model_loaded"] is False


@pytest.mark.asyncio
async def test_predict_returns_503_when_model_not_loaded(client):
    from app.ml.model_loader import ModelRegistry
    ModelRegistry.unload()

    response = await client.post("/api/v1/predictions/predict", json=_sample_payload())
    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "MODEL_NOT_LOADED"


@pytest.mark.asyncio
async def test_predict_returns_200_with_mock_model(client):
    from app.ml.model_loader import ModelRegistry
    ModelRegistry.unload()

    mock = _make_mock_model(0.65)

    with patch("app.ml.predictor.get_model", return_value=mock):
        # Temporarily mark as loaded so the endpoint doesn't 503
        with patch.object(ModelRegistry, "_is_loaded", True):
            response = await client.post(
                "/api/v1/predictions/predict", json=_sample_payload()
            )

    assert response.status_code == 200
    body = response.json()
    assert "risk_score" in body
    assert "severity" in body
    assert body["severity"] in ("LOW", "MEDIUM", "HIGH", "CRITICAL")


@pytest.mark.asyncio
async def test_predict_validates_features(client):
    """Feature value > 1.0 should return 422."""
    bad_payload = {**_sample_payload(), "LOC": 1.5}  # out of range
    response = await client.post("/api/v1/predictions/predict", json=bad_payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_predict_missing_feature_returns_422(client):
    payload = _sample_payload()
    del payload["CYCLO"]
    response = await client.post("/api/v1/predictions/predict", json=payload)
    assert response.status_code == 422
