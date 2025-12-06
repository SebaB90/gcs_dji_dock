# 🛰️ GCS DJI Dock — Ground Control Web App

Una **Ground Control Station web-based** per la gestione di un **DJI Dock 2** con drone autonomo.  
L’applicazione mostra la telemetria in tempo reale (drone + dock), consente la creazione e modifica dei **waypoints di missione**, e l’invio delle missioni tramite API ThingsBoard Cloud.

---

## ⚡ Quick Start - Avvio in 30 secondi

```bash
# Setup iniziale (solo la prima volta)
python3 -m venv .venv
.venv/bin/pip install -r backend/requirements.txt
cd frontend && npm install && cd ..

# Avvio completo (ogni volta)
./start_all.sh
```

✨ **Fatto!** Apri http://localhost:5173

🖥️  **Ancora più facile:** [Avvia con doppio click!](docs/DESKTOP_LAUNCHER.md) `./install_desktop_icons.sh`

📚 [**Guida Completa →**](docs/QUICK_START.md) | 📊 **Check Status:** `./status.sh`


## 🚀 Funzionalità principali

✅ **Visualizzazione telemetria live**
- Stato connessione UAV / Dock
- Posizione GPS, quota, velocità, heading
- Stato copertura Dock, temperatura, umidità e vento  
- Batteria e modalità operativa

✅ **Gestione missioni**
- Creazione di waypoint tramite interfaccia
- Impostazione quota waypoint
- Modifica o trascinamento diretto dei punti sulla mappa
- Invio missione al backend tramite API REST `/mission`

✅ **Mappa interattiva (Leaflet + Mapbox)**
- Icone personalizzate per Drone e Dock
- Tracciamento in tempo reale della traiettoria UAV
- Waypoints e percorso missione visibili
- Controlli di zoom e centramento

✅ **Pannello telemetria espandibile**
- Visualizza dati principali o JSON completo  
- Sidebar fissa con aggiornamenti automatici

---

## 🏗️ Struttura del progetto

```
gcs_dji_dock/
├── backend/              # API REST (FastAPI)
│   ├── main.py           # Entry point server
│   ├── requirements.txt  # Dipendenze Python
│   └── ...
│
├── frontend/             # App React (Vite)
│   ├── src/
│   │   ├── App.jsx       # Logica principale UI
│   │   ├── App.css       # Stili UI
│   │   └── ...
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## ⚙️ Installazione e avvio

### 🧩 1. Clona il progetto
```bash
git clone git@github.com:SebaB90/gcs_dji_dock.git
cd gcs_dji_dock
```

### 🔧 2. Setup iniziale

**Crea il virtual environment Python:**
```bash
python3 -m venv .venv
.venv/bin/pip install -r backend/requirements.txt
```

**Installa dipendenze frontend:**
```bash
cd frontend
npm install
cd ..
```

---

### 🚀 3. Avvio rapido - TUTTO IN UNO

**Il modo più semplice per avviare l'intera applicazione:**

```bash
# Avvia backend + frontend insieme
./start_all.sh

# Ferma tutto
./stop_all.sh

# Riavvia tutto
./restart_all.sh
```

Lo script `start_all.sh`:
- ✅ Avvia il backend (porta 8000)
- ✅ Verifica l'health check del backend
- ✅ Avvia il frontend (porta 5173)
- ✅ Mostra tutti i link e comandi utili
- ✅ Gestisce automaticamente i log

**Output dello script:**
```
✨ All Services Started Successfully!

🌐 Application URLs:
   Frontend:  http://localhost:5173
   Backend:   http://localhost:8000
   API Docs:  http://localhost:8000/docs

🔐 Default Login:
   Username: fieldrobotics
   Password: FieldRobotics2025!GCS
```

---

### 🎯 4. Gestione servizi individuali

Se preferisci controllare backend e frontend separatamente:

**Backend:**
```bash
./start_backend.sh      # Avvia backend
./stop_backend.sh       # Ferma backend
./restart_backend.sh    # Riavvia backend
```

**Frontend:**
```bash
./start_frontend.sh     # Avvia frontend
./stop_frontend.sh      # Ferma frontend
./restart_frontend.sh   # Riavvia frontend
```

Tutti gli script includono:
- ✅ Controllo porte occupate
- ✅ Gestione PID file
- ✅ Logging automatico
- ✅ Health check
- ✅ Shutdown graceful

---

### 📊 5. Monitoraggio

**Visualizza i log in tempo reale:**
```bash
# Backend
tail -f backend.log

# Frontend
tail -f frontend.log

# Entrambi contemporaneamente
tail -f backend.log frontend.log
```

**Verifica stato servizi:**
```bash
# Health check backend
curl http://localhost:8000/health

# Verifica porte in uso
lsof -i :8000    # Backend
lsof -i :5173    # Frontend

# Verifica processi
cat backend.pid && ps -p $(cat backend.pid)
cat frontend.pid && ps -p $(cat frontend.pid)
```

---

## 🚨 Troubleshooting

### ❌ Errore "Address already in use" (porta occupata)

**Soluzione rapida:**
```bash
# Ferma tutto e riavvia
./restart_all.sh
```

**Soluzione dettagliata:**
```bash
# 1. Ferma i servizi esistenti
./stop_all.sh

# 2. Verifica che le porte siano libere
lsof -i :8000    # Backend
lsof -i :5173    # Frontend

# 3. Se necessario, forza la pulizia
lsof -ti:8000 | xargs kill -9
lsof -ti:5173 | xargs kill -9

# 4. Riavvia
./start_all.sh
```

---

### 🔍 Un servizio non parte

**Backend:**
```bash
# Controlla i log
tail -50 backend.log

