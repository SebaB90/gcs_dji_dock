"""
file: app/database/core.py

Database core setup: SQLAlchemy engine, session, and base model declaration.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Se hai settings nel config, usalo, altrimenti usa un default (es. sqlite)
try:
    from app.core.config import settings
    SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL
except ImportError:
    # Fallback se settings non è ancora configurato
    SQLALCHEMY_DATABASE_URL = "sqlite:///./database_gcs_dji.db"

# Creazione Engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False} if "sqlite" in SQLALCHEMY_DATABASE_URL else {}
)

# Creazione Sessione
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Creazione Base (da cui ereditano tutti i modelli)
Base = declarative_base()

# Dependency Injection per le rotte FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()