# 🛰️ GCS DJI Dock — Ground Control Web App

Una **Ground Control Station web-based** per la gestione di un **DJI Dock 2** con drone autonomo. L'applicazione mostra la telemetria in tempo reale (drone + dock), consente la creazione e modifica dei **waypoints di missione**, e l'invio delle missioni tramite API ThingsBoard Cloud.

---

## ⚡ Quick Start

### 🖥️ Desktop Icon (EASIEST!)

Cerca sul desktop l'icona **🚀 GCS DJI Dock**
- **Doppio click** per avviare l'applicazione
- Si apre automaticamente nel browser
- Pronta in ~10 secondi

### 💻 Da Terminale

```bash
# Setup iniziale (solo la prima volta)
python3 -m venv .venv
.venv/bin/pip install -r backend/requirements.txt
cd frontend && npm install && cd ..

# Avvio completo (ogni volta)
./scripts/start.sh
```

✨ **Fatto!** Apri http://localhost:5173

---

## 🔐 Credenziali di Login

- **Username:** `fieldrobotics`
- **Password:** `FieldRobotics2025!GCS`

---

## 🚀 Funzionalità Principali

### ✅ Visualizzazione Telemetria Live
- Stato connessione UAV / Dock
- Posizione GPS, quota, velocità, heading
- Stato copertura Dock, temperatura, umidità e vento
- Batteria e modalità operativa

### ✅ Gestione Missioni
- Creazione di waypoint tramite interfaccia
- Impostazione quota waypoint
- Modifica o trascinamento diretto dei punti sulla mappa
- Invio missione al backend tramite API REST `/mission`
- Scheduling missioni con cron
- Storico esecuzioni

### ✅ Mappa Interattiva (Leaflet + Mapbox)
- Icone personalizzate per Drone e Dock
- Tracciamento in tempo reale della traiettoria UAV
- Waypoints e percorso missione visibili
- Controlli di zoom e centramento

### ✅ Pannello Telemetria Espandibile
- Visualizza dati principali o JSON completo
- Sidebar fissa con aggiornamenti automatici

---

## 📋 Comandi Essenziali

```bash
./scripts/start.sh    # 🚀 Avvia backend + frontend
./scripts/stop.sh     # 🛑 Ferma tutto
./scripts/status.sh   # 📊 Controlla stato servizi
```

---

## 🌐 URL di Accesso

Dopo l'avvio:
- **Frontend UI**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## 🏗️ Struttura del Progetto

```
gcs_dji_dock/
├── backend/              # API REST (FastAPI)
│   ├── app/
│   │   ├── main.py           # Entry point server
│   │   ├── mission_db.py     # Database missioni
│   │   ├── mission_scheduler.py  # Scheduling
│   │   └── video_controller.py   # Controllo video
│   └── requirements.txt
│
├── frontend/             # App React (Vite)
│   ├── src/
│   │   ├── App.jsx           # Logica principale UI
│   │   ├── components/       # Componenti React
│   │   └── styles/           # Stili CSS
│   ├── package.json
│   └── vite.config.js
│
├── docs/                 # Documentazione completa
│   ├── SETUP_GUIDE.md        # Guida installazione dettagliata
│   ├── USER_GUIDE.md         # Manuale utente completo
│   ├── API_REFERENCE.md      # Riferimenti API
│   ├── NETWORK_GUIDE.md      # Configurazione accesso rete
│   └── DEVELOPER_NOTES.md    # Note per sviluppatori
│
├── scripts/              # Script di gestione
└── README.md             # Questo file
```

---

## ⚙️ Installazione Completa

### 📋 Prerequisiti

- **Python 3.8+** con pip
- **Node.js 16+** con npm
- **Git**
- Sistema operativo Linux (testato su Ubuntu 22.04)

### 🔧 Setup Dettagliato

#### 1. Clona il repository
```bash
git clone git@github.com:SebaB90/gcs_dji_dock.git
cd gcs_dji_dock
```

