"""
file: app/users/controller.py

Rotte FastAPI per la gestione degli utenti: login, creazione, lettura e cancellazione.
E' il centralino che riceve le richieste HTTP relative agli utenti dall'esterno e decide quali funzioni di servizio chiamare.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.core import get_db
from app.core.config import settings
from . import schemas, service, models
from .models import UserRole

# Impostazione del prefisso /users, quindi le rotte saranno es: /users/create_user
router = APIRouter(prefix="/users", tags=["User Management"])


# ======================
# LOGIN E PROFILO (ACCESSIBILI A TUTTI)
# ======================
@router.post("/login", response_model=schemas.Token)        # Definizione della rotta /login che accetta richieste POST e restituisce un Token definito in schemas.Token
async def login(login_data: schemas.LoginRequest, db: Session = Depends(get_db)):
    # Effettua il login e restituisce il token di accesso.
    user = service.get_user_by_username(db, login_data.username)
    if not user or not service.verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username o password errati",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = service.create_access_token(data={"sub": user.username, "role": user.role.value})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }


@router.get("/current_user", response_model=schemas.UserResponse)
async def get_current_user(current_user: models.User = Depends(service.get_current_user)):
    # Restituisce i dati dell'utente loggato
    return current_user


@router.get("/verify-token")
async def verify_token(current_user: models.User = Depends(service.get_current_user)):
    # Verifica validità del token.
    return {"status": "ok", "username": current_user.username, "role": current_user.role}


# ======================
# GESTIONE UTENTI (SOLO ADMIN)
# ======================
@router.post("/create_user", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: schemas.UserCreate, 
    db: Session = Depends(get_db),
    # Solo un ADMIN può creare altri utenti
    current_user: models.User = Depends(service.role_required([UserRole.ADMIN]))
):
    # Crea un nuovo utente. Richiede ruolo ADMIN.
    # Verifica se esiste già
    if service.get_user_by_username(db, user_in.username):
        raise HTTPException(status_code=400, detail="Username già in uso")
    
    new_user = service.create_user(db, user_in)
    return new_user


@router.get("/all_users", response_model=List[schemas.UserResponse])
def get_all_users(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(service.role_required([UserRole.ADMIN]))
):
    # Lista tutti gli utenti (Solo Admin).
    users = service.get_all_users(db, skip=skip, limit=limit)
    return users


@router.delete("/delete_user/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(service.role_required([UserRole.ADMIN]))
):
    # Elimina un utente specificando l'ID (Solo Admin).
    # Impedisci all'admin di cancellare se stesso
    if current_user.id == user_id:
         raise HTTPException(status_code=400, detail="Non puoi cancellare te stesso!")
         
    success = service.delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Utente non trovato")
    return None