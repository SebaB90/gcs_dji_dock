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

### Prerequisiti
- Docker e Docker Compose

### Avvio applicazione
```bash
docker-compose up -d
```

### Accessi
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
│  ├─ /users → Autenticazione         │
│  ├─ /missions → Gestione Missioni   │
│  ├─ /docks → Dati Real-time         │
│  ├─ /api/video → Video Streaming    │
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

# 🔧 PARTE BACKEND

## 📂 Struttura Backend

Il backend è organizzato in **moduli tematici**, ognuno con una **struttura coerente e prevedibile**.

```
backend/
├── venv/                                    # Virtual environment Python (dipendenze locali)
├── app/
│   ├── main.py                              # Entry point del backend
│   ├── core/
│   │   ├── config.py                        # Configurazione centralizzata (.env)
│   │   ├── scheduler.py                     # Gestione scheduler APScheduler
│   │   └── __init__.py
│   ├── database/
│   │   ├── core.py                          # Setup SQLAlchemy engine
│   │   └── __init__.py
│   ├── integrations/
│   │   └── adpm/
│   │       └── thingsboard.py               # Client API ThingsBoard (ADPM)
│   ├── users/
│   │   ├── models.py                        # ORM model User
│   │   ├── schemas.py                       # Pydantic schemas (request/response)
│   │   ├── service.py                       # Business logic users
│   │   ├── controller.py                    # FastAPI routes (/users)
│   │   └── __init__.py
│   ├── missions/
│   │   ├── models.py                        # ORM models (Mission, Schedule, Execution)
│   │   ├── schemas.py                       # Pydantic schemas
│   │   ├── service.py                       # Business logic missioni
│   │   ├── controller.py                    # FastAPI routes (/missions)
│   │   └── __init__.py
│   ├── telemetry/
│   │   ├── service.py                       # Fetch telemetry da ThingsBoard
│   │   ├── controller.py                    # FastAPI routes (/docks)
│   │   └── __init__.py
│   ├── video/
│   │   ├── service.py                       # Video streaming (shared memory)
│   │   ├── controller.py                    # FastAPI routes (/api/video)
│   │   └── __init__.py
│   └── database/
│       └── database_gcs_dji.db              # Database SQLite (auto-creato)
├── requirements.txt                         # Dipendenze Python (FastAPI, SQLAlchemy, ecc.)
├── Dockerfile                               # Immagine Docker per il backend
└── .env                                     # Variabili di ambiente (gitignored)
```

### Ambiente e Dipendenze

Il backend gestisce le dipendenze Python in tre livelli:

**1. Python venv (Sviluppo Locale)**

La cartella `venv/` è un **Virtual Environment Python** che isola le dipendenze del progetto dal sistema.

```bash
# Creazione del venv
python3 -m venv venv

# Attivazione (Linux/Mac)
source venv/bin/activate

# Attivazione (Windows)
venv\Scripts\activate

# Installazione dipendenze
pip install -r requirements.txt
```

**Vantaggi:**
- Dipendenze isolate per progetto
- Nessun conflitto con altri progetti Python
- Facile da ripulire (basta cancellare `venv/`)

---

**2. requirements.txt (Elenco Dipendenze)**

File `requirements.txt` contiene l'elenco di **tutti i pacchetti Python** necessari:

```
FastAPI==0.118.3
Uvicorn==0.37.0
SQLAlchemy==2.0.25
APScheduler==3.10.4
python-jose==3.3.0
passlib==1.7.4
bcrypt==4.0.1
requests==2.32.5
loguru
pydantic==2.12.0
pydantic-settings==2.1.0
python-dotenv==1.1.1
```

Nota: nel progetto attuale `loguru` è installato senza pin esplicito di versione.

Installazione: `pip install -r requirements.txt`

---

**3. Dockerfile (Immagine Docker)**

File `Dockerfile` definisce come **costruire l'immagine Docker** del backend:

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Processo:**
1. Usa immagine Python 3.11 slim (minimal)
2. Installa dipendenze da requirements.txt
3. Copia codice sorgente
4. Avvia Uvicorn server sulla porta 8000

---

**4. docker-compose (Orchestrazione)**

File `docker-compose.yml` (a livello root) orchestra **frontend e backend** insieme:

