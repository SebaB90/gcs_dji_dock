# 🛰️ GCS DJI Dock — Ground Control Station per Droni DJI

Una **Ground Control Station web-based** per il controllo autonomo di un **DJI Dock 2** con drone associato, sviluppata tramite collaborazione con **ADPM** sfruttando le loro API per la comunicazione con i droni.

---

## 📌 Overview

**GCS DJI Dock** è un sistema completo che permette agli operatori di:

✅ **Visualizzare dati telemetrici** live di UAV e Dock  
✅ **Pianificare e lanciare missioni** con waypoint geografici  
✅ **Programmare esecuzioni ricorrenti** via job scheduler  
✅ **Controllare il video streaming** live dal drone  
✅ **Amministrare utenti** con ruoli e permessi  
✅ **Consultare lo storico** di esecuzioni passate  

### Architettura Generale

Il sistema è diviso in **due componenti principali**:

- **Frontend** (`/frontend`) — Interfaccia web moderna e responsive
- **Backend** (`/backend`) — API REST e logica di business

Adottiamo uno **stack moderno e standard**:
- **Backend**: FastAPI (Python) — robusto, veloce, con Swagger auto-generato
- **Frontend**: React (JavaScript) — componenti reattivi e interfaccia intuitiva
- **Database**: SQLite — persistenza dati locale, zero setup
- **Container**: Docker + Docker Compose — deployment rapido e reproducibile

---

## 🚀 Avvio Veloce

### Prerequisites
- Docker e Docker Compose

### Start applicazione
```bash
docker-compose up -d
```

### Accesso
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs (Swagger)**: http://localhost:8000/docs

### Credenziali di login
- **Username**: `admin`
- **Password**: `admin123`

### Comandi utili
```bash
# Spegnere tutto
docker-compose down

# Vedere i log
docker-compose logs -f backend
docker-compose logs -f frontend

# Controllare stato servizi
docker-compose ps

# Ricostruire dopo modifiche
docker-compose down
docker-compose up --build -d
```

---

## 🏗️ Architettura Tecnica

```
┌─────────────────────────────────────┐
│       Browser (Utente)              │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  FRONTEND (React + Vite + Leaflet)  │
│  ├─ Login Panel                     │
│  ├─ Mappa Interattiva               │
│  ├─ Gestione Missioni               │
│  ├─ Video Streaming                 │
│  └─ Telemetria Real-time            │
└─────────────────┬───────────────────┘
                  │ HTTP(S) + JWT
                  ▼
┌─────────────────────────────────────┐
│    BACKEND (FastAPI - Python)       │
│  ├─ /auth → Autenticazione          │
│  ├─ /missions → Gestione Missioni   │
│  ├─ /telemetry → Dati Real-time     │
│  ├─ /video → Video Streaming        │
│  └─ /users → Amministrazione        │
│                                     │
│  Core:                              │
│  • APScheduler (Job Scheduling)     │
│  • SQLAlchemy ORM (Database)        │
│  • JWT Auth (python-jose)           │
│  • HTTP Client + Retry Logic        │
└─────────────────┬───────────────────┘
                  │
        ┌─────────┼─────────┐
        ▼         ▼         ▼
     SQLite   ThingsBoard  DJI API
     (Local)  (ADPM)     (External)
```

---

## 📂 Struttura Backend

Il backend è organizzato in **moduli tematici**, ognuno con una **struttura coerente e prevedibile**.

```
backend/app/
├── main.py                              # Entry point del backend
├── core/
│   ├── config.py                        # Configurazione centralizzata (.env)
│   ├── scheduler.py                     # Gestione scheduler APScheduler
│   └── __init__.py
├── database/
│   ├── core.py                          # Setup SQLAlchemy engine
│   └── __init__.py
├── integrations/
│   └── adpm/
│       └── thingsboard.py               # Client API ThingsBoard (ADPM)
├── users/
│   ├── models.py                        # ORM model User
│   ├── schemas.py                       # Pydantic schemas (request/response)
│   ├── service.py                       # Business logic users
│   ├── controller.py                    # FastAPI routes (/users, /auth)
│   └── __init__.py
├── missions/
│   ├── models.py                        # ORM models (Mission, Schedule, Execution)
│   ├── schemas.py                       # Pydantic schemas
│   ├── service.py                       # Business logic missioni
│   ├── controller.py                    # FastAPI routes (/missions)
│   └── __init__.py
├── telemetry/
│   ├── service.py                       # Fetch telemetry da ThingsBoard
│   ├── controller.py                    # WebSocket routes (/ws/telemetry)
│   └── __init__.py
├── video/
│   ├── service.py                       # Video streaming (shared memory)
│   ├── controller.py                    # FastAPI routes (/video)
│   └── __init__.py
└── requirements.txt
```

