from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import os
import logging
import signal
import sys
from dotenv import load_dotenv

# ====================
# CONFIGURAZIONE BASE
# ====================

load_dotenv()

app = FastAPI(title="GCS Backend")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Session with connection pooling for better performance
def get_http_session():
    """Create requests session with connection pooling and retries"""
    session = requests.Session()
    retry_strategy = Retry(
        total=3,
        backoff_factor=0.3,
        status_forcelist=[429, 500, 502, 503, 504]
    )
    adapter = HTTPAdapter(
        max_retries=retry_strategy,
        pool_connections=10,
        pool_maxsize=20
    )
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    return session

# Global session for reuse
http_session = get_http_session()

# ====================
# GRACEFUL SHUTDOWN
# ====================

def shutdown_handler(signum, frame):
    """Handle shutdown signals gracefully"""
    logger.info(f"Received signal {signum}, shutting down gracefully...")
    
    # Close HTTP session
    if http_session:
        http_session.close()
        logger.info("HTTP session closed")
    
    # Clear token cache
    _tb_token_cache["token"] = None
    _tb_token_cache["expires_at"] = 0
    logger.info("Token cache cleared")
    
    logger.info("Shutdown complete")
    sys.exit(0)

# Register signal handlers
signal.signal(signal.SIGTERM, shutdown_handler)
signal.signal(signal.SIGINT, shutdown_handler)

@app.on_event("startup")
async def startup_event():
    """Log application startup"""
    logger.info("GCS Backend starting up...")
    logger.info("HTTP connection pooling initialized")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on application shutdown"""
    logger.info("GCS Backend shutting down...")
    if http_session:
        http_session.close()
        logger.info("HTTP session closed")


# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Security
security = HTTPBearer()
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

# ====================
# PYDANTIC MODELS
# ====================

class LoginRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int

class TokenData(BaseModel):
    username: str | None = None

# CORS – Permetti l’accesso dal frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ⚠️ In produzione limita ai tuoi domini
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ====================
# THINGSBOARD CONFIG
# ====================
BASE_URL = os.getenv("THINGSBOARD_URL", "https://thingsboard.cloud")
USERNAME = os.getenv("TB_USER", "bruno.strano@fieldrobotics.it")
PASSWORD = os.getenv("TB_PASS", "FieldRobotics2025")

DRONE_ID = os.getenv("TB_DRONE_ID", "5acadfc0-4d9b-11f0-add2-093f841cc5dc")
HANGAR_ID = os.getenv("TB_HANGAR_ID", "17a81bb0-4d9e-11f0-add2-093f841cc5dc")

# ====================
# DJI CLOUD CONFIG
# ====================
DJI_API_BASE = os.getenv("DJI_API_BASE", "https://developer-api.dji.com")
DJI_APP_KEY = os.getenv("DJI_APP_KEY")
DJI_APP_LICENSE = os.getenv("DJI_APP_LICENSE")

# ====================
# USER AUTHENTICATION
# ====================
# In production, store users in a database with hashed passwords

# Store users without hashing at module level to avoid import-time errors
# Hash passwords on-demand during authentication
_USERS_CREDENTIALS = {
    "username": os.getenv("GCS_USERNAME", "admin"),
    "password": os.getenv("GCS_PASSWORD", "admin123"),
    "full_name": os.getenv("GCS_FULLNAME", "Administrator"),
    "email": os.getenv("GCS_EMAIL", "admin@fieldrobotics.it"),
}

def get_user_db():
    """Get users database with hashed passwords (lazy initialization)"""
    username = _USERS_CREDENTIALS["username"]
    return {
        username: {
            "username": username,
            "hashed_password": pwd_context.hash(_USERS_CREDENTIALS["password"][:72]),
            "full_name": _USERS_CREDENTIALS["full_name"],
            "email": _USERS_CREDENTIALS["email"],
        }
    }

# ====================
# AUTHENTICATION UTILITIES
# ====================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password"""
    # Truncate password to 72 bytes for bcrypt compatibility
    return pwd_context.verify(plain_password[:72], hashed_password)

