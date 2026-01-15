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

🌐 **Accesso da altri dispositivi:** [Guida Network Access](docs/NETWORK_GUIDE.md) | `./setup_network_access.sh`

📚 [**Guida Completa →**](docs/SETUP_GUIDE.md) | 📊 **Check Status:** `./status.sh`

---

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

## 🌐 Accesso da rete locale (altri dispositivi)

Per accedere alla dashboard da tablet, smartphone o altri computer sulla tua rete:

**Setup automatico (consigliato):**
```bash
./setup_network_access.sh
```

Questo script:
- ✅ Rileva automaticamente l'IP del server
- ✅ Configura il frontend per l'accesso di rete
- ✅ Apre le porte nel firewall
- ✅ Fornisce le istruzioni di accesso

**Accesso manuale:**
```bash
# 1. Trova l'IP del tuo server
hostname -I | awk '{print $1}'
# Output esempio: 192.168.1.100

# 2. Configura il frontend
# Copia frontend/.env.local.example in frontend/.env.local
# Modifica VITE_BACKEND_URL=http://192.168.1.100:8000

# 3. Apri le porte del firewall
sudo ufw allow 8000/tcp
sudo ufw allow 5173/tcp

# 4. Riavvia i servizi
./restart_all.sh
```

**Poi da altri dispositivi sulla stessa rete:**
```
http://192.168.1.100:5173
```

📖 **Guida completa:** [docs/NETWORK_GUIDE.md](docs/NETWORK_GUIDE.md)

---

## 📋 Script disponibili

| Comando | Descrizione |
|---------|-------------|
| `./start_all.sh` | 🚀 Avvia backend + frontend |
| `./stop_all.sh` | 🛑 Ferma tutto |
| `./restart_all.sh` | 🔄 Riavvia tutto |
| `./status.sh` | 📊 Controlla stato servizi |
| `./setup_network_access.sh` | 🌐 Configura accesso di rete |

**File generati:**
- `backend.log` - Log backend
- `frontend.log` - Log frontend  
- `backend.pid` - PID processo backend
- `frontend.pid` - PID processo frontend

Per maggiori dettagli: [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md)

---

## 🚨 Troubleshooting

### ❌ Errore "Address already in use" (porta occupata)
```bash
./restart_all.sh  # Soluzione rapida
```

### 🌐 Frontend non si connette al backend
1. Verifica backend: `curl http://localhost:8000/health`
2. Riavvia servizi: `./restart_all.sh`

📖 **Guida completa:** [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md)

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
- 🚀 **[Setup Guide](docs/SETUP_GUIDE.md)** - Complete installation & configuration
- 📖 **[User Guide](docs/USER_GUIDE.md)** - Mission planning & scheduling
- 🔌 **[API Reference](docs/API_REFERENCE.md)** - Complete API documentation
- 🌐 **[Network Guide](docs/NETWORK_GUIDE.md)** - Multi-device access setup
- 🔧 **[Developer Notes](docs/DEVELOPER_NOTES.md)** - Technical details for developers

### Security Notes
⚠️ **Before production deployment:**
1. Generate new `SECRET_KEY`: `openssl rand -hex 32`
2. Change default password to a strong one
3. Enable HTTPS
4. Configure CORS for production domain
5. Review the [Production Checklist](docs/PRODUCTION_CHECKLIST.md)