```yaml
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: gcs_backend
    ports:
      - "8000:8000"
    volumes:
      - ./backend/app:/app/app
      - ./backend/.env:/app/.env
    environment:
      - PYTHONUNBUFFERED=1
    restart: unless-stopped
    
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: gcs_frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend
    restart: unless-stopped
```

**Vantaggi:**
- Un comando per avviare tutto: `docker-compose up -d`
- Isolamento completo (nessun conflitto con sistema)
- Facile deployment su qualsiasi macchina con Docker

---

## Componenti Principali del Backend

### **1. Users (Autenticazione)**
**Endpoint:** `/users`

Gestione utenti e autenticazione JWT:
- `POST /users/login` — Login e rilascio token JWT
- `GET /users/current_user` — Dati utente loggato
- `GET /users/verify-token` — Validazione token
- `POST /users/create_user` — Creazione nuovo utente (ADMIN only)
- `GET /users/all_users` — Lista utenti (ADMIN only)
- `DELETE /users/delete_user/{user_id}` — Elimina utente (ADMIN only)

**Ruoli:** `ADMIN`, `OPERATOR`, `VIEWER`

---

### **2. Missions (Missioni e Scheduling)**
**Endpoint:** `/missions`

Sistema core: gestisce il ciclo di vita delle missioni (Create → Schedule → Execute → Monitor).

**Gestione Missioni (CRUD):**
- `POST /missions/create_mission` — Crea nuova missione
- `GET /missions/list_missions` — Elenca tutte le missioni
- `GET /missions/list/{mission_id}` — Dettagli missione
- `DELETE /missions/delete/{mission_id}` — Elimina missione

**Scheduling (Temporizzazione):**
- `POST /missions/schedules/schedule_mission/{mission_id}` — Crea schedule (Once o Recurring su dock specifica)
- `GET /missions/schedules/list_schedules` — Elenca schedule attive
- `DELETE /missions/schedules/delete/{schedule_id}` — Rimuove schedule

**Esecuzione (Run & Monitor):**
- `POST /missions/execute/execute_mission/{mission_id}?dock_name=dock1` — Esecuzione immediata
- `GET /missions/execute/active_executions` — Missioni in corso
- `GET /missions/execute/history?dock_name=dock1&limit=50` — Storico esecuzioni

---

### **3. Video (Controllo Telecamere)**
**Endpoint:** `/api/video`

Gestione fonti video del drone (Wide, Zoom, Thermal):
- `GET /api/video/source` — Fonte video attuale
- `POST /api/video/source/{source_name}` — Cambia fonte (wide, zoom, thermal)

---

### **4. Telemetry (Telemetria Drone)**
**Endpoint:** `/docks`

Dati real-time dai droni via ThingsBoard:
- `GET /docks/{dock_name}/telemetry` — Telemetria dock in cache RAM (aggiornata ogni secondo)

---

### **5. Scheduler (Cuore del Sistema)**
**File:** `app/core/scheduler.py`

Engine che gestisce:

1. **Loop Unificato (1Hz):**
   - Eseguito ogni secondo
   - Recupera telemetria da ThingsBoard
   - Aggiorna cache RAM
   - Verifica stati missioni

2. **State Machine Missioni:**
   - Traccia lo stato: `scheduled` → `sent_to_tb` → `running` → `completed/failed`
   - Timeout automatico se il drone non comunica entro 120 secondi

3. **Scheduling (APScheduler):**
   - **Once:** Esegui a data/ora specifica
  - **Recurring:** Esegui con espressioni cron (es. ogni lunedì alle 9:00)
   - Viene ripristinato al riavvio da `MissionSchedule` nel DB

---

## Dettagli Componenti Backend