def authenticate_user(username: str, password: str):
    """Authenticate user credentials"""
    users_db = get_user_db()
    user = users_db.get(username)
    if not user:
        return False
    if not verify_password(password, user["hashed_password"]):
        return False
    return user

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Validate JWT token and return current user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    users_db = get_user_db()
    user = users_db.get(token_data.username)
    if user is None:
        raise credentials_exception
    return user

# ====================
# UTILITY FUNZIONE TB TOKEN
# ====================

# Cache for ThingsBoard token to avoid re-authentication on every request
_tb_token_cache = {"token": None, "expires_at": 0}

def get_tb_token():
    """Ottiene il token di autenticazione da ThingsBoard (con caching)"""
    # Check if cached token is still valid (cache for 50 minutes)
    if _tb_token_cache["token"] and datetime.now().timestamp() < _tb_token_cache["expires_at"]:
        return _tb_token_cache["token"]
    
    try:
        res = http_session.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": USERNAME, "password": PASSWORD},
            timeout=10
        )
        res.raise_for_status()
        token = res.json()["token"]
        
        # Cache token for 50 minutes
        _tb_token_cache["token"] = token
        _tb_token_cache["expires_at"] = datetime.now().timestamp() + (50 * 60)
        
        logger.info("ThingsBoard token refreshed")
        return token
    except Exception as e:
        logger.error(f"ThingsBoard authentication error: {e}")
        raise HTTPException(status_code=401, detail=f"Errore autenticazione TB: {e}")


# ====================
# ENDPOINT BASE
# ====================
@app.get("/")
def root():
    """Verifica stato backend"""
    return {"status": "ok", "service": "GCS Backend", "version": "1.0.0"}


