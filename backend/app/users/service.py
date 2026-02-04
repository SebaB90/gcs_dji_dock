"""
file: app/users/service.py

Servizi/funzioni per la gestione degli utenti: autenticazione, autorizzazione, CRUD e inizializzazione dell'utente Admin.
Definzione della logica di business dietro le rotte API che si trovano in controller.py
Gestisce tre cose principali:
1. Autenticazione: verifica password, genera token JWT
2. Autorizzazione: controlla i ruoli degli utenti per limitare l'accesso a certe funzionalità
3. Gestione utenti: funzioni per creare, leggere e cancellare utenti, e per inizializzare un utente Admin se non esiste già
"""

from datetime import datetime, timedelta
from typing import Optional, List
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.config import settings
from app.database.core import get_db
from . import models, schemas # Importiamo schemas per il tipo UserCreate

# Configurazione sicurezza
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")       # Per hashare le password (criptarle) utilizzando bcrypt uno dei metodi più sicuri, deprecated auto per deprecare vecchi hash methods quando viene aggiunto a schemes una metodo più moderno e sicuro, quindi se un cliente si logga con una vecchia password con hash deprecato, viene automaticamente aggironato l'hashing usando il nuovo metodo
security = HTTPBearer()


# ======================
# PASSWORD UTILS
# ======================
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password[:72])                              # Limitiamo la lunghezza della password a 72 caratteri per bcrypt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password[:72], hashed_password)     # Controlla la password inserita con quella hashata


# ======================
# JWT UTILS
# ======================
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):                     # Funzione per creare il token JWT una volta che il login è andato a buon fine
    to_encode = data.copy()
    if expires_delta:                                                                               # Il token non dura per sempre, scade dopo un certo tempo, usa expires_delta se fornito altrimenti usa il default definito in .env
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})                                                               # Aggiungiamo la data di scadenza al payload del token exp come campo al dizionario to_encode
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)      # Creiamo il token JWT effettivo
    return encoded_jwt


# ======================
# AUTHENTICAZIONE E AUTORIZZAZIONE
# ======================
def get_user_by_username(db: Session, username: str):                               # Session serve definire un area di lavoro temporanea per fare query sul database, il database viene aggironato solo quando facciamo commit dopo aver verificato che tutto è corretto
    return db.query(models.User).filter(models.User.username == username).first()   # Query su User, cerca l'utente con lo username specificato e restituisce il primo risultato (o None se non trovato)


async def get_current_user(                                         # Funzione che restituisce l'utente corrente basato sul token JWT fornito nella richiesta HTTP. Definita come asincrona per non bloccare il server durante le operazioni di I/O come l'accesso al database
    db: Session = Depends(get_db),                                  # Depends(get_db): Dice a FastAPI di eseguire la funzione get_db, aprire una connessione al database e passarla alla variabile db
    credentials: HTTPAuthorizationCredentials = Depends(security)   # Depends(security) dice a FastAPI di andare a leggere l'header della richiesta HTTP, cercare il token e consegnarlo alla variabile credentials
) -> models.User:                                                   # -> models.User indica che questa funzione restituisce un oggetto di tipo User definito in models.py
    # Valida il token e restituisce l'utente corrente
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenziali non valide, sessione scaduta o Token JWT mancante/non valido.",
        headers={"WWW-Authenticate": "Bearer"},                     # Indica che stiamo usando l'autenticazione con Token Bearer (solitamentetoken JWT)
    )
    try:
        token = credentials.credentials                                                         # Estrae il token JWT dall'header Authorization della richiesta HTTP
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])   # Decodifica il token usando la chiave segreta e l'algoritmo specificato
        username: str = payload.get("sub")                                                      # Estrae il campo 'sub' (subject) dal payload del token, che contiene lo username dell'utente
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = get_user_by_username(db, username=username)      # Usa lo username estratto dal token per cercare l'utente nel database
    if user is None:
        raise credentials_exception
    return user


def role_required(allowed_roles: List[models.UserRole]):    # Funzione di tipo Closure che restituisce un'altra funzione role_checker
    # Dependency per limitare l'accesso in base al ruolo
    def role_checker(current_user: models.User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail=f"Accesso negato. Richiesto ruolo: {allowed_roles}"
            )
        return current_user
    return role_checker


# ======================
# GESTIONE UTENTI, OPERAZIONI CRUD (Create, Read, Update, Delete)
# ======================
def create_user(db: Session, user: schemas.UserCreate):     # Questa funzione trasforma i dati ricevuti dal frontend in un nuovo utente nel database.
    # Crea un'istanza di models.User copiando i campi dallo schema UserCreate (username, email, ecc.) e aggiungendo la password hashata.
    hashed_pwd = get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_pwd,
        role=user.role,  # Qui assegniamo il ruolo passato nel JSON
        is_active=True
    )
    db.add(db_user)      # Aggiunge l'utente alla sessione del database
    db.commit()          # Salva (committa) le modifiche al database
    db.refresh(db_user)  # Ricarica l'oggetto db_user con i dati aggiornati dal database (es. ID generato automaticamente)
    return db_user


def get_all_users(db: Session, skip: int = 0, limit: int = 100):      
    # Restituisce la lista di tutti gli utenti. Supporto per paginazione con skip e limit, si possono salatare i primi 'skip' utenti e limitare il numero di utenti restituiti a 'limit'
    return db.query(models.User).offset(skip).limit(limit).all()


def delete_user(db: Session, user_id: int):
    # Cancella un utente per ID
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        db.delete(user)
        db.commit()
        return True
    return False


def init_first_user(db: Session):
    # Controlla se esiste l'utente Admin definito nelle variabili d'ambiente.
    # Se non esiste, lo crea automaticamente.
    username = settings.GCS_USERNAME
    password = settings.GCS_PASSWORD
    email = settings.GCS_EMAIL
    
    # Cerchiamo se esiste già
    user = get_user_by_username(db, username)
    
    if not user:
        print(f"⚠️  Admin user '{username}' not found. Creating it now...")
        
        # Creiamo l'oggetto utente
        hashed_pwd = get_password_hash(password)
        new_admin = models.User(
            username=username,
            hashed_password=hashed_pwd,
            full_name=settings.GCS_FULLNAME,
            email=email,
            role=models.UserRole.ADMIN, # Forza ruolo Admin
            is_active=True
        )
        
        db.add(new_admin)
        db.commit()
        db.refresh(new_admin)
        print(f"✅ Admin user '{username}' created successfully!")
    else:
        print(f"ℹ️  Admin user '{username}' already exists. Skipping creation.")