"""
file: app/core/config.py

Configurazione dell'applicazione usando Pydantic BaseSettings.
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List


class Config(BaseSettings):

    # ======================
    # APP
    # ======================
    APP_NAME: str = "FieldRobotics DJI Backend"
    APP_VERSION: str = "1.0.0"
    ENV: str = Field(default="development", env="ENV")

    # ======================
    # DATABASE
    # ======================
    # Impostiamo il percorso dentro la cartella 'app/database'.
    # Docker ha i permessi di scrittura su questa cartella specifica.
    # Il file si chiamerà 'database_gcs_dji.db'.
    DATABASE_URL: str = Field(
        default="sqlite:///./app/database/database_gcs_dji.db", 
        env="DATABASE_URL"
    )

    # ======================
    # SECURITY / JWT
    # ======================
    SECRET_KEY: str = Field(..., env="SECRET_KEY")
    JWT_ALGORITHM: str = Field(default="HS256", env="JWT_ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60, env="ACCESS_TOKEN_EXPIRE_MINUTES")

    # ======================
    # GCS USER (AUTH)
    # ======================
    GCS_USERNAME: str = Field(..., env="GCS_USERNAME")
    GCS_PASSWORD: str = Field(..., env="GCS_PASSWORD")
    GCS_FULLNAME: str = Field(default="Administrator", env="GCS_FULLNAME")
    GCS_EMAIL: str = Field(default="admin@fieldrobotics.it", env="GCS_EMAIL")

    # ======================
    # CORS
    # ======================
    # Expect JSON array in .env
    CORS_ORIGINS: List[str] = Field(default=["*"], env="CORS_ORIGINS")

    # ======================
    # THINGSBOARD
    # ======================
    THINGSBOARD_URL: str = Field(default="https://thingsboard.cloud", env="THINGSBOARD_URL")
    TB_USER: str = Field(..., env="TB_USER")
    TB_PASS: str = Field(..., env="TB_PASS")
    TB_TOKEN_TTL_SECONDS: int = Field(default=50 * 60)

    DOCK_ID: str = Field(..., env="DOCK_ID")

    # ======================
    # TELEMETRY
    # ======================
    TELEMETRY_CACHE_TTL: float = Field(default=1.0)
    TELEMETRY_TIMEOUT: int = Field(default=3)

    # ======================
    # MISSIONS
    # ======================
    # Nota: Manteniamo questo campo per retrocompatibilità, anche se ora usiamo SQLAlchemy.
    # Se non lo usi più nel codice, puoi rimuoverlo in futuro.
    MISSION_DB_PATH: str = Field(default="missions.db", env="MISSION_DB_PATH")

    # ======================
    # DJI CLOUD
    # ======================
    DJI_API_BASE: str = Field(default="https://developer-api.dji.com", env="DJI_API_BASE")
    DJI_APP_KEY: str | None = Field(default=None, env="DJI_APP_KEY")
    DJI_APP_LICENSE: str | None = Field(default=None, env="DJI_APP_LICENSE")

    # ======================
    # HTTP CLIENT
    # ======================
    HTTP_TIMEOUT: int = Field(default=10)
    HTTP_RETRY_TOTAL: int = Field(default=3)
    HTTP_RETRY_BACKOFF: float = Field(default=0.3)
    HTTP_POOL_CONNECTIONS: int = Field(default=10)
    HTTP_POOL_MAXSIZE: int = Field(default=20)

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields from .env


# Singleton settings object
settings = Config()