### Spiegazione della Struttura

#### **main.py**
Entry point dell'applicazione FastAPI. Qui si:
- Crea l'istanza `FastAPI()`
- Registra i router di tutti i moduli
- Configura CORS, middleware, event handlers (startup/shutdown)
- Avvia lo scheduler

Esempio:
```python
from fastapi import FastAPI
from app.users.controller import router as users_router
from app.missions.controller import router as missions_router

app = FastAPI()
app.include_router(users_router, prefix="/auth")
app.include_router(missions_router, prefix="/missions")
```

---

### **core/** — Configurazione e Scheduler

La cartella `core` contiene i servizi fondamentali del backend: configurazione centralizzata e gestione dello scheduler.

#### **core/config.py**
Gestione centralizzata della **configurazione** da variabili di ambiente (`.env`).

Responsabilità:
- Leggere `SECRET_KEY`, `DATABASE_URL`, credenziali ThingsBoard, ecc.
- Esporre variabili come `settings.SECRET_KEY`, `settings.TB_URL`, ecc.
- Validare che tutte le config necessarie siano presenti

Esempio:
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "GCS DJI Dock"
    SECRET_KEY: str
    DATABASE_URL: str
    TB_URL: str
    TB_USERNAME: str
    TB_PASSWORD: str
    
    class Config:
        env_file = ".env"

settings = Settings()
```

---

#### **core/scheduler.py**
Wrapper attorno a **APScheduler** per gestire **job ricorrenti** (missioni schedulate).

Responsabilità:
- Inizializzare `BackgroundScheduler`
- Aggiungere/rimuovere job quando uno schedule viene creato/eliminato
- Parsificare il `recurrence_pattern` JSON in cron expressions
- Ripristinare gli schedules attivi all'avvio del backend

Esempio:
```python
from apscheduler.schedulers.background import BackgroundScheduler

scheduler = BackgroundScheduler(daemon=True)

def add_schedule_job(schedule_id: int, dock_name: str, times: list[str], days: list[int]):
    for time_str in times:  # Es. ["08:00", "14:00"]
        hour, minute = map(int, time_str.split(":"))
        scheduler.add_job(
            func=execute_mission_job,
            trigger='cron',
            day_of_week=','.join(map(str, days)),
            hour=hour,
            minute=minute,
            id=f'schedule_{schedule_id}_{time_str}'
        )

scheduler.start()
```

---

### **database/** — Setup Database

La cartella `database` gestisce l'infrastruttura del database, definendo l'engine SQLAlchemy e le sessioni.

#### **database/core.py**
Setup infrastruttura **SQLAlchemy**.

Responsabilità:
- Creare `SQLAlchemy engine` con `DATABASE_URL`
- Definire `Base` (classe padre di tutti gli ORM models)
- Creare `SessionLocal` factory (sessioni database)
- Setup connection pooling

Esempio:
```python
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = "sqlite:///./app/database/gcs.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

### **integrations/** — Servizi Esterni

La cartella `integrations` gestisce l'integrazione con servizi esterni (ThingsBoard ADPM, DJI Cloud API, ecc.). È strutturata per essere modulare e facilmente estendibile in futuro a nuove integrazioni.

## 📊 Database Schema

### Tabelle Principali

**users** — Utenti dell'applicazione
```sql
id, username, hashed_password, email, is_active, role
```

**missions** — Definizioni missioni (waypoint + parametri)
```sql
id, name, description, speed, rth, photo, waypoints (JSON), created_at
```