# Verifica dipendenze
.venv/bin/pip install -r backend/requirements.txt

# Verifica configurazione
cat backend/.env
```

**Frontend:**
```bash
# Controlla i log
tail -50 frontend.log

# Reinstalla dipendenze
cd frontend && npm install && cd ..

# Verifica configurazione
cat frontend/.env
```

---

### 🌐 Frontend non si connette al backend

**Verifica:**
1. Backend in esecuzione: `curl http://localhost:8000/health`
2. File `frontend/.env` contiene: `VITE_BACKEND_URL=http://localhost:8000`
3. Riavvia frontend: `./restart_frontend.sh`

---

### 📋 Script disponibili - Riferimento rapido

| Comando | Descrizione |
|---------|-------------|
| `./start_all.sh` | 🚀 Avvia backend + frontend |
| `./stop_all.sh` | 🛑 Ferma tutto |
| `./restart_all.sh` | 🔄 Riavvia tutto |
| `./start_backend.sh` | Avvia solo backend |
| `./stop_backend.sh` | Ferma solo backend |
| `./restart_backend.sh` | Riavvia solo backend |
| `./start_frontend.sh` | Avvia solo frontend |
| `./stop_frontend.sh` | Ferma solo frontend |
| `./restart_frontend.sh` | Riavvia solo frontend |

**File di log e PID:**
- `backend.log` - Log backend
- `frontend.log` - Log frontend  
- `backend.pid` - PID processo backend
- `frontend.pid` - PID processo frontend

Per maggiori dettagli: [Process Management Guide](docs/PROCESS_MANAGEMENT.md)

---

## 🔑 Configurazione variabili d’ambiente

Nel file `frontend/.env` definisci:
```bash
VITE_BACKEND_URL=http://localhost:8000
VITE_MAPBOX_TOKEN=<tuo_token_mapbox>
```

---

## 🔌 API Backend (FastAPI)

### `GET /telemetry`
Ritorna l’ultima telemetria UAV/Dock dal servizio ThingsBoard Cloud.  
Formato esempio:
```json
{
  "drone": { "lat": [{ "value": 44.57 }], "lon": [{ "value": 11.25 }], ... },
  "hangar": { "status": [{ "value": "CLOSED" }], ... }
}
```

### `POST /mission`
Invia una missione UAV con i waypoints definiti nel frontend:
```json
{
  "UAVCMD": {
    "command": "MISSION_LOAD",
    "parameters": {
      "speed": 1,
      "rth": true,
      "photo": false,
      "points": [
        { "lat": 44.57215, "lon": 11.25143, "alt": 25 },
        { "lat": 44.57220, "lon": 11.25144, "alt": 30 }
      ]
    }
  }
}
```

---

## 🗺️ Dipendenze principali

### Frontend
- React + Vite
- Leaflet + React-Leaflet
- Axios
- Mapbox Satellite Tiles

### Backend
- FastAPI
- Uvicorn
- Requests (per ThingsBoard API)

---

## 🧭 Workflow di sviluppo

1. `git checkout frontend-dev` → sviluppo UI  
2. `git checkout backend-dev` → sviluppo API  
3. `git merge frontend-dev` → test in main  
4. `git push origin main` → versione stabile  

---

## 📦 Build produzione (opzionale)

Per creare la build ottimizzata della web app:
```bash
cd frontend
npm run build
```

I file statici si trovano in `frontend/dist`.

Puoi servirli tramite FastAPI o Nginx in produzione.

---

## 🧰 To-do / Futuri miglioramenti

- [ ] Click su mappa per aggiungere waypoint  
- [ ] Grafico profilo altitudine missione  
- [ ] Upload missione da file JSON  
- [ ] Integrazione video streaming DJI Dock  
- [ ] Autenticazione utenti frontend  

---

## 👨‍💻 Autore

**Seba B.**  
📍 Ingegnere dell’automazione  
💡 Sviluppo software per sistemi autonomi e GCS  
GitHub → [@SebaB90](https://github.com/SebaB90)

---

## 🛡️ Licenza

Questo progetto è rilasciato sotto licenza **MIT**.  
Può essere utilizzato e modificato liberamente citando l’autore originale.

---

## 🔐 Authentication System

The application now includes enterprise-grade JWT-based authentication for secure access control.

### Features
- ✅ JWT token-based authentication
- ✅ Bcrypt password hashing
- ✅ 60-minute session timeout
- ✅ Automatic token verification
- ✅ Secure logout functionality
- ✅ Protected API endpoints

### Default Credentials
- **Username**: `fieldrobotics`
- **Password**: `FieldRobotics2025!GCS`

### Quick Start
1. Start the backend and frontend (see installation steps)
2. Navigate to `http://localhost:5173`
3. Login with the credentials above
4. Logout button is in the sidebar

### Documentation
- 🚀 **[Quick Start Guide](docs/QUICK_START.md)** ← **START HERE!**
- 📖 [Complete Authentication Guide](docs/AUTHENTICATION.md)
- 🔐 [Quick Setup Instructions](docs/QUICK_SETUP_AUTH.md)
- 📋 [Implementation Summary](docs/IMPLEMENTATION_SUMMARY.md)
- ✅ [Production Checklist](docs/PRODUCTION_CHECKLIST.md)
- 🔄 [Process Management Guide](docs/PROCESS_MANAGEMENT.md)
- ⚡ [Code Optimization Details](docs/CODE_OPTIMIZATION.md)

### Security Notes
⚠️ **Before production deployment:**
1. Generate new `SECRET_KEY`: `openssl rand -hex 32`
2. Change default password to a strong one
3. Enable HTTPS
4. Configure CORS for production domain
5. Review the [Production Checklist](docs/PRODUCTION_CHECKLIST.md)

