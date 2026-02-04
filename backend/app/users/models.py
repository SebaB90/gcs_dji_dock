"""
file: app/users/models.py

Modello SQLAlchemy per la tabella 'users' e definizione dei ruoli utente. 
Descrive come i dati degli utenti sono strutturati e memorizzati nel database
"""

import enum
from sqlalchemy import Column, Integer, String, Boolean, Enum as SqlEnum
from app.database.core import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"       # Controllo totale
    OPERATOR = "operator" # Può inviare missioni
    VIEWER = "viewer"     # Può solo guardare la telemetria

class User(Base):
    __tablename__ = "users"                                                     # Nome della tabella nel database

    id = Column(Integer, primary_key=True, index=True)                          # Nuova colonna chimata 'id' accessibbile come 'user.id'
    username = Column(String, unique=True, index=True, nullable=False)          # Nullable False singifica che è obbligatorio, Index True per ricerche più veloci, Unique True per evitare duplicati
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=True)
    is_active = Column(Boolean, default=True)
    role = Column(SqlEnum(UserRole), default=UserRole.VIEWER, nullable=False)   # Colonna per il ruolo dell'utente

    def __repr__(self):
        return f"<User {self.username} ({self.role})>"