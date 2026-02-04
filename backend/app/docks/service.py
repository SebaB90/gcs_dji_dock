import time
import requests
from fastapi import HTTPException
from app.core.config import settings
from app.integrations.adpm.thingsboard import ThingsBoardClient

# Cache locale per la telemetria (Business Logic)
_telemetry_cache = {"data": None, "timestamp": 0, "ttl": 1.0}

class DockService:
    def __init__(self, tb_client: ThingsBoardClient):
        self.tb_client = tb_client

    def get_telemetry_cached(self):
        """Usa il client TB per prendere i dati, ma gestisce la cache qui"""
        current_time = time.time()
        
        # Se la cache è valida, usala
        if _telemetry_cache["data"] and (current_time - _telemetry_cache["timestamp"]) < _telemetry_cache["ttl"]:
            return _telemetry_cache["data"]
        
        # Altrimenti chiama l'integrazione
        try:
            telemetry = self.tb_client.get_telemetry()
            _telemetry_cache["data"] = telemetry
            _telemetry_cache["timestamp"] = current_time
            return telemetry
        except Exception as e:
            # Qui potresti loggare l'errore
            raise HTTPException(status_code=502, detail="Errore nel recupero dati dal Dock")

    def send_manual_command(self, command: dict):
        """Passa il comando direttamente all'integrazione"""
        try:
            return self.tb_client.send_mission_command(command)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Errore invio comando: {str(e)}")

    def get_dji_token(self):
        """
        Questa logica è specifica di DJI, non di ThingsBoard.
        Per ora la teniamo qui nel service.
        """
        if not settings.DJI_APP_KEY or not settings.DJI_APP_LICENSE:
            raise HTTPException(status_code=400, detail="Credenziali DJI mancanti")
        
        try:
            res = requests.post(
                f"{settings.DJI_API_BASE}/v1/oauth/token",
                json={"app_key": settings.DJI_APP_KEY, "app_license": settings.DJI_APP_LICENSE},
                timeout=10
            )
            res.raise_for_status()
            return res.json().get("data", {})
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Errore DJI API: {str(e)}")

# Helper per istanziare il service (Useremo l'istanza globale di tb_client dal main)
def get_dock_service_instance():
    # Importiamo qui per evitare circular imports
    from app.main import tb_client 
    return DockService(tb_client)