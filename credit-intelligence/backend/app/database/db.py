"""Database models and connection setup."""
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from app.core.config import settings

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},  # SQLite only
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class PredictionRecord(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(String(50), unique=True, index=True)
    risk_level = Column(String(20))            # "Low Risk" or "High Risk"
    risk_score = Column(Integer)               # 0-100
    probability_low_risk = Column(Float)
    probability_high_risk = Column(Float)
    confidence = Column(Float)
    model_version = Column(String(50))
    algorithm = Column(String(50))
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Input summary (non-PII aggregate)
    age = Column(Integer, nullable=True)
    credit_amount = Column(Float, nullable=True)
    duration = Column(Integer, nullable=True)
    purpose = Column(String(50), nullable=True)
    checking_status = Column(String(50), nullable=True)
    credit_history = Column(String(50), nullable=True)
    employment = Column(String(50), nullable=True)

    # Explanation (JSON string)
    top_factors = Column(Text, nullable=True)
    explanation_summary = Column(Text, nullable=True)


def create_tables():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
