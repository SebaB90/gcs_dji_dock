"""
file: app/main.py

Main entry point for the FieldRobotics GCS Backend application.

Responsibilities:
- Application initialization (FastAPI) and Middleware setup (CORS).
- Database initialization (SQLAlchemy table creation).
- Global resources setup (HTTP Session, ThingsBoard Client).
- Router registration (Auth, Missions, Video, Docks).
- Lifecycle events:
  1. Automatic Admin User creation (Seed).
  2. Mission Scheduler startup/shutdown.
  3. Resource cleanup (HTTP sessions).
"""

import logging
import signal
import sys
import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Config
from app.core.config import settings

# DB & Services
from app.database.core import engine, Base, SessionLocal
from app.users import service as user_service  # <--- Serve per creare l'admin

# Modules Controllers
from app.users.controller import router as auth_router
from app.missions.controller import router as missions_router
from app.missions.scheduler import MissionSchedulerService
import app.missions.scheduler as mission_scheduler_module
from app.video.controller import router as video_router
from app.docks.controller import router as docks_router

# Integration
from app.integrations.adpm.thingsboard import ThingsBoardClient

# 1. Setup DB Tables
Base.metadata.create_all(bind=engine)

# 2. Setup Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION)

# 3. Setup HTTP Client Globale
def get_http_session():
    s = requests.Session()
    adapter = HTTPAdapter(max_retries=Retry(total=3, backoff_factor=0.5), pool_connections=10, pool_maxsize=10)
    s.mount("http://", adapter)
    s.mount("https://", adapter)
    return s

http_session = get_http_session()
tb_client = ThingsBoardClient(http_session)

# 4. Middleware & Routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(missions_router)
app.include_router(video_router)
app.include_router(docks_router)

# 5. Events
@app.on_event("startup")
async def startup_event():
    logger.info("Starting GCS Backend...")
    
    # --- A. CREAZIONE UTENTE ADMIN (SEED) ---
    # Apriamo una sessione temporanea per controllare se l'admin esiste
    db = SessionLocal()
    try:
        user_service.init_first_user(db)
    except Exception as e:
        logger.error(f"Errore durante la creazione dell'utente admin: {e}")
    finally:
        db.close()
    
    # --- B. AVVIO SCHEDULER ---
    scheduler = MissionSchedulerService(tb_client)
    mission_scheduler_module.scheduler_instance = scheduler
    
    logger.info("System Ready.")
    
    # --- C. STAMPA LINK ---
    print("\n" + "="*60)
    print(f"🚀 {settings.APP_NAME} v{settings.APP_VERSION} is running!")
    print(f"👤 Admin User:   {settings.GCS_USERNAME}")
    print(f"📄 Docs (Swagger):  http://localhost:8000/docs")
    print(f"📚 Docs (ReDoc):    http://localhost:8000/redoc")
    print("="*60 + "\n")

@app.on_event("shutdown")
async def shutdown_event():
    if mission_scheduler_module.scheduler_instance:
        mission_scheduler_module.scheduler_instance.stop()
    http_session.close()
    tb_client.clear_token_cache()
    logger.info("Shutdown complete.")

# 6. Base Endpoints
@app.get("/health")
def health(): return {"status": "healthy"}

@app.get("/")
def root(): return {"service": "GCS Backend", "version": settings.APP_VERSION}