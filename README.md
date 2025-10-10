# 🛰️ GCS DJI Dock — Ground Control Web App

Una **Ground Control Station web-based** per la gestione di un **DJI Dock 2** con drone autonomo.  
L’applicazione mostra la telemetria in tempo reale (drone + dock), consente la creazione e modifica dei **waypoints di missione**, e l’invio delle missioni tramite API ThingsBoard Cloud.

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

---

### 🖥️ 2. Avvia il backend (FastAPI)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend attivo su → [http://localhost:8000](http://localhost:8000)

---

### 🌐 3. Avvia il frontend (React + Vite)
In un secondo terminale:
```bash
cd frontend
npm install
npm run dev
```

Frontend attivo su → [http://localhost:5173](http://localhost:5173)

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