#### 2. Setup Backend (Python)
```bash
# Crea virtual environment
python3 -m venv .venv

# Attiva virtual environment
source .venv/bin/activate

# Installa dipendenze
pip install -r backend/requirements.txt
```

#### 3. Setup Frontend (Node.js)
```bash
cd frontend
npm install
cd ..
```

#### 4. Avvio
```bash
./scripts/start.sh
```

L'applicazione sarà disponibile su:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000

---

## 🌐 Accesso da Altri Dispositivi

Per accedere all'applicazione da altri dispositivi sulla rete locale:

1. Trova l'IP del tuo computer:
   ```bash
   ip addr show | grep "inet " | grep -v 127.0.0.1
   ```

2. Configura l'accesso:
   ```bash
   ./scripts/setup-network.sh
   ```

3. Accedi da altri dispositivi usando: `http://YOUR_IP:5173`

Per maggiori dettagli: [NETWORK_GUIDE.md](docs/NETWORK_GUIDE.md)

---

## 🔧 Configurazione

### Backend Configuration

Il backend può essere configurato tramite variabili d'ambiente o file `.env`:

```bash
# ThingsBoard Configuration
THINGSBOARD_HOST=your-thingsboard-url
THINGSBOARD_TOKEN=your-access-token

# Server Configuration
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
```

### Frontend Configuration

Modifica [frontend/vite.config.js](frontend/vite.config.js) per configurare il proxy e le opzioni del dev server.

---

## 🆘 Troubleshooting

### Desktop icon non funziona?
1. Click destro sull'icona
2. Seleziona "Allow Launching" o "Fidati"
3. Doppio click di nuovo

### Applicazione non si avvia?
```bash
# Esegui da terminale per vedere gli errori
./scripts/start.sh

# Controlla i log
tail -f logs/backend.log
tail -f logs/frontend.log
```

### Porte già in uso?
```bash
# Verifica quali processi usano le porte
lsof -i :8000  # Backend
lsof -i :5173  # Frontend

# Ferma i servizi e riavvia
./scripts/stop.sh
./scripts/start.sh
```

### Errori di connessione backend?
```bash
# Verifica che il backend sia attivo
curl http://localhost:8000/health

# Controlla lo stato
./scripts/status.sh
```

---

## 📚 Documentazione Completa

- **[Setup Guide](docs/SETUP_GUIDE.md)** - Installazione e configurazione dettagliata
- **[User Guide](docs/USER_GUIDE.md)** - Manuale utente completo con esempi
- **[API Reference](docs/API_REFERENCE.md)** - Documentazione API REST
- **[Network Guide](docs/NETWORK_GUIDE.md)** - Configurazione accesso da rete
- **[Developer Notes](docs/DEVELOPER_NOTES.md)** - Note per sviluppatori

---

## 🔄 Sviluppo

### Setup Ambiente di Sviluppo

```bash
# Installa dipendenze di sviluppo
cd frontend
npm install --save-dev

# Avvia in modalità development
cd ..
./scripts/start.sh
```

### Struttura API Backend

- `GET /health` - Health check
- `GET /telemetry` - Telemetria in tempo reale (WebSocket)
- `POST /mission` - Crea/aggiorna missione
- `GET /missions` - Lista tutte le missioni
- `POST /mission/{id}/schedule` - Schedula missione
- `GET /mission/{id}/history` - Storico esecuzioni

Vedi [API_REFERENCE.md](docs/API_REFERENCE.md) per dettagli completi.

---

## 🤝 Contribuire

1. Fork il repository
2. Crea un branch per la feature (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

---

## 📝 License

Progetto proprietario - Field Robotics Lab

---

## 👥 Autori

- **Sebastian Baiardo** - *Initial work* - [SebaB90](https://github.com/SebaB90)

---

## 🙏 Ringraziamenti

- DJI per il Dock 2 e le API
- ThingsBoard per la piattaforma cloud
- Community React e FastAPI

---

**Enjoy your GCS DJI Dock! 🚁✨**
