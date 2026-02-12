"""
file: app/users/schemas.py

Schemi Pydantic per la validazione e serializzazione dei dati relativi agli utenti e all'autenticazione.
Qui viene descritto come i dati entrano ed escono dalle API
"""

from pydantic import BaseModel, EmailStr, ConfigDict, Field
from typing import Optional
from .models import UserRole


# ======================
# SCHEMI UTENTE
# ======================
class UserBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None    # Optional indica che il campo non è obbliga, EmailStr è un tipo speciale di Pydantic che valida che la stringa sia un'email, se non viene fornita è None
    full_name: Optional[str] = None
    role: UserRole = UserRole.VIEWER

class UserCreate(UserBase):             # Estende UserBase aggiungendo la password, usato per la creazione di un nuovo utente
    password: str

class UserResponse(UserBase):           # Estende UserBase aggiungendo id e is_active, usato per risposte API che restituiscono dati utente all'esterno
    id: int
    is_active: bool

    # Configurazione per leggere direttamente dal modello SQLAlchemy defintio in models.py, invece che dover convertire manualmente in dict(dizionario)
    model_config = ConfigDict(from_attributes=True)


# ======================
# SCHEMI AUTHENTICAZIONE
# ======================
class LoginRequest(BaseModel):          # Cosa deve inviare l'utente per fare login, username e password obbligatori
    username: str = Field(..., examples=["admin"])
    password: str = Field(..., examples=["admin123"])

class Token(BaseModel):                 # Cosa restituisce l'API dopo un login riuscito, include il token di accesso e informazioni sul tipo di token e scadenza
    access_token: str
    token_type: str
    expires_in: int