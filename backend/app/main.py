from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
import os
from dotenv import load_dotenv

# Carica variabili d’ambiente
load_dotenv()

app = FastAPI(title="GCS Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # in produzione limita ai tuoi domini
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ====================
# CONFIGURAZIONE
# ====================
BASE_URL = os.getenv("THINGSBOARD_URL", "https://thingsboard.cloud")
USERNAME = os.getenv("TB_USER", "bruno.strano@fieldrobotics.it")
PASSWORD = os.getenv("TB_PASS", "FieldRobotics2025")

DRONE_ID = "5acadfc0-4d9b-11f0-add2-093f841cc5dc"
HANGAR_ID = "17a81bb0-4d9e-11f0-add2-093f841cc5dc"

# ====================
# LOGIN E TOKEN
# ====================
def get_token():
    try:
        res = requests.post(f"{BASE_URL}/api/auth/login", json={"username": USERNAME, "password": PASSWORD})
        res.raise_for_status()
        return res.json()["token"]
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Errore autenticazione: {e}")

# ====================
# ENDPOINTS
# ====================

@app.get("/")
def root():
    return {"status": "ok", "service": "GCS Backend"}

@app.get("/telemetry")
def get_telemetry():
    """Restituisce telemetria drone + hangar"""
    token = get_token()
    headers = {"X-Authorization": f"Bearer {token}"}

    try:
        drone = requests.get(
            f"{BASE_URL}/api/plugins/telemetry/DEVICE/{DRONE_ID}/values/timeseries?useStrictDataTypes=true",
            headers=headers
        ).json()
        hangar = requests.get(
            f"{BASE_URL}/api/plugins/telemetry/DEVICE/{HANGAR_ID}/values/timeseries?useStrictDataTypes=true",
            headers=headers
        ).json()

        return {"drone": drone, "hangar": hangar}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore nel recupero telemetria: {e}")

@app.post("/mission")
def send_mission(mission: dict):
    """Invia missione al drone tramite ThingsBoard"""
    token = get_token()
    headers = {"X-Authorization": f"Bearer {token}"}

    try:
        res = requests.post(
            f"{BASE_URL}/api/plugins/telemetry/DEVICE/{HANGAR_ID}/attributes/SHARED_SCOPE",
            headers=headers,
            json=mission
        )
        if res.status_code == 200:
            return {"status": "ok"}
        raise HTTPException(status_code=res.status_code, detail=f"Errore invio missione: {res.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
