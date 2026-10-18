"""Prediction history API endpoint."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database.db import get_db, PredictionRecord

router = APIRouter()


@router.get(
    "/predictions",
    summary="Prediction History",
    description="Get the list of all past credit risk predictions stored in the database."
)
async def get_predictions(
    skip: int = Query(default=0, ge=0, description="Number of records to skip"),
    limit: int = Query(default=50, ge=1, le=200, description="Maximum records to return"),
    risk_level: Optional[str] = Query(default=None, description="Filter by risk level"),
    db: Session = Depends(get_db)
):
    query = db.query(PredictionRecord)
    if risk_level:
        query = query.filter(PredictionRecord.risk_level == risk_level)
    total = query.count()
    records = (
        query
        .order_by(PredictionRecord.timestamp.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "predictions": [
            {
                "id": r.id,
                "prediction_id": r.prediction_id,
                "risk_level": r.risk_level,
                "risk_score": r.risk_score,
                "probability_low_risk": r.probability_low_risk,
                "probability_high_risk": r.probability_high_risk,
                "confidence": r.confidence,
                "model_version": r.model_version,
                "algorithm": r.algorithm,
                "timestamp": r.timestamp.isoformat() + "Z",
                "age": r.age,
                "credit_amount": r.credit_amount,
                "duration": r.duration,
                "purpose": r.purpose,
            }
            for r in records
        ]
    }


@router.get(
    "/predictions/{prediction_id}",
    summary="Single Prediction",
    description="Get details of a specific prediction by its ID."
)
async def get_prediction(prediction_id: str, db: Session = Depends(get_db)):
    from fastapi import HTTPException
    record = db.query(PredictionRecord).filter(
        PredictionRecord.prediction_id == prediction_id
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail=f"Prediction '{prediction_id}' not found.")

    import json
    return {
        "id": record.id,
        "prediction_id": record.prediction_id,
        "risk_level": record.risk_level,
        "risk_score": record.risk_score,
        "probability_low_risk": record.probability_low_risk,
        "probability_high_risk": record.probability_high_risk,
        "confidence": record.confidence,
        "model_version": record.model_version,
        "algorithm": record.algorithm,
        "timestamp": record.timestamp.isoformat() + "Z",
        "age": record.age,
        "credit_amount": record.credit_amount,
        "duration": record.duration,
        "purpose": record.purpose,
        "checking_status": record.checking_status,
        "credit_history": record.credit_history,
        "employment": record.employment,
        "top_factors": json.loads(record.top_factors) if record.top_factors else [],
    }
