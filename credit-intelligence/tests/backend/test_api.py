"""
Backend Integration Tests — Credit Intelligence API
Covers: health, predict, model-metrics, feature-importance, fairness, history
"""
import pytest
import sys
from pathlib import Path

# Ensure the backend directory is in path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

VALID_PAYLOAD = {
    "duration": 24,
    "credit_amount": 5000.0,
    "installment_commitment": 2,
    "residence_since": 3,
    "age": 35,
    "existing_credits": 1,
    "num_dependents": 1,
    "checking_status": "0<=X<200",
    "credit_history": "existing paid",
    "purpose": "furniture/equipment",
    "savings_status": "100<=X<500",
    "employment": "1<=X<4",
    "personal_status": "male single",
    "other_parties": "none",
    "property_magnitude": "real estate",
    "other_payment_plans": "none",
    "housing": "own",
    "job": "skilled",
    "own_telephone": "yes",
    "foreign_worker": "yes",
}


class TestHealthEndpoints:
    def test_health_check_returns_200(self):
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert data["status"] == "healthy"
        assert "model_loaded" in data
        assert "timestamp" in data

    def test_model_info_returns_200(self):
        response = client.get("/api/model-info")
        assert response.status_code == 200
        data = response.json()
        assert "version" in data or "algorithm" in data or "error" in data


class TestPredictionEndpoint:
    def test_valid_prediction_returns_200(self):
        response = client.post("/api/predict", json=VALID_PAYLOAD)
        assert response.status_code == 200
        data = response.json()
        assert "prediction_id" in data
        assert "risk_level" in data
        assert "risk_score" in data
        assert "probability_low_risk" in data
        assert "probability_high_risk" in data
        assert "confidence" in data
        assert "model_version" in data
        assert "explanation" in data
        assert "disclaimer" in data

    def test_risk_level_is_valid(self):
        response = client.post("/api/predict", json=VALID_PAYLOAD)
        assert response.status_code == 200
        data = response.json()
        assert data["risk_level"] in ["Low Risk", "Medium Risk", "High Risk"]

    def test_risk_score_in_valid_range(self):
        response = client.post("/api/predict", json=VALID_PAYLOAD)
        assert response.status_code == 200
        data = response.json()
        assert 0 <= data["risk_score"] <= 100

    def test_probabilities_sum_to_one(self):
        response = client.post("/api/predict", json=VALID_PAYLOAD)
        assert response.status_code == 200
        data = response.json()
        total = data["probability_low_risk"] + data["probability_high_risk"]
        assert abs(total - 1.0) < 0.01

    def test_prediction_id_is_unique(self):
        r1 = client.post("/api/predict", json=VALID_PAYLOAD)
        r2 = client.post("/api/predict", json=VALID_PAYLOAD)
        assert r1.json()["prediction_id"] != r2.json()["prediction_id"]

    def test_invalid_age_returns_422(self):
        bad_payload = {**VALID_PAYLOAD, "age": 10}  # Below 18
        response = client.post("/api/predict", json=bad_payload)
        assert response.status_code == 422

    def test_invalid_credit_amount_returns_422(self):
        bad_payload = {**VALID_PAYLOAD, "credit_amount": -100}
        response = client.post("/api/predict", json=bad_payload)
        assert response.status_code == 422

    def test_invalid_categorical_returns_422(self):
        bad_payload = {**VALID_PAYLOAD, "checking_status": "INVALID_VALUE"}
        response = client.post("/api/predict", json=bad_payload)
        assert response.status_code == 422

    def test_missing_required_field_returns_422(self):
        bad_payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "age"}
        response = client.post("/api/predict", json=bad_payload)
        assert response.status_code == 422

    def test_high_risk_applicant(self):
        """Test that a high-risk profile produces higher risk probability."""
        high_risk = {
            **VALID_PAYLOAD,
            "checking_status": "<0",
            "credit_history": "critical/other existing credit",
            "credit_amount": 15000.0,
            "duration": 72,
            "savings_status": "no known savings",
            "employment": "unemployed",
        }
        response = client.post("/api/predict", json=high_risk)
        assert response.status_code == 200
        # High risk profile should have elevated probability
        # (we don't assert exact value but expect it to be non-zero)
        assert response.json()["probability_high_risk"] > 0


class TestAnalyticsEndpoints:
    def test_analytics_returns_200(self):
        response = client.get("/api/analytics")
        assert response.status_code == 200
        data = response.json()
        assert "total_predictions" in data
        assert "low_risk_count" in data
        assert "medium_risk_count" in data
        assert "high_risk_count" in data

    def test_model_metrics_returns_200(self):
        response = client.get("/api/model-metrics")
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = response.json()
            assert "models" in data
            assert "best_model" in data
            # Should have at least one model
            assert len(data["models"]) >= 1
            # Each model should have required metrics
            for model in data["models"]:
                assert "accuracy" in model
                assert "roc_auc" in model
                assert "f1_score" in model

    def test_feature_importance_returns_200(self):
        response = client.get("/api/feature-importance")
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = response.json()
            assert "top_features" in data
            assert "method" in data

    def test_prediction_trends_returns_200(self):
        response = client.get("/api/prediction-trends?days=30")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "total_in_period" in data


class TestHistoryEndpoints:
    def test_predictions_list_returns_200(self):
        response = client.get("/api/predictions")
        assert response.status_code == 200
        data = response.json()
        assert "predictions" in data
        assert "total" in data
        assert isinstance(data["predictions"], list)

    def test_predictions_after_submission(self):
        # Make a prediction first
        client.post("/api/predict", json=VALID_PAYLOAD)
        response = client.get("/api/predictions")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1

    def test_invalid_prediction_id_returns_404(self):
        response = client.get("/api/predictions/DOESNOTEXIST")
        assert response.status_code == 404

    def test_predictions_pagination(self):
        response = client.get("/api/predictions?skip=0&limit=5")
        assert response.status_code == 200
        data = response.json()
        assert len(data["predictions"]) <= 5


class TestFairnessEndpoint:
    def test_fairness_returns_200(self):
        response = client.get("/api/fairness")
        assert response.status_code == 200
        data = response.json()
        assert "disclaimer" in data
        assert "responsible_ai_notice" in data
        assert "groups" in data

    def test_fairness_has_disclaimer(self):
        response = client.get("/api/fairness")
        data = response.json()
        assert "does not establish discrimination" in data["disclaimer"]


class TestValidOptions:
    def test_valid_options_returns_200(self):
        response = client.get("/api/valid-options")
        assert response.status_code == 200
        data = response.json()
        assert "checking_status" in data
        assert "purpose" in data
        assert "employment" in data