**mission_schedules** — Schedule ricorrenti
```sql
id, mission_id, dock_name, schedule_type, recurrence_pattern (JSON), enabled
```

**mission_executions** — Log di ogni esecuzione
```sql
id, mission_id, schedule_id, dock_name, execution_type, status, started_at, result (JSON)
```

---

#### **integrations/adpm/thingsboard.py**
**Client HTTP** per comunicare con **ThingsBoard ADPM** (Autonomous Drone Platform Management).

Responsabilità:
- Autenticarsi a ThingsBoard (login → JWT token)
- Inviare missioni a ThingsBoard (`POST /api/adpm/missions/execute`)
- Pollare lo stato di una missione (`GET /api/adpm/missions/{id}/status`)
- Fetch dati telemetrici del drone (`GET /api/plugins/telemetry/{device_id}/values/timeseries`)
- Gestire retry logic e caching del token

Esempio:
```python
class ThingsBoardClient:
    def __init__(self, http_session):
        self.base_url = settings.TB_URL
        self.token_cache = None
    
    def get_token(self):
        if self.token_cache and not self.token_cache.expired:
            return self.token_cache.value
        
        response = self.session.post(f"{self.base_url}/api/auth/login", 
                                      json={"username": settings.TB_USERNAME, 
                                            "password": settings.TB_PASSWORD})
        token = response.json()['token']
        self.token_cache = CachedToken(token)
        return token
    
    def execute_mission(self, dock_id: str, mission_data: dict):
        token = self.get_token()
        response = self.session.post(
            f"{self.base_url}/api/adpm/missions/execute",
            headers={"Authorization": f"Bearer {token}"},
            json={"dock_id": dock_id, "mission": mission_data}
        )
        return response.json()
```

---

### Struttura Standard di ogni Modulo (users, missions, telemetry, ecc.)

Ogni modulo tematico (ad es. `users/`, `missions/`) segue una **struttura coerente** composta da:

#### 1️⃣ **models.py** — ORM Models
Definisce le **entità del database** usando SQLAlchemy.

Responsabilità:
- Definire la struttura delle tabelle
- Specificare colonne, tipi, vincoli
- Definire relazioni tra tabelle (FK, one-to-many, many-to-many)

Esempio (users):
```python
from sqlalchemy import Column, Integer, String, Boolean
from app.database.core import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    email = Column(String, unique=True)
    is_active = Column(Boolean, default=True)
    role = Column(String, default="viewer")  # admin, operator, viewer
```

Esempio (missions):
```python
class Mission(Base):
    __tablename__ = "missions"
    
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    speed = Column(Float, default=1.0)
    rth = Column(Boolean, default=True)  # Return to Home
    waypoints = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
```

---

#### 2️⃣ **schemas.py** — Pydantic Schemas
Definisce la **struttura dei dati** per richieste e risposte API.

Responsabilità:
- Validare dati in input (request body)
- Serializzare dati in output (response JSON)
- Fornire documentazione Swagger automatica
- Convertire ORM models → JSON

Esempio (users):
```python
from pydantic import BaseModel

class UserCreate(BaseModel):
    username: str
    password: str
    email: str
    role: str = "viewer"

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    is_active: bool
    
    class Config:
        from_attributes = True  # Legge da ORM model
```

Esempio (missions):
```python
class WaypointSchema(BaseModel):
    lat: float
    lon: float
    alt: float
    heading: int = 0
    tilt_gimbal: int = -45

class MissionCreate(BaseModel):
    name: str
    description: str
    speed: float = 1.0
    rth: bool = True
    waypoints: list[WaypointSchema]

class MissionResponse(BaseModel):
    id: int
    name: str
    speed: float
    waypoints: list[WaypointSchema]
    created_at: datetime
```

---

#### 3️⃣ **service.py** — Business Logic Layer
Contiene **tutta la logica di business** del modulo.

Responsabilità:
- Implementare operazioni CRUD (Create, Read, Update, Delete)
- Orchestrare operazioni tra database e API esterne
- Trasformare dati tra formati
- Gestire validazioni complesse
- Gestire transazioni database

