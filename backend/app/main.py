from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from typing import Optional, List
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import os
import logging
import signal
import sys
from dotenv import load_dotenv

# Import mission scheduling modules
from app.mission_db import MissionDB
from app.mission_scheduler import MissionScheduler
from app.video_controller import get_video_controller, VIDEO_SOURCE_WIDE, VIDEO_SOURCE_ZOOM, VIDEO_SOURCE_THERMAL

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

# Initialize mission database and scheduler
mission_db = None
mission_scheduler = None

# ====================
# GRACEFUL SHUTDOWN
# ====================

def shutdown_handler(signum, frame):
    """Handle shutdown signals gracefully"""
    logger.info(f"Received signal {signum}, shutting down gracefully...")
    
    # Stop mission scheduler
    global mission_scheduler
    if mission_scheduler:
        mission_scheduler.stop()
        logger.info("Mission scheduler stopped")
    
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
    """Log application startup and initialize mission scheduler"""
    global mission_db, mission_scheduler
    
    logger.info("GCS Backend starting up...")
    logger.info("HTTP connection pooling initialized")
    
    # Initialize mission database
    db_path = os.getenv("MISSION_DB_PATH", "missions.db")
    mission_db = MissionDB(db_path)
    logger.info(f"Mission database initialized: {db_path}")
    
    # Initialize and start mission scheduler
    tb_api_url = f"{BASE_URL}/api/plugins/telemetry/DEVICE/{HANGAR_ID}/attributes/SHARED_SCOPE"
    mission_scheduler = MissionScheduler(
        mission_db=mission_db,
        tb_api_url=tb_api_url,
        get_token_func=get_tb_token
    )
    logger.info("Mission scheduler initialized and started")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on application shutdown"""
    global mission_scheduler
    
    logger.info("GCS Backend shutting down...")
    
    if mission_scheduler:
        mission_scheduler.stop()
        logger.info("Mission scheduler stopped")
    
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

# Mission models
class WaypointModel(BaseModel):
    lat: float
    lon: float
    alt: float

class MissionModel(BaseModel):
    name: str
    waypoints: List[WaypointModel]
    speed: Optional[float] = 1.0
    rth: Optional[bool] = True
    photo: Optional[bool] = False

class MissionScheduleModel(BaseModel):
    schedule_type: str  # "immediate", "once", "recurring"
    start_time: Optional[str] = None  # ISO format for "once" and "recurring"
    recurrence_pattern: Optional[str] = None  # "daily", "weekly"
    recurrence_value: Optional[str] = None  # e.g., "Mon,Wed,Fri:08:00,16:00" for weekly or "08:00,16:00" for daily
    enabled: Optional[bool] = True

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

# Telemetry cache to reduce API calls
_telemetry_cache = {
    "data": None,
    "timestamp": 0,
    "ttl": 1.0  # Cache for 1 second
}

@app.get("/telemetry")
def get_telemetry(current_user: dict = Depends(get_current_user)):
    """Restituisce telemetria drone + hangar (protected endpoint) - Optimized with connection pooling and caching"""
    import time
    
    # Check cache first
    current_time = time.time()
    if _telemetry_cache["data"] and (current_time - _telemetry_cache["timestamp"]) < _telemetry_cache["ttl"]:
        return _telemetry_cache["data"]
    
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

        result = {"drone": drone, "hangar": hangar}
        
        # Update cache
        _telemetry_cache["data"] = result
        _telemetry_cache["timestamp"] = current_time
        
        return result

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


# ====================
# MISSION MANAGEMENT API
# ====================

@app.post("/api/missions")
def create_mission(mission: MissionModel, current_user: dict = Depends(get_current_user)):
    """Create a new mission and save it to the database"""
    try:
        # Convert waypoints to dict format
        waypoints = [{"lat": wp.lat, "lon": wp.lon, "alt": wp.alt} for wp in mission.waypoints]
        
        mission_data = {
            "name": mission.name,
            "waypoints": waypoints,
            "speed": mission.speed,
            "rth": mission.rth,
            "photo": mission.photo
        }
        
        mission_id = mission_db.create_mission(
            name=mission.name,
            waypoints=waypoints,
            speed=mission.speed,
            rth=mission.rth,
            photo=mission.photo
        )
        
        logger.info(f"Mission created: {mission.name} (ID: {mission_id})")
        return {
            "status": "success",
            "mission_id": mission_id,
            "message": f"Mission '{mission.name}' created successfully"
        }
    except Exception as e:
        logger.error(f"Error creating mission: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating mission: {str(e)}")


@app.get("/api/missions")
def list_missions(current_user: dict = Depends(get_current_user)):
    """List all saved missions"""
    try:
        missions = mission_db.get_all_missions()
        return {
            "status": "success",
            "missions": missions
        }
    except Exception as e:
        logger.error(f"Error listing missions: {e}")
        raise HTTPException(status_code=500, detail=f"Error listing missions: {str(e)}")


@app.get("/api/missions/{mission_id}")
def get_mission_detail(mission_id: int, current_user: dict = Depends(get_current_user)):
    """Get details of a specific mission"""
    try:
        mission = mission_db.get_mission(mission_id)
        if not mission:
            raise HTTPException(status_code=404, detail="Mission not found")
        
        return {
            "status": "success",
            "mission": mission
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting mission {mission_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting mission: {str(e)}")


@app.put("/api/missions/{mission_id}")
def update_mission(
    mission_id: int, 
    mission: MissionModel, 
    current_user: dict = Depends(get_current_user)
):
    """Update an existing mission"""
    try:
        # Check if mission exists
        existing = mission_db.get_mission(mission_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Mission not found")
        
        # Convert waypoints
        waypoints = [{"lat": wp.lat, "lon": wp.lon, "alt": wp.alt} for wp in mission.waypoints]
        
        mission_db.update_mission(
            mission_id=mission_id,
            name=mission.name,
            waypoints=waypoints,
            speed=mission.speed,
            rth=mission.rth,
            photo=mission.photo
        )
        
        logger.info(f"Mission updated: {mission.name} (ID: {mission_id})")
        return {
            "status": "success",
            "message": f"Mission '{mission.name}' updated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating mission {mission_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating mission: {str(e)}")


@app.delete("/api/missions/{mission_id}")
def delete_mission(mission_id: int, current_user: dict = Depends(get_current_user)):
    """Delete a mission"""
    try:
        # Check if mission exists
        existing = mission_db.get_mission(mission_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Mission not found")
        
        mission_db.delete_mission(mission_id)
        
        logger.info(f"Mission deleted: ID {mission_id}")
        return {
            "status": "success",
            "message": "Mission deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting mission {mission_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting mission: {str(e)}")


@app.post("/api/missions/{mission_id}/execute")
def execute_mission_now(mission_id: int, current_user: dict = Depends(get_current_user)):
    """Execute a mission immediately"""
    try:
        # Get mission details
        mission = mission_db.get_mission(mission_id)
        if not mission:
            raise HTTPException(status_code=404, detail="Mission not found")
        
        # Create immediate schedule
        schedule_id = mission_db.create_schedule(
            mission_id=mission_id,
            schedule_type="immediate"
        )
        
        # Add job to scheduler
        mission_scheduler.add_immediate_mission(mission_id, schedule_id)
        
        logger.info(f"Mission {mission_id} scheduled for immediate execution")
        return {
            "status": "success",
            "message": f"Mission '{mission['name']}' scheduled for immediate execution",
            "schedule_id": schedule_id
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error executing mission {mission_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error executing mission: {str(e)}")


@app.post("/api/missions/{mission_id}/schedules")
def create_mission_schedule(
    mission_id: int,
    schedule: MissionScheduleModel,
    current_user: dict = Depends(get_current_user)
):
    """Create a schedule for a mission (one-time or recurring)"""
    try:
        # Check if mission exists
        mission = mission_db.get_mission(mission_id)
        if not mission:
            raise HTTPException(status_code=404, detail="Mission not found")
        
        # Validate schedule type
        if schedule.schedule_type not in ["once", "recurring"]:
            raise HTTPException(
                status_code=400, 
                detail="Invalid schedule_type. Use 'once' or 'recurring'"
            )
        
        # Create schedule in database
        # Convert recurrence_pattern string to dict format for database
        recurrence_pattern_dict = None
        if schedule.schedule_type == "recurring" and schedule.recurrence_pattern and schedule.recurrence_value:
            if schedule.recurrence_pattern == "daily":
                # recurrence_value: "08:00,16:00"
                times = schedule.recurrence_value.split(",")
                recurrence_pattern_dict = {
                    "pattern": "daily",
                    "days": [0, 1, 2, 3, 4, 5, 6],  # All days (0=Sunday)
                    "times": times
                }
            elif schedule.recurrence_pattern == "weekly":
                # recurrence_value: "Mon,Wed,Fri:08:00,16:00"
                parts = schedule.recurrence_value.split(":")
                day_names = parts[0].split(",")
                times = parts[1].split(",") if len(parts) > 1 else ["08:00"]
                
                # Convert day names to numbers (0=Sunday)
                day_map = {"Sun": 0, "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6}
                days = [day_map.get(d, 0) for d in day_names]
                
                recurrence_pattern_dict = {
                    "pattern": "weekly",
                    "days": days,
                    "times": times
                }
        
        schedule_id = mission_db.create_schedule(
            mission_id=mission_id,
            schedule_type=schedule.schedule_type,
            start_time=schedule.start_time,
            recurrence_pattern=recurrence_pattern_dict
        )
        
        # Add to scheduler
        mission_scheduler.reload_schedules()
        
        logger.info(f"Schedule created for mission {mission_id}: {schedule.schedule_type}")
        return {
            "status": "success",
            "schedule_id": schedule_id,
            "message": f"Schedule created for mission '{mission['name']}'"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating schedule for mission {mission_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating schedule: {str(e)}")


@app.get("/api/missions/{mission_id}/schedules")
def get_mission_schedules(mission_id: int, current_user: dict = Depends(get_current_user)):
    """Get all schedules for a specific mission"""
    try:
        schedules = mission_db.get_schedules_for_mission(mission_id)
        return {
            "status": "success",
            "schedules": schedules
        }
    except Exception as e:
        logger.error(f"Error getting schedules for mission {mission_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting schedules: {str(e)}")


@app.get("/api/schedules")
def get_all_schedules(current_user: dict = Depends(get_current_user)):
    """Get all active schedules"""
    try:
        schedules = mission_db.get_enabled_schedules()
        return {
            "status": "success",
            "schedules": schedules
        }
    except Exception as e:
        logger.error(f"Error getting all schedules: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting schedules: {str(e)}")


@app.patch("/api/schedules/{schedule_id}")
def patch_schedule(
    schedule_id: int,
    update_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Partially update a schedule (e.g., toggle enabled status)"""
    try:
        mission_db.update_schedule(schedule_id=schedule_id, **update_data)
        
        # Reload scheduler
        mission_scheduler.reload_schedules()
        
        logger.info(f"Schedule {schedule_id} updated")
        return {
            "status": "success",
            "message": "Schedule updated successfully"
        }
    except Exception as e:
        logger.error(f"Error updating schedule {schedule_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating schedule: {str(e)}")