@app.get("/health")
def health_check():
    """Health check endpoint for monitoring and load balancers"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "uptime": "running"
    }


@app.get("/ready")
def readiness_check():
    """Readiness check - verifies all dependencies are accessible"""
    checks = {
        "database": "ok",  # Future: add database check
        "thingsboard": "checking"
    }
    
    # Quick check if ThingsBoard is accessible
    try:
        test_token = get_tb_token()
        checks["thingsboard"] = "ok" if test_token else "error"
    except:
        checks["thingsboard"] = "error"
    
    all_ok = all(v == "ok" for v in checks.values())
    status_code = 200 if all_ok else 503
    
    return {
        "status": "ready" if all_ok else "not_ready",
        "checks": checks,
        "timestamp": datetime.utcnow().isoformat()
    }


# ====================
# AUTHENTICATION ENDPOINTS
# ====================

@app.post("/login", response_model=Token)
async def login(login_data: LoginRequest):
    """
    Authenticate user and return JWT access token
    """
    logger.info(f"Login attempt for user: {login_data.username}")
    
    user = authenticate_user(login_data.username, login_data.password)
    if not user:
        logger.warning(f"Failed login attempt for user: {login_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, 
        expires_delta=access_token_expires
    )
    
    logger.info(f"User {login_data.username} logged in successfully")
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60  # in seconds
    }


@app.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """
    Logout endpoint (token invalidation happens client-side)
    """
    return {"status": "ok", "message": "Logged out successfully"}


@app.get("/verify-token")
async def verify_token(current_user: dict = Depends(get_current_user)):
    """
    Verify if the current token is valid
    """
    return {
        "status": "ok",
        "username": current_user["username"],
        "full_name": current_user["full_name"],
        "email": current_user["email"]
    }


# ====================
# TELEMETRIA
# ====================
@app.get("/telemetry")
def get_telemetry(current_user: dict = Depends(get_current_user)):
    """Restituisce telemetria drone + hangar (protected endpoint) - Optimized with connection pooling"""
    try:
        token = get_tb_token()
        headers = {"X-Authorization": f"Bearer {token}"}

        # Use session for connection pooling (much faster)
        drone_response = http_session.get(
            f"{BASE_URL}/api/plugins/telemetry/DEVICE/{DRONE_ID}/values/timeseries?useStrictDataTypes=true",
            headers=headers,
            timeout=3
        )
        drone_response.raise_for_status()
        drone = drone_response.json()

        hangar_response = http_session.get(
            f"{BASE_URL}/api/plugins/telemetry/DEVICE/{HANGAR_ID}/values/timeseries?useStrictDataTypes=true",
            headers=headers,
            timeout=3
        )
        hangar_response.raise_for_status()
        hangar = hangar_response.json()

        return {"drone": drone, "hangar": hangar}

    except requests.exceptions.Timeout:
        logger.error("ThingsBoard API timeout")
        raise HTTPException(status_code=504, detail="ThingsBoard API timeout")
    except requests.exceptions.RequestException as e:
        logger.error(f"ThingsBoard API error: {e}")
        raise HTTPException(status_code=502, detail=f"ThingsBoard API error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected telemetry error: {e}")
        raise HTTPException(status_code=500, detail=f"Errore nel recupero telemetria: {str(e)}")


# ====================
# MISSIONE
# ====================
@app.post("/mission")
def send_mission(mission: dict, current_user: dict = Depends(get_current_user)):
    """Invia missione al drone tramite ThingsBoard (protected endpoint)"""
    token = get_tb_token()
    headers = {"X-Authorization": f"Bearer {token}"}

    try:
        res = requests.post(
            f"{BASE_URL}/api/plugins/telemetry/DEVICE/{HANGAR_ID}/attributes/SHARED_SCOPE",
            headers=headers,
            json=mission,
            timeout=10
        )
        res.raise_for_status()
        return {"status": "ok"}

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Errore invio missione: {e}")


# ====================
# MISSIONI SALVATE (MOCK)
# ====================
@app.get("/missions")
def get_missions(current_user: dict = Depends(get_current_user)):
    """
    Restituisce un elenco di missioni predefinite (mock) (protected endpoint)
    per testare la sezione 'Carica missione' del frontend.
    """
    missions = [
        {
            "id": "m1",
            "name": "Ispezione magazzino nord",
            "speed": 1.2,
            "rth": True,
            "photo": True,
            "points": [
                {"lat": 44.5721534, "lon": 11.2514301, "alt": 25},
                {"lat": 44.5721970, "lon": 11.2514373, "alt": 25},
                {"lat": 44.5722105, "lon": 11.2515108, "alt": 25},
                {"lat": 44.5721534, "lon": 11.2514301, "alt": 25},
            ],
        },
        {
            "id": "m2",
            "name": "Perimetro edificio principale",
            "speed": 1.0,
            "rth": False,
            "photo": False,
            "points": [
                {"lat": 44.5721450, "lon": 11.2513000, "alt": 30},
                {"lat": 44.5721900, "lon": 11.2516000, "alt": 30},
                {"lat": 44.5720500, "lon": 11.2516200, "alt": 30},
                {"lat": 44.5720000, "lon": 11.2513200, "alt": 30},
                {"lat": 44.5721450, "lon": 11.2513000, "alt": 30},
            ],
        },
    ]

    return missions


# ==============================
#  DJI CLOUD API - TOKEN REQUEST
# ==============================
@app.get("/dji/token")
def get_dji_token(current_user: dict = Depends(get_current_user)):
    """Ottiene il token di accesso (access_token) dalle DJI Cloud API (protected endpoint)"""
    if not DJI_APP_KEY or not DJI_APP_LICENSE:
        raise HTTPException(
            status_code=400,
            detail="Variabili d'ambiente mancanti: DJI_APP_KEY o DJI_APP_LICENSE non impostate."
        )

    try:
        response = requests.post(
            f"{DJI_API_BASE}/v1/oauth/token",
            json={"app_key": DJI_APP_KEY, "app_license": DJI_APP_LICENSE},
            headers={"Content-Type": "application/json"},
            timeout=10
        )

        response.raise_for_status()
        data = response.json()

        # ✅ DJI risponde con {"code": 0, "message": "success", "data": {...}}
        if data.get("code") != 0 or "data" not in data or "access_token" not in data["data"]:
            raise HTTPException(status_code=500, detail=f"Risposta inattesa da DJI: {data}")

        return {
            "status": "success",
            "access_token": data["data"]["access_token"],
            "expires_in": data["data"].get("expires_in", 7200)
        }

    except requests.exceptions.ConnectionError as e:
        raise HTTPException(status_code=502, detail=f"Errore di connessione: {e}")

    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Timeout nella richiesta a DJI Cloud")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore interno: {e}")