### **main.py**
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
app.include_router(users_router, prefix="/users")
app.include_router(missions_router, prefix="/missions")
```

---

### **core/** — Configurazione e Scheduler

La cartella `core` contiene i servizi fondamentali del backend: configurazione centralizzata e gestione dello scheduler.

#### **core/config.py**
Gestione centralizzata della **configurazione** da variabili di ambiente (`.env`).

Responsabilità:
- Leggere `SECRET_KEY`, `DATABASE_URL`, credenziali ThingsBoard, ecc.
- Esporre variabili come `settings.SECRET_KEY`, `settings.THINGSBOARD_URL`, ecc.
- Validare che tutte le config necessarie siano presenti

Esempio:
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "GCS DJI Dock"
    SECRET_KEY: str
    DATABASE_URL: str
    THINGSBOARD_URL: str
    TB_USER: str
    TB_PASS: str
    
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

DATABASE_URL = "sqlite:///./app/database/database_gcs_dji.db"
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

#### Schema Tabelle Principali

Il database SQLite contiene le seguenti tabelle principali:

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

### **integrations/** — Servizi Esterni

La cartella `integrations` gestisce l'integrazione con servizi esterni (ThingsBoard ADPM, DJI Cloud API, ecc.). È strutturata per essere modulare e facilmente estendibile in futuro a nuove integrazioni.

#### **integrations/adpm/thingsboard.py**
**Client HTTP** per comunicare con **ThingsBoard ADPM** (Autonomous Drone Platform Management).

Responsabilità:
- Autenticarsi a ThingsBoard (login → JWT token)
- Inviare missioni a ThingsBoard (`POST /api/adpm/missions/execute`)
- Pollare lo stato di una missione (`GET /api/adpm/missions/{id}/status`)
- Recuperare dati telemetrici del drone (`GET /api/plugins/telemetry/{device_id}/values/timeseries`)
- Gestire retry logic e caching del token

Esempio:
```python
class ThingsBoardClient:
    def __init__(self, http_session):
    self.base_url = settings.THINGSBOARD_URL
        self.token_cache = None
    
    def get_token(self):
        if self.token_cache and not self.token_cache.expired:
            return self.token_cache.value
        
        response = self.session.post(
            f"{self.base_url}/api/auth/login",
            json={"username": settings.TB_USER, "password": settings.TB_PASS}
        )
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
```

---

### Flusso di una Richiesta HTTP (Backend)

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

1. **Login** → POST `/users/login` con username/password
2. **Backend** → Verifica credenziali, genera JWT token
3. **Frontend** → Salva token in localStorage
4. **Richieste successive** → Include token nel header `Authorization: Bearer <token>`
5. **Backend** → Verifica firma e scadenza del token

Token di default scade in **60 minuti**.

---

# 🎨 PARTE FRONTEND

## Tech Stack Frontend

- **React 19** — UI framework
- **Vite** — Build tool (dev server veloce)
- **Axios** — HTTP client con interceptor JWT
- **React Leaflet** — Mappa interattiva (Leaflet.js)
- **Lucide Icons** — Icone moderne
- **Context API** — State management (autenticazione)

---

## Struttura Pagine Frontend

### **LoginPage** (`pages/LoginPage.jsx`)
Pagina di accesso con modulo username/password.

**Funzionalità:**
- Form validation (username + password)
- Mostra/nascondi password
- Messaggio di errore personalizzato (401, network error, ecc.)
- Loading state durante il login

**Flusso:**
1. L'utente inserisce le credenziali
2. `AuthContext.login()` chiama `/users/login` backend
3. Token salvato in `localStorage`
4. Redirect a `/main` se login success

---

### **MainPage** (`pages/MainPage.jsx`)
Layout principale con **split view orizzontale** (mappa | dashboard) e **split view verticale** (video | missioni).

**Layout:**
```
┌─────────────────────────────────────┐
│         [Sidebar]    [Map]   │ [Video]    │
│                                [Resize]   │
│                      │ [Missions]         │
└─────────────────────────────────────┘
```

**Componenti principali:**
- **MapView** — Mappa Leaflet con drone + dock + waypoints
- **VideoPanel** — Stream video (RTMP/MJPEG da MediaMTX)
- **MissionStatusPanel** — Schedules + countdown timer + active executions
- **MissionManager** (sidebar) — CRUD missioni + scheduling
- **MainSidebar** — Menu: dock1, dock2, admin, logout

**Polling (Real-time Updates):**
- **Telemetria**: `dock1` e `dock2` ogni **2 secondi**
  - Estrae: lat/lon drone, battery %, signal, home position
- **Missioni**: Schedules + executions ogni **5 secondi**
- **Countdown timer**: Aggiornamento ogni **1 secondo** (next execution)

---

## Servizi Frontend (Services Layer)

### **authService** (`services/auth.service.js`)
Gestione autenticazione e utenti.

**Funzioni:**
- `login(username, password)` — Login e salvataggio token
- `logout()` — Rimozione token da localStorage
- `getCurrentUser()` — Dati utente loggato
- `getAllUsers()` — Lista utenti (admin only)
- `createUser(userData)` — Creazione utente (admin only)
- `deleteUser(userId)` — Cancellazione utente (admin only)

---

### **api** (`services/api.js`)
Axios instance con interceptor JWT.

**Features:**
- Aggiunge automaticamente `Authorization: Bearer <token>` a ogni request
- Timeout: 10 secondi
- Gestisce errori 401 (unauthorized)

---

### **missionService** (`services/mission.service.js`)
Gestione missioni, scheduling ed esecuzioni.

**CRUD Missioni:**
- `createMission(missionData)` — Crea missione con waypoints
- `getMissions()` — Elenco missioni
- `getMission(missionId)` — Dettagli missione
- `deleteMission(missionId)` — Cancella missione

**Scheduling:**
- `scheduleMission(missionId, scheduleData)` — Schedule (Once o Recurring)
- `getSchedules()` — Schedules attive (ordinate per next_execution)
- `deleteSchedule(scheduleId)` — Rimuove schedule

**Esecuzioni:**
- `executeMission(missionId, dockName)` — Esecuzione immediata
- `getActiveExecutions()` — Missioni in corso
- `getExecutionHistory(options)` — Storico esecuzioni

---

### **videoService** (`services/video.service.js`)
Controllo sorgenti video.

**Funzioni:**
- `getVideoSource()` — Fonte attuale (wide, zoom, thermal)
- `setVideoSource(sourceName)` — Cambia fonte (wide, zoom, thermal)

---

### **dockService** (`services/dock.service.js`)
Dati telemetria dock.

**Funzioni:**
- `getTelemetry(dockName)` — Telemetria dock (aggiornata in cache RAM backend)

---

## Componenti Principali Frontend

### **MapView** (`components/map/MapView.jsx`)
Mappa interattiva con posizioni drone e dock.

**Features:**
- **Tile layer**: Mapbox Satellite
- **Marker drone** — Icona drone + posizione GPS real-time
- **Marker dock** — Icona DJI Dock + home position
- **Polyline waypoints** — Traccia percorso missione
- **Controlli zoom** — Zoom in/out + recenter
- **Resize handler** — Aggiusta mappa al resize split view
- **Waypoint editor** — Click sulla mappa per aggiungere waypoint

---

### **VideoPanel** (`components/panels/VideoPanel.jsx`)
Stream video in iframe (MediaMTX).

**Features:**
- **StreamFrame** — Container con header e stream video
- **Source switcher** — Bottoni: Wide, Zoom, Thermal
- **Telemetry overlay** — Battery, signal, altitude (opzionale)
- **Live indicator** — Badge "LIVE" con pulsante

---

### **MissionStatusPanel** (`components/panels/MissionStatusPanel.jsx`)
Dashboard con scheduled missions e executions.

**Mostra:**
- **Scheduled Missions** — Lista con countdown timer fino a next execution
- **Active Executions** — Missioni in corso con stato (running, sent_to_tb, ecc.)
- **Countdown real-time** — Aggiornamento ogni secondo

---

### **MissionManager** (`components/mission/MissionManager.jsx`)
Editor missioni e scheduling (nel sidebar drawer).

**Funzionalità:**
- **Tab "Create"** — Form creazione missione
  - Nome, altitudine, heading, gimbal tilt, hover time, speed, RTH, photo
  - Preview waypoints nella MiniMap
  - Bottone "Save Mission"
  
- **Tab "My Missions"** — Lista missioni salvate
  - Seleziona missione
  - Bottone "Execute Now" (esecuzione immediata)
  - Bottone "Schedule" (apre modal scheduling)
  
- **Tab "Schedules"** — Elenco schedules attive
  - Mostra next execution e recurrence pattern
  - Bottone "Delete" per rimuovere schedule
  
- **Modal Scheduling**
  - Tipo: Once (data/ora specifica) oppure Recurring (cron pattern)
  - Dock: dock1 o dock2
  - Per Recurring: seleziona giorni + orari

---

### **MainSidebar** (`components/layout/MainSidebar.jsx`)
Sidebar menu con sezioni navigazione.

**Sezioni:**
- **Dock 1** — Telemetria dock1 (drawer)
- **Dock 2** — Telemetria dock2 (drawer)
- **Missions** — Mission manager (drawer)
- **Admin** — Gestione utenti (drawer)
- **Logout** — Esce e cancella token

---

### **SidebarDrawer** (`components/layout/SidebarDrawer.jsx`)
Pannello scorribile con contenuto dinamico (dock telemetry, missions, ecc.).

**Features:**
- Visualizzazione telemetria: drone coordinates, battery, signal, home position
- Waypoint editor integrato
- MiniMap per preview

---

### **TelemetryPanel** (`components/panels/TelemetryPanel.jsx`)
Dettagli telemetria estesi (batteria %, signal, altura, velocità, heading).

---

## Flusso Autenticazione (AuthContext)

```
┌─────────────────────────────────────┐
│      App
│      └─ AuthProvider (Context)
│         ├─ useAuth() hook
│         ├─ isAuthenticated (bool)
│         ├─ user (obj)
│         ├─ loading (bool)
│         └─ login(), logout()
└─────────────────────────────────────┘
```

**Init Flow:**
1. App monta → AuthProvider legge localStorage
2. Se esiste token → verifica `/users/current_user`
3. Se valido → setta `isAuthenticated = true`
4. Se invalido → logout e mostra LoginPage

**Login Flow:**
1. L'utente inserisce le credenziali in LoginPage
2. `login(username, password)` → `/users/login`
3. Token salvato in localStorage
4. Redirect a MainPage

---

# ⚙️ Configurazione

## Backend (.env)
```env
APP_NAME=GCS DJI Dock
SECRET_KEY=<strong-secret>
DATABASE_URL=sqlite:///./app/database/database_gcs_dji.db

