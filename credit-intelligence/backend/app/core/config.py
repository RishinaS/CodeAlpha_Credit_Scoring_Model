"""Application configuration using Pydantic Settings."""
import os
from pydantic_settings import BaseSettings
from pathlib import Path


BASE_DIR = Path(__file__).parent.parent.parent


class Settings(BaseSettings):
    app_name: str = "Credit Intelligence"
    app_version: str = "1.0.0"
    debug: bool = False
    allowed_origins: str = "http://localhost:5173,http://localhost:3000"
    database_url: str = f"sqlite:///{BASE_DIR}/credit_intelligence.db"
    models_dir: str = str(BASE_DIR / "models")
    log_level: str = "INFO"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
