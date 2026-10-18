"""
Credit Intelligence Backend
FastAPI Application Entry Point
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import predict, analytics, history, fairness, health
from app.database.db import create_tables
from app.ml.predictor import model_service
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup/shutdown lifecycle."""
    print("[START] Credit Intelligence API starting up...")
    # Create database tables
    create_tables()
    # Load ML model
    model_service.load_model()
    print("[OK] Model loaded. API ready.")
    yield
    print("[STOP] Credit Intelligence API shutting down.")


app = FastAPI(
    title="Credit Intelligence API",
    description="""
## Credit Intelligence — Explainable AI for Smarter Credit Risk Decisions

An AI-powered platform that analyzes financial information and predicts applicant credit-risk categories.

### Features
- **Credit Risk Prediction**: Low / High Risk classification with probabilities
- **Risk Scoring**: Project-specific 0–100 risk score (NOT an official CIBIL/FICO score)
- **Explainable AI**: SHAP-based feature importance explanations
- **Model Comparison**: Multiple ML algorithm performance metrics
- **Prediction History**: Stored assessment records
- **Fairness Analysis**: Statistical disparity detection

### Disclaimer
This is an experimental AI-based risk estimation tool for educational and analytical purposes.
It is NOT a substitute for professional financial assessment or official credit-bureau scoring.
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Configuration
allowed_origins = settings.allowed_origins.split(",") if settings.allowed_origins else [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(predict.router, prefix="/api", tags=["Predictions"])
app.include_router(analytics.router, prefix="/api", tags=["Analytics"])
app.include_router(history.router, prefix="/api", tags=["History"])
app.include_router(fairness.router, prefix="/api", tags=["Responsible AI"])


@app.get("/", include_in_schema=False)
async def root():
    return JSONResponse({
        "message": "Credit Intelligence API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health",
    })
