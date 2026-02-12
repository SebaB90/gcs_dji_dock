"""
file: app/core/config.py

Configurazione dell'applicazione usando Pydantic Settings (V2).
Legge il file .env e costruisce la mappa dinamica delle Docks.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import List, Dict, Optional


class Config(BaseSettings):

    # ======================
    # APP
    # ======================
    APP_NAME: str = "FieldRobotics DJI Backend"
    APP_VERSION: str = "1.0.0"
    ENV: str = Field(default="development")

    # ======================
    # DATABASE
    # ======================
    DATABASE_URL: str = Field(default="sqlite:///./app/database/database_gcs_dji.db")

    # ======================
    # SECURITY / JWT
    # ======================
    SECRET_KEY: str = Field(...)
    JWT_ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60)

    # ======================
    # GCS USER (AUTH)
    # ======================
    GCS_USERNAME: str = Field(...)
    GCS_PASSWORD: str = Field(...)
    GCS_FULLNAME: str = Field(default="Administrator")
    GCS_EMAIL: str = Field(default="admin@fieldrobotics.it")

    # ======================
    # CORS
    # ======================
    # Pydantic parsa automaticamente la stringa JSON dal .env in una List[str]
    CORS_ORIGINS: List[str] = Field(default=["*"])

    # ======================
    # THINGSBOARD
    # ======================
    THINGSBOARD_URL: str = Field(default="https://thingsboard.cloud")
    TB_USER: str = Field(...)
    TB_PASS: str = Field(...)
    TB_TOKEN_TTL_SECONDS: int = Field(default=50 * 60)

    # ======================
    # DOCKS CONFIGURATION (Max 2 Docks)
    # ======================
    
    # DOCK 1 (Principale)
    DOCK1_NAME: Optional[str] = Field(default=None)
    DOCK1_ID: Optional[str] = Field(default=None)

    # DOCK 2 (Secondaria/Futura)
    DOCK2_NAME: Optional[str] = Field(default=None)
    DOCK2_ID: Optional[str] = Field(default=None)

    # Mappa finale usata dal Service { "nome_logico": "UUID_TB" }
    # Non viene letta dal .env ma costruita dinamicamente
    DOCKS_MAP: Dict[str, str] = Field(default_factory=dict)

    # ======================
    # TELEMETRY & MISSIONS
    # ======================
    TELEMETRY_CACHE_TTL: float = Field(default=1.0)
    TELEMETRY_TIMEOUT: int = Field(default=3)
    MISSION_DB_PATH: str = Field(default="missions.db")

    # ======================
    # DJI CLOUD
    # ======================
    DJI_API_BASE: str = Field(default="https://developer-api.dji.com")
    DJI_APP_KEY: Optional[str] = Field(default=None)
    DJI_APP_LICENSE: Optional[str] = Field(default=None)

    # ======================
    # HTTP CLIENT
    # ======================
    HTTP_TIMEOUT: int = Field(default=10)
    HTTP_RETRY_TOTAL: int = Field(default=3)
    HTTP_RETRY_BACKOFF: float = Field(default=0.3)
    HTTP_POOL_CONNECTIONS: int = Field(default=10)
    HTTP_POOL_MAXSIZE: int = Field(default=20)

    # ======================
    # CONFIGURAZIONE PYDANTIC V2
    # ======================
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True, # Le variabili nel .env devono essere MAIUSCOLE come qui
        extra="ignore"       # Ignora variabili nel .env non definite qui
    )

    def __init__(self, **values):
        super().__init__(**values)
        
        # LOGICA CRUCIALE: Popola la mappa DOCKS_MAP
        # Questo permette allo scheduler di convertire "dock1" in "5acadfc0..."
        if self.DOCK1_NAME and self.DOCK1_ID:
            self.DOCKS_MAP[self.DOCK1_NAME] = self.DOCK1_ID
            
        if self.DOCK2_NAME and self.DOCK2_ID:
            self.DOCKS_MAP[self.DOCK2_NAME] = self.DOCK2_ID

# Singleton settings object
settings = Config()