GCS_USERNAME=admin
GCS_PASSWORD=admin123

THINGSBOARD_URL=http://thingsboard.example.com:8080
TB_USER=gcs_user
TB_PASS=password

ACCESS_TOKEN_EXPIRE_MINUTES=60
```

## Frontend (.env)
```env
VITE_BACKEND_URL=http://localhost:8000
VITE_MAPBOX_TOKEN=<mapbox-public-token>
```

---

# 📝 API Endpoints Principali (Backend)

### Autenticazione
- `POST /users/login` — Login e riceve JWT token
- `GET /users/current_user` — Dati utente loggato
- `GET /users/verify-token` — Verifica token

### Missioni
- `GET /missions/list_missions` — Lista missioni
- `POST /missions/create_mission` — Crea missione
- `GET /missions/list/{mission_id}` — Dettagli missione
- `DELETE /missions/delete/{mission_id}` — Elimina missione

### Schedule
- `POST /missions/schedules/schedule_mission/{mission_id}` — Crea schedule
- `GET /missions/schedules/list_schedules` — Lista schedule
- `DELETE /missions/schedules/delete/{schedule_id}` — Rimuove schedule

### Esecuzioni
- `POST /missions/execute/execute_mission/{mission_id}?dock_name=dock1` — Esecuzione immediata
- `GET /missions/execute/active_executions` — Missioni in corso
- `GET /missions/execute/history` — Storico esecuzioni

### Telemetria
- `GET /docks/{dock_name}/telemetry` — Telemetria dock

### Video
- `GET /api/video/source` — Fonte video attuale
- `POST /api/video/source/{source_name}` — Cambia fonte

### Utenti (Admin)
- `GET /users/all_users` — Lista utenti
- `POST /users/create_user` — Crea utente
- `DELETE /users/delete_user/{user_id}` — Elimina utente

### Documentazione interattiva
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

# 📖 Guida allo Sviluppo

## Backend (Sviluppo)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Crea backend/.env e inserisci le variabili di configurazione

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Server disponibile su http://localhost:8000 con hot reload.

---

## Frontend (Sviluppo)

```bash
cd frontend
npm install

# Crea frontend/.env e inserisci le variabili VITE_*

npm run dev
```

Dev server su http://localhost:5173 con hot reload.

---

# 🐳 Deployment con Docker

## Build e avvio
```bash
docker-compose up --build -d
```

## Vedere log
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

## Accesso alla shell dei container
```bash
docker-compose exec backend bash
docker-compose exec frontend sh
```
---

## 🤝 Supporto

Per aggiornamenti, domande o chiarimenti, consultare la repository o contattare il team tecnico.

**Versione**: 1.0  
**Status**: Production-Ready  
**Data**: Aprile 2026