@app.put("/api/schedules/{schedule_id}")
def update_schedule(
    schedule_id: int,
    schedule: MissionScheduleModel,
    current_user: dict = Depends(get_current_user)
):
    """Update a mission schedule"""
    try:
        mission_db.update_schedule(
            schedule_id=schedule_id,
            schedule_type=schedule.schedule_type,
            start_time=schedule.start_time,
            recurrence_pattern=schedule.recurrence_pattern,
            recurrence_value=schedule.recurrence_value,
            enabled=schedule.enabled
        )
        
        # Reload scheduler
        mission_scheduler.reload_schedules()
        
        logger.info(f"Schedule {schedule_id} updated")
        return {
            "status": "success",
            "message": "Schedule updated successfully"
        }
    except Exception as e:
        logger.error(f"Error updating schedule {schedule_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating schedule: {str(e)}")


@app.delete("/api/schedules/{schedule_id}")
def delete_schedule(schedule_id: int, current_user: dict = Depends(get_current_user)):
    """Delete a mission schedule"""
    try:
        mission_db.delete_schedule(schedule_id)
        
        # Reload scheduler
        mission_scheduler.reload_schedules()
        
        logger.info(f"Schedule {schedule_id} deleted")
        return {
            "status": "success",
            "message": "Schedule deleted successfully"
        }
    except Exception as e:
        logger.error(f"Error deleting schedule {schedule_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting schedule: {str(e)}")


