# 🛰️ GCS DJI Dock — Ground Control Web App

Ground Control Station web-based per la gestione di un **DJI Dock 2** con drone autonomo.

---

## 🚀 Avvio Applicazione

### Avviare tutto:
```bash
docker-compose up -d
```

### Spegnere tutto:
```bash
docker-compose down
```

---

## 📋 Altri Comandi Utili

### Riavviare i servizi:
```bash
docker-compose restart
```

### Vedere i log (due terminali separati):
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Controllare lo stato:
```bash
docker-compose ps
```

### Ricostruire dopo modifiche (dipendenze, Dockerfile, ecc.):
```bash
docker-compose down
docker-compose up --build -d
```

---

## 🌐 Accesso

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## 🔐 Credenziali di Login

- **Username:** `fieldrobotics`
- **Password:** `FieldRobotics2025!GCS`

---

## 🏗️ Struttura del Progetto

```
gcs_dji_dock/
├── docker-compose.yml        # Orchestrazione servizi
├── backend/
│   ├── Dockerfile           # Container Python/FastAPI
│   ├── .env                 # Configurazione backend
│   ├── app/
│   │   ├── main.py
│   │   ├── mission_db.py
│   │   ├── mission_scheduler.py
│   │   └── video_controller.py
│   └── requirements.txt
│
└── frontend/
    ├── Dockerfile           # Container Node/Vite
    ├── .env                 # Configurazione frontend
    └── src/
        ├── App.jsx
        └── components/
```

---

## 🔧 Configurazione

### Backend (.env)
Configurato in `backend/.env` con credenziali ThingsBoard, DJI API, e autenticazione JWT.

### Frontend (.env)
Configurato in `frontend/.env` con URL backend e token Mapbox.

---

## 🚀 Funzionalità

- ✅ Visualizzazione telemetria live (UAV + Dock)
- ✅ Gestione missioni con waypoint
- ✅ Mappa interattiva Mapbox satellite
- ✅ Scheduling missioni con cron
- ✅ Controllo video streaming
- ✅ Storico esecuzioni
