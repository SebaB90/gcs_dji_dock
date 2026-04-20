"""
file: app/main.py
"""
from loguru import logger
import signal
import sys
import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from sqlalchemy.orm import Session

# Config
from app.core.config import settings

# DB & Services
from app.database.core import engine, Base, SessionLocal
from app.users import service as user_service

# Modules Controllers
from app.users.controller import router as auth_router
from app.missions.controller import router as missions_router
from app.core.scheduler import MissionSchedulerService
import app.core.scheduler as mission_scheduler_module
from app.missions.models import MissionSchedule  # <--- Necessario per il ripristino
from app.video.controller import router as video_router
from app.video.service import get_video_service
from app.telemetry.controller import router as telemetry_router

# Integration
from app.integrations.adpm.thingsboard import ThingsBoardClient

# 1. CONFIGURAZIONE LOGGER (Mettilo prima di creare l'app)
# Rimuoviamo il logger di default e ne mettiamo uno colorato e pulito
logger.remove()
logger.add(
    sys.stderr, 
    format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="INFO",
    colorize=True
)

# 2. Setup DB Tables
# ATTENZIONE: create_all NON aggiorna tabelle esistenti. 
# Se hai cambiato i modelli, cancella il file .db prima di riavviare o usa Alembic.
Base.metadata.create_all(bind=engine)


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
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1|192\.168\.(?:[1-9]|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.\d+)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(missions_router)
app.include_router(video_router)
app.include_router(telemetry_router)

# 5. Events
@app.on_event("startup")
async def startup_event():
    logger.info("Starting GCS Backend...")
    
    db = SessionLocal()
    try:
        # --- A. CREAZIONE UTENTE ADMIN (SEED) ---
        user_service.init_first_user(db)
        
        # --- B. AVVIO SCHEDULER E RIPRISTINO ---
        logger.info("Initializing Mission Scheduler...")
        scheduler = MissionSchedulerService(tb_client)
        mission_scheduler_module.scheduler_instance = scheduler

        # --- C. INIZIALIZZAZIONE VIDEO SERVICE ---
        logger.info("Initializing Video Service (Shared Memory)...")
        video_service = get_video_service()
        if video_service.shm is not None:
            logger.success("✅ Video Service initialized successfully")
        else:
            logger.warning("⚠️  Video Service: Shared memory initialization failed")

        # LOGICA DI RIPRISTINO: Ricarica i job dal DB
        active_schedules = db.query(MissionSchedule).filter(MissionSchedule.enabled == True).all()
        count = 0
        for sched in active_schedules:
            try:
                # Riutilizziamo la logica che abbiamo scritto nel service
                scheduler.update_schedule_job(db, sched)
                count += 1
            except Exception as e:
                logger.error(f"Failed to restore schedule {sched.id}: {e}")
        
        logger.info(f"♻️  Restored {count} mission schedules from database.")

    except Exception as e:
        logger.error(f"Startup error: {e}")
    finally:
        db.close()
    
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

    # Cleanup video service shared memory
    try:
        video_service = get_video_service()
        video_service.cleanup()
        logger.info("Video Service shared memory cleaned up")
    except Exception as e:
        logger.error(f"Error cleaning up video service: {e}")

    http_session.close()
    tb_client.clear_token_cache()
    logger.info("Shutdown complete.")

# 6. Base Endpoints
@app.get("/health")
def health(): return {"status": "healthy"}

@app.get("/")
def root(): return {"service": "GCS Backend", "version": settings.APP_VERSION}