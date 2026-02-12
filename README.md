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

- **Username:** `admin`
- **Password:** `admin123`

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