Esempio (users):
```python
from app.users.models import User
from app.database.core import SessionLocal
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"])

class UserService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_user(self, user_create: UserCreate) -> User:
        hashed_pwd = pwd_context.hash(user_create.password)
        user = User(
            username=user_create.username,
            hashed_password=hashed_pwd,
            email=user_create.email,
            role=user_create.role
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def authenticate_user(self, username: str, password: str) -> User | None:
        user = self.db.query(User).filter(User.username == username).first()
        if not user or not pwd_context.verify(password, user.hashed_password):
            return None
        return user
```

Esempio (missions):
```python
class MissionService:
    def __init__(self, db: Session, tb_client: ThingsBoardClient):
        self.db = db
        self.tb_client = tb_client
    
    def create_mission(self, mission_create: MissionCreate) -> Mission:
        mission = Mission(
            name=mission_create.name,
            speed=mission_create.speed,
            waypoints=mission_create.waypoints,
            rth=mission_create.rth
        )
        self.db.add(mission)
        self.db.commit()
        return mission
    
    def execute_mission(self, mission_id: int, dock_name: str) -> MissionExecution:
        mission = self.db.query(Mission).get(mission_id)
        if not mission:
            raise ValueError("Mission not found")
        
        # Chiama API ThingsBoard per mandare la missione al drone
        result = self.tb_client.execute_mission(
            dock_id=dock_name,
            mission_data={
                "speed": mission.speed,
                "rth": mission.rth,
                "waypoints": mission.waypoints
            }
        )
        
        # Salva execution nel database
        execution = MissionExecution(
            mission_id=mission_id,
            dock_name=dock_name,
            execution_type="manual",
            status="sent_to_tb",
            result=result
        )
        self.db.add(execution)
        self.db.commit()
        return execution
```

---

#### 4️⃣ **controller.py** — FastAPI Routes (Routers)
Definisce gli **endpoint HTTP** esposti dal backend.

Responsabilità:
- Definire rotte FastAPI (`@router.post`, `@router.get`, ecc.)
- Validare input con Pydantic schemas
- Richiamare service layer per logica di business
- Ritornare response con status code appropriato
- Gestire errori e eccezioni

Esempio (users):
```python
from fastapi import APIRouter, HTTPException, Depends
from app.users.schemas import UserCreate, UserResponse
from app.users.service import UserService
from app.database.core import get_db
from sqlalchemy.orm import Session

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=UserResponse)
async def create_user(user_create: UserCreate, db: Session = Depends(get_db)):
    service = UserService(db)
    
    # Controlla se utente già esiste
    existing = db.query(User).filter(User.username == user_create.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Crea utente
    user = service.create_user(user_create)
    return user

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    service = UserService(db)
    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
```

Esempio (missions):
```python
@router.post("/{mission_id}/execute", response_model=MissionExecutionResponse)
async def execute_mission(
    mission_id: int,
    execute_request: MissionExecuteRequest,
    db: Session = Depends(get_db)
):
    service = MissionService(db, tb_client=get_tb_client())
    
    try:
        execution = service.execute_mission(mission_id, execute_request.dock_name)
        return execution
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to execute mission")
```

---

### Flusso di una Richiesta HTTP

Ecco come una richiesta HTTP passa attraverso il backend:

```
1. Client invia: POST /missions/1/execute
                 Body: {"dock_name": "DOCK1"}
                 Header: Authorization: Bearer <token>

2. FastAPI riceve la richiesta
   ↓
3. Middleware JWT verifica token
   ↓
4. Router (@router.post) valida schema Pydantic
   ↓
5. Controller chiama Service
   Service chiama Database (ORM)
   Service chiama API esterne (ThingsBoard)
   ↓
6. Service ritorna risultato al Controller
   ↓
7. Controller serializza risposta (Pydantic schema)
   ↓
8. FastAPI invia JSON response + status code
   ↓
9. Client riceve: 200 OK
                  Body: {"execution_id": 42, "status": "sent_to_tb", ...}
```

---

## 🔐 Autenticazione JWT

Il sistema usa **JWT (JSON Web Tokens)** per autenticazione:

