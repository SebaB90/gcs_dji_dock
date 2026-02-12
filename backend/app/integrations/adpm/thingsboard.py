"""
file: app/integrations/adpm/thingsboard.py

Integrazione ThingsBoard ADPM (Asset Device Performance Management)
Gestisce tutta la comunicazione con le API ThingsBoard Cloud fornite da ADPM
per il controllo e l'acquisizione della telemetria del DJI Dock.
"""

# ======================
# IMPORT
# ======================
from datetime import datetime
from typing import Dict, Any, Optional
import requests
from loguru import logger # Usiamo loguru per coerenza con il resto del progetto

from app.core.config import settings

# ======================
# THINGSBOARD CLIENT
# ======================
class ThingsBoardClient:
    """
    Client per ThingsBoard con gestione del token.
    Agnostico rispetto al dispositivo: richiede 'device_id' per ogni operazione.
    """

    def __init__(self, http_session: requests.Session):
        self.http_session = http_session
        self.base_url = settings.THINGSBOARD_URL
        self.username = settings.TB_USER
        self.password = settings.TB_PASS

        # TOKEN CACHE
        self._token: Optional[str] = None
        self._token_expires_at: float = 0


    # ======================
    # UTILS PER GESTIONE TOKEN
    # ======================
    def get_token(self) -> str:
        # Ottiene il token di autenticazione ThingsBoard, con caching.
        if self._token and datetime.now().timestamp() < self._token_expires_at:
            return self._token

        try:
            # Login per ottenere un nuovo token
            res = self.http_session.post(
                f"{self.base_url}/api/auth/login",
                json={"username": self.username, "password": self.password},
                timeout=10
            )
            res.raise_for_status()

            token = res.json()["token"]

            # Salviamo in cache il token per 50 minuti
            self._token = token
            self._token_expires_at = datetime.now().timestamp() + (50 * 60)

            logger.info("ThingsBoard token refreshed")
            return token

        except Exception as e:
            logger.error(f"ThingsBoard authentication error: {e}")
            raise


    def clear_token_cache(self):
        self._token = None
        self._token_expires_at = 0
        logger.info("Token cache cleared")


    # ======================
    # TELEMETRIA
    # ======================
    def get_telemetry(self, device_id: str, keys: str = "") -> Dict[str, Any]:
        try:
            token = self.get_token()

            res = self.http_session.get(
                f"{self.base_url}/api/plugins/telemetry/DEVICE/{device_id}/values/timeseries?useStrictDataTypes=true",
                headers={"X-Authorization": f"Bearer {token}"},
                params={"keys": keys} if keys else {},
                timeout=5
            )
            res.raise_for_status()
            return res.json()

        except Exception as e:
            logger.error(f"Error fetching telemetry for device {device_id}: {e}")
            raise


    # ======================
    # COMANDI / MISSIONI
    # ======================
    def send_mission_command(self, device_id: str, mission_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            token = self.get_token()

            res = self.http_session.post(
                f"{self.base_url}/api/plugins/telemetry/DEVICE/{device_id}/attributes/SHARED_SCOPE",
                headers={"X-Authorization": f"Bearer {token}"},
                json=mission_data,
                timeout=10
            )
            
            # 1. Se lo status NON è 2xx (es. 401, 500), alziamo subito un errore.
            res.raise_for_status() 

            # 2. Analizziamo il testo della risposta
            response_text = res.text.strip()
            
            # --- CASO A: SUCCESSO (Body Vuoto) ---
            # Se la stringa è vuota, significa che ThingsBoard ha accettato il comando.
            if not response_text:
                return {"status": "success", "message": "Command accepted (Empty response)"}
            
            # --- CASO B: ERRORE ("invalid json" o qualsiasi altro testo) ---
            # Se c'è del testo, per noi è un errore (perché il successo deve essere vuoto)
            raise ValueError(f"ADPM API rejected the payload: {response_text}")

        except Exception as e:
            # Logghiamo l'errore completo per debug
            status_code = "N/A"
            body = "N/A"
            if 'res' in locals():
                status_code = res.status_code
                body = res.text
            
            logger.error(f"Error sending command to {device_id}: {e} | Status: {status_code} | Body: {body}")
            raise


    # ======================
    # HEALTH / CHECK
    # ======================
    def check_connection(self) -> bool:
        try:
            token = self.get_token()
            return bool(token)
        except Exception:
            return False