"""Health check endpoints."""
from fastapi import APIRouter
from datetime import datetime
from app.ml.predictor import model_service

router = APIRouter()


@router.get("/health", summary="Health Check", description="Check API health status.")
async def health_check():
    model_loaded = model_service._loaded
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "model_loaded": model_loaded,
        "model_version": (
            model_service.model_version.get("version", "unknown")
            if model_loaded and model_service.model_version else "not loaded"
        ),
        "service": "Credit Intelligence API",
        "api_version": "1.0.0",
    }


@router.get("/model-info", summary="Model Information", description="Get details about the deployed ML model.")
async def model_info():
    info = model_service.get_model_info()
    if not info:
        return {"error": "Model not loaded"}
    return info