1. **Login** → POST `/auth/login` con username/password
2. **Backend** → Verifica credenziali, genera JWT token
3. **Frontend** → Salva token in localStorage
4. **Richieste successive** → Include token nel header `Authorization: Bearer <token>`
5. **Backend** → Verifica firma e scadenza del token

Token di default scade in **24 ore**.

---

## 🌐 Frontend

Frontend React con:
- **Mappa interattiva** Mapbox satellite
- **Panel telemetria** con grafici real-time (Recharts)
- **Video player** HLS per streaming drone
- **Mission editor** con waypoint click-to-place
- **Admin panel** per gestione utenti

Struttura:
```
frontend/src/
├── pages/ → LoginPage, MainPage
├── components/
│   ├── layout/ → Sidebar, Navigation
│   ├── panels/ → TelemetryPanel, MissionPanel, VideoPanel
│   └── admin/ → UsersManagement
└── assets/ → Icone, immagini
```

---

## 🔧 Configurazione

### Backend (.env)
```env
APP_NAME=GCS DJI Dock
SECRET_KEY=<strong-secret>
DATABASE_URL=sqlite:///./app/database/gcs.db

TB_URL=http://thingsboard.example.com:8080
TB_USERNAME=gcs_user
TB_PASSWORD=password

ACCESS_TOKEN_EXPIRE_HOURS=24
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000
MAPBOX_TOKEN=<mapbox-public-token>
```

---

## 📝 API Endpoints Principali

### Autenticazione
- `POST /auth/login` — Login e riceve JWT token

### Missioni
- `GET /missions` — Lista missioni
- `POST /missions` — Crea missione
- `POST /missions/{id}/execute` — Esegui missione immediatamente
- `GET /missions/{id}/executions` — Storico esecuzioni

### Schedule
- `POST /missions/{id}/schedules` — Crea schedule ricorrente
- `GET /missions/{id}/schedules` — Lista schedule

### Telemetria
- `WS /ws/telemetry` — WebSocket real-time telemetry
- `GET /telemetry/latest` — Ultimo snapshot telemetry

### Video
- `POST /video/start` — Avvia streaming
- `GET /video/stream.m3u8` — HLS manifest
- `POST /video/stop` — Arresta streaming

### Utenti (Admin)
- `GET /users` — Lista utenti
- `POST /users` — Crea utente
- `PUT /users/{id}` — Modifica utente
- `DELETE /users/{id}` — Elimina utente

### Documentazione interattiva
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## 📖 Guida allo Sviluppo

### Backend (Development)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Edita .env con credenziali

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Server disponibile su http://localhost:8000 con hot reload.

### Frontend (Development)

```bash
cd frontend
npm install

cp .env.example .env
# Edita .env con VITE_API_URL=http://localhost:8000

npm run dev
```

Dev server su http://localhost:5173 con hot reload.

---

## 🐳 Deployment con Docker

### Build e avvio
```bash
docker-compose up --build -d
```

### Vedere log
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Accesso shell container
```bash
docker-compose exec backend bash
docker-compose exec frontend sh
```

---

## ✅ Checklist Deployment

- [ ] Docker e Docker Compose installati
- [ ] Repository clonato
- [ ] File `.env` backend configurati
- [ ] File `.env` frontend configurati
- [ ] `docker-compose up --build -d` eseguito con successo
- [ ] Frontend accessibile su http://localhost:5173
- [ ] Backend accessibile su http://localhost:8000/docs
- [ ] Credenziali login (admin/admin123) funzionanti
- [ ] Missione di test creata e lanciata
- [ ] WebSocket telemetry attivo

---

## 📚 Documentazione

Tutta la documentazione tecnica è contenuta in questo README. Qui troverai:
- Architettura generale del sistema
- Struttura dettagliata del backend (moduli, layer, responsabilità)
- Schema database e spiegazione delle tabelle
- API endpoints disponibili
- Guida per lo sviluppo e il deployment
- Esempi di codice per ogni layer

---

## 🤝 Supporto

Per aggiornamenti, domande o chiarimenti, consultare la repository o contattare il team tecnico.

**Versione**: 1.0  
**Status**: Production-Ready  
**Data**: Aprile 2026
