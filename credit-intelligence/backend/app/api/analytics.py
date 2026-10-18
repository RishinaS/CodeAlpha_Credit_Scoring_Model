"""
Analytics API endpoints.
GET /api/analytics          — Prediction distribution stats
GET /api/model-metrics      — ML model comparison metrics
GET /api/feature-importance — Feature importance
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from app.database.db import get_db, PredictionRecord
from app.ml.predictor import model_service

router = APIRouter()


@router.get(
    "/analytics",
    summary="Prediction Analytics",
    description="Get aggregated analytics from all stored predictions."
)
async def get_analytics(db: Session = Depends(get_db)):
    total = db.query(PredictionRecord).count()

    if total == 0:
        model_info = model_service.get_model_info()
        return {
            "total_predictions": 0,
            "low_risk_count": 0,
            "medium_risk_count": 0,
            "high_risk_count": 0,
            "low_risk_percentage": 0.0,
            "medium_risk_percentage": 0.0,
            "high_risk_percentage": 0.0,
            "average_risk_score": 0.0,
            "model_version": model_info.get("version", "N/A") if model_info else "N/A",
            "algorithm": model_info.get("algorithm", "N/A") if model_info else "N/A",
            "message": "No predictions have been made yet."
        }

    low = db.query(PredictionRecord).filter(PredictionRecord.risk_level == "Low Risk").count()
    medium = db.query(PredictionRecord).filter(PredictionRecord.risk_level == "Medium Risk").count()
    high = db.query(PredictionRecord).filter(PredictionRecord.risk_level == "High Risk").count()
    avg_score = db.query(func.avg(PredictionRecord.risk_score)).scalar() or 0.0

    model_info = model_service.get_model_info()

    return {
        "total_predictions": total,
        "low_risk_count": low,
        "medium_risk_count": medium,
        "high_risk_count": high,
        "low_risk_percentage": round(low / total * 100, 1) if total > 0 else 0.0,
        "medium_risk_percentage": round(medium / total * 100, 1) if total > 0 else 0.0,
        "high_risk_percentage": round(high / total * 100, 1) if total > 0 else 0.0,
        "average_risk_score": round(float(avg_score), 1),
        "model_version": model_info.get("version", "N/A") if model_info else "N/A",
        "algorithm": model_info.get("algorithm", "N/A") if model_info else "N/A",
    }


@router.get(
    "/model-metrics",
    summary="Model Comparison Metrics",
    description="Get performance metrics for all trained ML models."
)
async def get_model_metrics():
    metrics = model_service.get_model_metrics()
    if not metrics:
        raise HTTPException(status_code=404, detail="Model metrics not available. Please train the model first.")

    # Format models list
    exclude_keys = {"best_model", "selection_composite_scores"}
    models_list = []
    for key, val in metrics.items():
        if key in exclude_keys:
            continue
        if isinstance(val, dict) and "accuracy" in val:
            models_list.append({
                "key": key,
                "name": val.get("name", key),
                "accuracy": val.get("accuracy"),
                "precision": val.get("precision"),
                "recall": val.get("recall"),
                "f1_score": val.get("f1_score"),
                "roc_auc": val.get("roc_auc"),
                "pr_auc": val.get("pr_auc"),
                "cv_f1_mean": val.get("cv_f1_mean"),
                "cv_f1_std": val.get("cv_f1_std"),
                "training_time_seconds": val.get("training_time_seconds"),
                "confusion_matrix": val.get("confusion_matrix"),
                "is_best": key == metrics.get("best_model"),
            })

    return {
        "models": models_list,
        "best_model": metrics.get("best_model"),
        "selection_rationale": (
            "Model selected using weighted composite score: "
            "ROC-AUC (40%) + F1 (35%) + Recall (25%). "
            "Recall is prioritized to minimize missed high-risk applicants."
        ),
        "composite_scores": metrics.get("selection_composite_scores", {}),
    }


@router.get(
    "/feature-importance",
    summary="Feature Importance",
    description="Get global feature importance from the trained model."
)
async def get_feature_importance():
    feat_meta = model_service.feature_metadata
    if not feat_meta:
        raise HTTPException(status_code=404, detail="Feature metadata not available.")

    return {
        "method": feat_meta.get("shap_method", "unknown"),
        "top_features": feat_meta.get("top_10_features", []),
        "all_importance": dict(list(feat_meta.get("feature_importance", {}).items())[:30]),
        "engineered_features": feat_meta.get("engineered_feature_descriptions", {}),
        "note": (
            "Feature importance reflects the model's learned patterns on the German Credit dataset. "
            "Higher importance = greater influence on predictions."
        )
    }


@router.get(
    "/prediction-trends",
    summary="Prediction Trends",
    description="Get prediction volume and distribution over time."
)
async def get_prediction_trends(
    days: int = Query(default=30, ge=1, le=365, description="Number of recent days to include"),
    db: Session = Depends(get_db)
):
    from datetime import datetime, timedelta
    cutoff = datetime.utcnow() - timedelta(days=days)

    records = (
        db.query(PredictionRecord)
        .filter(PredictionRecord.timestamp >= cutoff)
        .order_by(PredictionRecord.timestamp.asc())
        .all()
    )

    daily_counts = {}
    for r in records:
        date_str = r.timestamp.strftime("%Y-%m-%d")
        if date_str not in daily_counts:
            daily_counts[date_str] = {"date": date_str, "low_risk": 0, "medium_risk": 0, "high_risk": 0, "total": 0}
        risk_key = r.risk_level.lower().replace(" ", "_")
        daily_counts[date_str][risk_key] = daily_counts[date_str].get(risk_key, 0) + 1
        daily_counts[date_str]["total"] += 1

    return {
        "days": days,
        "data": list(daily_counts.values()),
        "total_in_period": len(records)
    }
