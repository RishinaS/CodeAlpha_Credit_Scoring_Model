"""
ML Model Predictor Service
Loads trained model at startup and provides prediction with SHAP explanations.
"""
import json
import uuid
import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime
from typing import Optional
import joblib
import shap

from app.core.config import settings


class ModelService:
    """Singleton service for ML model inference."""

    def __init__(self):
        self.pipeline = None
        self.preprocessor = None
        self.model_version = None
        self.model_metrics = None
        self.feature_metadata = None
        self.fairness_data = None
        self.explainer = None
        self.shap_available = False
        self._loaded = False
        self.models_dir = Path(settings.models_dir)

    def load_model(self):
        """Load model artifacts from disk."""
        if self._loaded:
            return

        model_path = self.models_dir / "credit_model.joblib"
        if not model_path.exists():
            raise FileNotFoundError(
                f"Model file not found at {model_path}. "
                "Please run: python -m app.ml.train"
            )

        self.pipeline = joblib.load(model_path)
        self.preprocessor = self.pipeline.named_steps["preprocessor"]

        # Load metadata
        version_path = self.models_dir / "model_version.json"
        if version_path.exists():
            with open(version_path) as f:
                self.model_version = json.load(f)

        metrics_path = self.models_dir / "model_metrics.json"
        if metrics_path.exists():
            with open(metrics_path) as f:
                self.model_metrics = json.load(f)

        feature_path = self.models_dir / "feature_metadata.json"
        if feature_path.exists():
            with open(feature_path) as f:
                self.feature_metadata = json.load(f)

        fairness_path = self.models_dir / "fairness_analysis.json"
        if fairness_path.exists():
            with open(fairness_path) as f:
                self.fairness_data = json.load(f)

        # Try to set up SHAP explainer
        try:
            classifier = self.pipeline.named_steps["classifier"]
            self.explainer = shap.TreeExplainer(classifier)
            self.shap_available = True
        except Exception:
            try:
                classifier = self.pipeline.named_steps["classifier"]
                # For linear models, we'll compute on-the-fly
                self.shap_available = False
            except Exception:
                self.shap_available = False

        self._loaded = True
        print(f"[OK] Model loaded: {self.model_version.get('version', 'unknown') if self.model_version else 'unknown'}")

    def _build_dataframe(self, input_data: dict) -> pd.DataFrame:
        """Build a properly structured DataFrame from API input."""
        numerical_features = self.model_version["features_numerical"]
        categorical_features = self.model_version["features_categorical"]

        row = {}
        for feat in numerical_features:
            row[feat] = input_data.get(feat, np.nan)
        for feat in categorical_features:
            val = input_data.get(feat, None)
            row[feat] = str(val) if val is not None else np.nan

        df = pd.DataFrame([row])

        # Apply same engineered features as during training
        if "credit_amount" in df.columns and "duration" in df.columns:
            df["credit_per_month"] = df["credit_amount"] / df["duration"].clip(lower=1)
        if "age" in df.columns:
            df["age_group"] = pd.cut(
                df["age"].astype(float),
                bins=[0, 25, 35, 50, 100],
                labels=["young", "young_adult", "middle_aged", "senior"]
            ).astype(str)
        if "installment_commitment" in df.columns and "credit_amount" in df.columns:
            df["installment_to_credit"] = (
                df["installment_commitment"] / df["credit_amount"].clip(lower=1) * 1000
            )

        return df

    def predict(self, input_data: dict) -> dict:
        """Run credit risk prediction with explanation."""
        if not self._loaded:
            self.load_model()

        df = self._build_dataframe(input_data)
        prediction_id = str(uuid.uuid4())[:8].upper()

        # Get prediction
        prediction_proba = self.pipeline.predict_proba(df)[0]
        predicted_class = int(self.pipeline.predict(df)[0])

        prob_low = float(prediction_proba[0])
        prob_high = float(prediction_proba[1])

        # Risk classification
        # Probability of high risk → risk score (0–100)
        risk_score = round(prob_high * 100)

        if prob_high < 0.35:
            risk_level = "Low Risk"
        elif prob_high < 0.60:
            risk_level = "Medium Risk"
        else:
            risk_level = "High Risk"

        # Risk score bands (for display)
        if risk_score <= 30:
            risk_band = "Low"
        elif risk_score <= 60:
            risk_band = "Medium"
        else:
            risk_band = "High"

        confidence = max(prob_low, prob_high)

        # Explanation via SHAP or feature importance
        explanation = self._explain(df, predicted_class)

        return {
            "prediction_id": prediction_id,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "risk_level": risk_level,
            "risk_band": risk_band,
            "risk_score": risk_score,
            "probability_low_risk": round(prob_low, 4),
            "probability_high_risk": round(prob_high, 4),
            "confidence": round(confidence, 4),
            "model_version": self.model_version.get("version", "v1.0") if self.model_version else "v1.0",
            "algorithm": self.model_version.get("algorithm", "unknown") if self.model_version else "unknown",
            "explanation": explanation,
            "disclaimer": (
                "This is an experimental AI-based risk estimate for educational and analytical purposes. "
                "It is NOT a substitute for professional financial assessment or official credit-bureau scoring."
            )
        }

    def _explain(self, df: pd.DataFrame, predicted_class: int) -> dict:
        """Generate SHAP or importance-based explanation."""
        numerical_features = self.model_version["features_numerical"]
        categorical_features = self.model_version["features_categorical"]

        try:
            # Transform input
            X_transformed = self.preprocessor.transform(df)

            if self.shap_available and self.explainer is not None:
                shap_values = self.explainer.shap_values(X_transformed)
                if isinstance(shap_values, list):
                    sv = shap_values[1][0]  # class 1 (high risk) SHAP values
                else:
                    sv = shap_values[0]

                # Get transformed feature names
                ohe = self.preprocessor.named_transformers_["cat"]["encoder"]
                ohe_names = ohe.get_feature_names_out(categorical_features)
                feat_names = list(numerical_features) + list(ohe_names)
                feat_names_clipped = feat_names[:len(sv)]

                factor_list = sorted(
                    zip(feat_names_clipped, sv.tolist()),
                    key=lambda x: abs(x[1]),
                    reverse=True
                )

                increasing_risk = [
                    {"feature": f, "shap_value": round(v, 4), "direction": "increases_risk"}
                    for f, v in factor_list if v > 0.005
                ][:5]
                decreasing_risk = [
                    {"feature": f, "shap_value": round(v, 4), "direction": "decreases_risk"}
                    for f, v in factor_list if v < -0.005
                ][:5]

                return {
                    "method": "SHAP TreeExplainer",
                    "increasing_risk_factors": increasing_risk,
                    "decreasing_risk_factors": decreasing_risk,
                    "top_factors": factor_list[:8],
                }
            else:
                # Fall back to global feature importance
                if self.feature_metadata:
                    top_feats = self.feature_metadata.get("top_10_features", [])
                    return {
                        "method": "Feature Importance (Global)",
                        "increasing_risk_factors": [
                            {"feature": f["feature"], "importance": f["importance"], "direction": "increases_risk"}
                            for f in top_feats[:5]
                        ],
                        "decreasing_risk_factors": [],
                        "top_factors": top_feats,
                        "note": "Instance-level SHAP not available for this model type. Showing global feature importances."
                    }
                return {"method": "unavailable", "top_factors": []}

        except Exception as e:
            return {
                "method": "error",
                "error": str(e),
                "top_factors": []
            }

    def get_global_feature_importance(self) -> list:
        """Return global feature importance from metadata."""
        if not self.feature_metadata:
            return []
        return self.feature_metadata.get("top_10_features", [])

    def get_model_metrics(self) -> dict:
        """Return model metrics."""
        return self.model_metrics or {}

    def get_model_info(self) -> dict:
        """Return model version info."""
        return self.model_version or {}

    def get_fairness_data(self) -> dict:
        """Return fairness analysis results."""
        return self.fairness_data or {}


# Singleton instance
model_service = ModelService()
