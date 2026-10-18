"""
Prediction API endpoints.
POST /api/predict      — Single applicant prediction
POST /api/predict/batch — Batch prediction (up to 10 records)
"""
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.schemas.schemas import CreditApplicationInput, PredictionResponse
from app.ml.predictor import model_service
from app.database.db import get_db, PredictionRecord

router = APIRouter()

# Valid categorical values (from German Credit dataset)
VALID_CHECKING_STATUS = ["<0", "0<=X<200", ">=200", "no checking"]
VALID_CREDIT_HISTORY = [
    "no credits/all paid", "all paid", "existing paid",
    "delayed previously", "critical/other existing credit"
]
VALID_PURPOSE = [
    "new car", "used car", "furniture/equipment", "radio/tv",
    "domestic appliance", "repairs", "education", "vacation",
    "retraining", "business", "other"
]
VALID_SAVINGS_STATUS = [
    "<100", "100<=X<500", "500<=X<1000", ">=1000", "no known savings"
]
VALID_EMPLOYMENT = ["unemployed", "<1", "1<=X<4", "4<=X<7", ">=7"]
VALID_PERSONAL_STATUS = [
    "male div/sep", "female div/dep/mar", "male single",
    "male mar/wid", "female single"
]
VALID_OTHER_PARTIES = ["none", "co applicant", "guarantor"]
VALID_PROPERTY = ["real estate", "life insurance", "car", "no known property"]
VALID_OTHER_PAYMENT = ["bank", "stores", "none"]
VALID_HOUSING = ["rent", "free", "own"]
VALID_JOB = ["unemp/unskilled non res", "unskilled resident", "skilled", "high qualif/self emp/mgmt"]
VALID_TELEPHONE = ["none", "yes"]
VALID_FOREIGN_WORKER = ["yes", "no"]


def validate_categorical_fields(data: CreditApplicationInput):
    """Validate categorical inputs against known valid values."""
    errors = []
    checks = [
        ("checking_status", data.checking_status, VALID_CHECKING_STATUS),
        ("credit_history", data.credit_history, VALID_CREDIT_HISTORY),
        ("purpose", data.purpose, VALID_PURPOSE),
        ("savings_status", data.savings_status, VALID_SAVINGS_STATUS),
        ("employment", data.employment, VALID_EMPLOYMENT),
        ("personal_status", data.personal_status, VALID_PERSONAL_STATUS),
        ("other_parties", data.other_parties, VALID_OTHER_PARTIES),
        ("property_magnitude", data.property_magnitude, VALID_PROPERTY),
        ("other_payment_plans", data.other_payment_plans, VALID_OTHER_PAYMENT),
        ("housing", data.housing, VALID_HOUSING),
        ("job", data.job, VALID_JOB),
        ("own_telephone", data.own_telephone, VALID_TELEPHONE),
        ("foreign_worker", data.foreign_worker, VALID_FOREIGN_WORKER),
    ]
    for field, value, valid_list in checks:
        if value not in valid_list:
            errors.append(f"'{field}': '{value}' is not a valid option. Valid: {valid_list}")
    return errors


@router.post(
    "/predict",
    response_model=PredictionResponse,
    summary="Credit Risk Prediction",
    description="""
Predict credit risk for a single applicant.

Returns:
- Risk level (Low Risk / Medium Risk / High Risk)
- Risk score (0–100, project-specific, NOT an official credit score)
- Prediction probabilities
- SHAP-based explanation of key factors

**Disclaimer**: This is an AI-generated risk estimate for educational purposes only.
    """
)
async def predict_credit_risk(
    application: CreditApplicationInput,
    db: Session = Depends(get_db)
):
    # Validate model is loaded
    if not model_service._loaded:
        raise HTTPException(status_code=503, detail="ML model is not loaded. Please try again.")

    # Validate categorical fields
    cat_errors = validate_categorical_fields(application)
    if cat_errors:
        raise HTTPException(status_code=422, detail={"categorical_validation_errors": cat_errors})

    try:
        # Run prediction
        input_dict = application.model_dump()
        result = model_service.predict(input_dict)

        # Save to database
        db_record = PredictionRecord(
            prediction_id=result["prediction_id"],
            risk_level=result["risk_level"],
            risk_score=result["risk_score"],
            probability_low_risk=result["probability_low_risk"],
            probability_high_risk=result["probability_high_risk"],
            confidence=result["confidence"],
            model_version=result["model_version"],
            algorithm=result["algorithm"],
            timestamp=datetime.utcnow(),
            age=application.age,
            credit_amount=application.credit_amount,
            duration=application.duration,
            purpose=application.purpose,
            checking_status=application.checking_status,
            credit_history=application.credit_history,
            employment=application.employment,
            top_factors=json.dumps(result["explanation"].get("top_factors", [])[:5]),
        )
        db.add(db_record)
        db.commit()

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed. Please check your input and try again."
        )


@router.get(
    "/valid-options",
    summary="Valid Categorical Options",
    description="Returns valid values for all categorical input fields."
)
async def get_valid_options():
    return {
        "checking_status": VALID_CHECKING_STATUS,
        "credit_history": VALID_CREDIT_HISTORY,
        "purpose": VALID_PURPOSE,
        "savings_status": VALID_SAVINGS_STATUS,
        "employment": VALID_EMPLOYMENT,
        "personal_status": VALID_PERSONAL_STATUS,
        "other_parties": VALID_OTHER_PARTIES,
        "property_magnitude": VALID_PROPERTY,
        "other_payment_plans": VALID_OTHER_PAYMENT,
        "housing": VALID_HOUSING,
        "job": VALID_JOB,
        "own_telephone": VALID_TELEPHONE,
        "foreign_worker": VALID_FOREIGN_WORKER,
    }