@app.get("/api/executions")
def get_executions(
    mission_id: Optional[int] = None,
    limit: Optional[int] = 50,
    current_user: dict = Depends(get_current_user)
):
    """Get mission execution history"""
    try:
        executions = mission_db.get_executions(mission_id=mission_id, limit=limit)
        return {
            "status": "success",
            "executions": executions
        }
    except Exception as e:
        logger.error(f"Error getting executions: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting executions: {str(e)}")


# ==============================
#  VIDEO SOURCE CONTROL
# ==============================

@app.get("/api/video/source")
def get_video_source(current_user: dict = Depends(get_current_user)):
    """Get current video source"""
    try:
        controller = get_video_controller()
        source = controller.get_source()
        
        source_name = {
            VIDEO_SOURCE_WIDE: "wide",
            VIDEO_SOURCE_ZOOM: "zoom",
            VIDEO_SOURCE_THERMAL: "thermal"
        }.get(source, "unknown")
        
        return {
            "status": "success",
            "source_id": source,
            "source_name": source_name
        }
    except Exception as e:
        logger.error(f"Error getting video source: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting video source: {str(e)}")


@app.post("/api/video/source/{source_name}")
def set_video_source(source_name: str, current_user: dict = Depends(get_current_user)):
    """
    Set video source
    
    Args:
        source_name: Video source name (wide, zoom, thermal)
    """
    try:
        # Map source name to ID
        source_map = {
            "wide": VIDEO_SOURCE_WIDE,
            "zoom": VIDEO_SOURCE_ZOOM,
            "thermal": VIDEO_SOURCE_THERMAL
        }
        
        source_id = source_map.get(source_name.lower())
        if source_id is None:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid source name. Use: wide, zoom, or thermal"
            )
        
        controller = get_video_controller()
        success = controller.set_source(source_id)
        
        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to set video source"
            )
        
        logger.info(f"Video source switched to: {source_name} ({source_id})")
        return {
            "status": "success",
            "source_id": source_id,
            "source_name": source_name,
            "message": f"Video source switched to {source_name}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error setting video source: {e}")
        raise HTTPException(status_code=500, detail=f"Error setting video source: {str(e)}")


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
