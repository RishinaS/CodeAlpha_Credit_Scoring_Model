"""
Pydantic schemas for request/response validation.
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime


# ─────────────────────────────────────────────────────────────────────────────
# REQUEST SCHEMAS
# ─────────────────────────────────────────────────────────────────────────────

class CreditApplicationInput(BaseModel):
    """Input schema for credit risk assessment."""

    # Numerical features
    duration: int = Field(
        ..., ge=1, le=120, description="Loan duration in months (1–120)"
    )
    credit_amount: float = Field(
        ..., ge=100, le=200000, description="Credit/loan amount in currency units"
    )
    installment_commitment: float = Field(
        ..., ge=1, le=4, description="Installment rate as % of disposable income (1–4)"
    )
    residence_since: int = Field(
        ..., ge=1, le=4, description="Years at current residence (1–4)"
    )
    age: int = Field(
        ..., ge=18, le=100, description="Applicant age in years (18–100)"
    )
    existing_credits: int = Field(
        ..., ge=1, le=4, description="Number of existing credits at this bank (1–4)"
    )
    num_dependents: int = Field(
        ..., ge=1, le=2, description="Number of dependents (1–2)"
    )

    # Categorical features
    checking_status: str = Field(
        ..., description="Status of existing checking account"
    )
    credit_history: str = Field(
        ..., description="Credit history"
    )
    purpose: str = Field(
        ..., description="Purpose of credit"
    )
    savings_status: str = Field(
        ..., description="Savings account/bonds status"
    )
    employment: str = Field(
        ..., description="Employment duration"
    )
    personal_status: str = Field(
        ..., description="Personal status and sex"
    )
    other_parties: str = Field(
        ..., description="Other debtors/guarantors"
    )
    property_magnitude: str = Field(
        ..., description="Property ownership"
    )
    other_payment_plans: str = Field(
        ..., description="Other installment plans"
    )
    housing: str = Field(
        ..., description="Housing situation"
    )
    job: str = Field(
        ..., description="Job type"
    )
    own_telephone: str = Field(
        ..., description="Has own telephone"
    )
    foreign_worker: str = Field(
        ..., description="Is foreign worker"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "duration": 24,
                "credit_amount": 5000,
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
        }


# ─────────────────────────────────────────────────────────────────────────────
# RESPONSE SCHEMAS
# ─────────────────────────────────────────────────────────────────────────────

class RiskFactor(BaseModel):
    feature: str
    shap_value: Optional[float] = None
    importance: Optional[float] = None
    direction: str  # "increases_risk" or "decreases_risk"


class ExplanationResponse(BaseModel):
    method: str
    increasing_risk_factors: List[Dict[str, Any]] = []
    decreasing_risk_factors: List[Dict[str, Any]] = []
    top_factors: List[Any] = []
    note: Optional[str] = None


class PredictionResponse(BaseModel):
    prediction_id: str
    timestamp: str
    risk_level: str
    risk_band: str
    risk_score: int = Field(..., description="Project-specific risk score 0–100 (NOT an official credit score)")
    probability_low_risk: float
    probability_high_risk: float
    confidence: float
    model_version: str
    algorithm: str
    explanation: Dict[str, Any]
    disclaimer: str


class PredictionHistoryItem(BaseModel):
    id: int
    prediction_id: str
    risk_level: str
    risk_score: int
    probability_low_risk: float
    probability_high_risk: float
    confidence: float
    model_version: str
    algorithm: str
    timestamp: str
    age: Optional[int]
    credit_amount: Optional[float]
    duration: Optional[int]
    purpose: Optional[str]

    class Config:
        from_attributes = True


class ModelMetrics(BaseModel):
    name: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    pr_auc: float
    cv_f1_mean: Optional[float] = None
    training_time_seconds: Optional[float] = None
    confusion_matrix: Optional[List[List[int]]] = None


class AnalyticsResponse(BaseModel):
    total_predictions: int
    low_risk_count: int
    medium_risk_count: int
    high_risk_count: int
    low_risk_percentage: float
    medium_risk_percentage: float
    high_risk_percentage: float
    average_risk_score: float
    model_version: str
    algorithm: str
