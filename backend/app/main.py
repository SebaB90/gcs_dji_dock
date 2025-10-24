from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
import os
from dotenv import load_dotenv

# ====================
# CONFIGURAZIONE BASE
# ====================

load_dotenv()

app = FastAPI(title="GCS Backend")

# CORS – Permetti l’accesso dal frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ⚠️ In produzione limita ai tuoi domini
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ====================
# THINGSBOARD CONFIG
# ====================
BASE_URL = os.getenv("THINGSBOARD_URL", "https://thingsboard.cloud")
USERNAME = os.getenv("TB_USER", "bruno.strano@fieldrobotics.it")
PASSWORD = os.getenv("TB_PASS", "FieldRobotics2025")

DRONE_ID = os.getenv("TB_DRONE_ID", "5acadfc0-4d9b-11f0-add2-093f841cc5dc")
HANGAR_ID = os.getenv("TB_HANGAR_ID", "17a81bb0-4d9e-11f0-add2-093f841cc5dc")

# ====================
# DJI CLOUD CONFIG
# ====================
DJI_API_BASE = os.getenv("DJI_API_BASE", "https://developer-api.dji.com")
DJI_APP_KEY = os.getenv("DJI_APP_KEY")
DJI_APP_LICENSE = os.getenv("DJI_APP_LICENSE")

# ====================
# UTILITY FUNZIONE TB TOKEN
# ====================
def get_tb_token():
    """Ottiene il token di autenticazione da ThingsBoard"""
    try:
        res = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": USERNAME, "password": PASSWORD},
            timeout=10
        )
        res.raise_for_status()
        return res.json()["token"]
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Errore autenticazione TB: {e}")


# ====================
# ENDPOINT BASE
# ====================
@app.get("/")
def root():
    """Verifica stato backend"""
    return {"status": "ok", "service": "GCS Backend"}


# ====================
# TELEMETRIA
# ====================
@app.get("/telemetry")
def get_telemetry():
    """Restituisce telemetria drone + hangar"""
    token = get_tb_token()
    headers = {"X-Authorization": f"Bearer {token}"}

    try:
        drone = requests.get(
            f"{BASE_URL}/api/plugins/telemetry/DEVICE/{DRONE_ID}/values/timeseries?useStrictDataTypes=true",
            headers=headers,
            timeout=2
        ).json()

        hangar = requests.get(
            f"{BASE_URL}/api/plugins/telemetry/DEVICE/{HANGAR_ID}/values/timeseries?useStrictDataTypes=true",
            headers=headers,
            timeout=2
        ).json()

        return {"drone": drone, "hangar": hangar}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore nel recupero telemetria: {e}")


# ====================
# MISSIONE
# ====================
@app.post("/mission")
def send_mission(mission: dict):
    """Invia missione al drone tramite ThingsBoard"""
    token = get_tb_token()
    headers = {"X-Authorization": f"Bearer {token}"}

    try:
        res = requests.post(
            f"{BASE_URL}/api/plugins/telemetry/DEVICE/{HANGAR_ID}/attributes/SHARED_SCOPE",
            headers=headers,
            json=mission,
            timeout=10
        )
        res.raise_for_status()
        return {"status": "ok"}

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Errore invio missione: {e}")


# ====================
# MISSIONI SALVATE (MOCK)
# ====================
@app.get("/missions")
def get_missions():
    """
    Restituisce un elenco di missioni predefinite (mock)
    per testare la sezione 'Carica missione' del frontend.
    """
    missions = [
        {
            "id": "m1",
            "name": "Ispezione magazzino nord",
            "speed": 1.2,
            "rth": True,
            "photo": True,
            "points": [
                {"lat": 44.5721534, "lon": 11.2514301, "alt": 25},
                {"lat": 44.5721970, "lon": 11.2514373, "alt": 25},
                {"lat": 44.5722105, "lon": 11.2515108, "alt": 25},
                {"lat": 44.5721534, "lon": 11.2514301, "alt": 25},
            ],
        },
        {
            "id": "m2",
            "name": "Perimetro edificio principale",
            "speed": 1.0,
            "rth": False,
            "photo": False,
            "points": [
                {"lat": 44.5721450, "lon": 11.2513000, "alt": 30},
                {"lat": 44.5721900, "lon": 11.2516000, "alt": 30},
                {"lat": 44.5720500, "lon": 11.2516200, "alt": 30},
                {"lat": 44.5720000, "lon": 11.2513200, "alt": 30},
                {"lat": 44.5721450, "lon": 11.2513000, "alt": 30},
            ],
        },
    ]

    return missions


# ==============================
#  DJI CLOUD API - TOKEN REQUEST
# ==============================
@app.get("/dji/token")
def get_dji_token():
    """Ottiene il token di accesso (access_token) dalle DJI Cloud API"""
    if not DJI_APP_KEY or not DJI_APP_LICENSE:
        raise HTTPException(
            status_code=400,
            detail="Variabili d'ambiente mancanti: DJI_APP_KEY o DJI_APP_LICENSE non impostate."
        )

    try:
        response = requests.post(
            f"{DJI_API_BASE}/v1/oauth/token",
            json={"app_key": DJI_APP_KEY, "app_license": DJI_APP_LICENSE},
            headers={"Content-Type": "application/json"},
            timeout=10
        )

        response.raise_for_status()
        data = response.json()

        # ✅ DJI risponde con {"code": 0, "message": "success", "data": {...}}
        if data.get("code") != 0 or "data" not in data or "access_token" not in data["data"]:
            raise HTTPException(status_code=500, detail=f"Risposta inattesa da DJI: {data}")

        return {
            "status": "success",
            "access_token": data["data"]["access_token"],
            "expires_in": data["data"].get("expires_in", 7200)
        }

    except requests.exceptions.ConnectionError as e:
        raise HTTPException(status_code=502, detail=f"Errore di connessione: {e}")

    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Timeout nella richiesta a DJI Cloud")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore interno: {e}")
