"""
file: app/integrations/adpm/thingsboard.py

Integrazione ThingsBoard ADPM (Asset Device Performance Management)
Gestisce tutta la comunicazione con le API ThingsBoard Cloud fornite da ADPM
per il controllo e la telemetria del DJI Dock.
"""

# ======================
# IMPORT
# ======================

import logging
from datetime import datetime
from typing import Dict, Any, Optional
import requests

from app.core.config import settings

logger = logging.getLogger(__name__)


# ======================
# THINGSBOARD CLIENT
# ======================

class ThingsBoardClient:
    """
    Client per ThingsBoard Cloud API con caching del token.

    Obiettivo:
    - autenticarsi su ThingsBoard (login) e ottenere un JWT token
    - riutilizzare lo stesso token finché è valido (evitando login ad ogni richiesta)
    - esporre metodi comodi per:
        - leggere telemetria (timeseries)
        - inviare comandi/missioni (shared attributes)
        - verificare connessione
    """

    def __init__(self, http_session: requests.Session):
        """
        Inizializza il client usando una requests.Session condivisa.

        Perché usare una Session?
        - connection pooling (connessioni HTTP riutilizzate)
        - migliori performance
        - possibilità di configurare retry / adapter a monte

        Parametri presi da settings:
        - THINGSBOARD_URL: base URL dell'istanza ThingsBoard
        - TB_USER / TB_PASS: credenziali per login
        - DOCK_ID: ID del dispositivo (DJI dock) su ThingsBoard
        """
        self.http_session = http_session
        self.base_url = settings.THINGSBOARD_URL
        self.username = settings.TB_USER
        self.password = settings.TB_PASS
        self.dock_id = settings.DOCK_ID

        # ======================
        # TOKEN CACHE
        # ======================
        # _token: JWT token ricevuto da ThingsBoard dopo il login
        # _token_expires_at: timestamp UNIX (secondi) che indica fino a quando
        #                    consideriamo valido il token in cache
        self._token: Optional[str] = None
        self._token_expires_at: float = 0


    # ======================
    # AUTH / TOKEN
    # ======================

    def get_token(self) -> str:
        """
        Ottiene il token di autenticazione ThingsBoard, con caching.

        Logica:
        1) Se abbiamo un token in cache e non è scaduto (in base a _token_expires_at),
           lo riusiamo.
        2) Altrimenti facciamo login su:
           POST {base_url}/api/auth/login
           body: {"username": ..., "password": ...}
        3) Salviamo il token e impostiamo la scadenza "applicativa" a 50 minuti.

        Nota:
        - Qui non leggiamo l'exp del JWT, usiamo una TTL fissa (50 min) per semplicità.
        - Se il token reale scade prima o se ThingsBoard invalida il token,
          le richieste successive falliranno e verrà loggato l'errore.
        """
        # Se il token è già presente e non è "scaduto" secondo la nostra TTL, lo restituiamo
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

            # ThingsBoard tipicamente ritorna un JSON con campo "token"
            token = res.json()["token"]

            # Salviamo in cache il token per 50 minuti
            self._token = token
            self._token_expires_at = datetime.now().timestamp() + (50 * 60)

            logger.info("ThingsBoard token refreshed")
            return token

        except Exception as e:
            # Se qualcosa va storto (connessione, credenziali errate, ecc.)
            logger.error(f"ThingsBoard authentication error: {e}")
            raise

    def clear_token_cache(self):
        """
        Svuota la cache del token.

        Utile:
        - durante shutdown
        - se vuoi forzare un refresh del token al prossimo utilizzo
        """
        self._token = None
        self._token_expires_at = 0
        logger.info("Token cache cleared")


    # ======================
    # TELEMETRIA
    # ======================

    def get_telemetry(self, keys: str = "") -> Dict[str, Any]:
        """
        Legge la telemetria del dock da ThingsBoard (timeseries).

        Endpoint:
        GET /api/plugins/telemetry/DEVICE/{dock_id}/values/timeseries?useStrictDataTypes=true

        Parametri:
        - keys: se fornito, ThingsBoard filtra e restituisce solo quelle chiavi
                (es. "battery,latitude,longitude"). Se stringa vuota, prende tutto.

        Header:
        - X-Authorization: Bearer <token>

        Ritorno:
        - JSON (dict) con le timeseries richieste.
        """
        try:
            token = self.get_token()

            res = self.http_session.get(
                f"{self.base_url}/api/plugins/telemetry/DEVICE/{self.dock_id}/values/timeseries?useStrictDataTypes=true",
                headers={"X-Authorization": f"Bearer {token}"},
                params={"keys": keys} if keys else {},
                timeout=5
            )
            res.raise_for_status()
            return res.json()

        except Exception as e:
            logger.error(f"Error fetching dock telemetry: {e}")
            raise


    # ======================
    # MISSION / COMMANDS
    # ======================

    def send_mission_command(self, mission_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Invia un comando/missione al dock tramite Shared Attributes.

        In molte integrazioni ThingsBoard:
        - le Shared Attributes vengono usate come "canale" per inviare configurazioni
          o comandi al device (o a un agente che li legge).

        Endpoint:
        POST /api/plugins/telemetry/DEVICE/{dock_id}/attributes/SHARED_SCOPE

        Header:
        - X-Authorization: Bearer <token>
        - Content-Type: application/json

        Body:
        - mission_data: dict che contiene i campi che vuoi scrivere come shared attributes.

        Ritorno:
        - JSON di risposta (dipende dalla versione/config di ThingsBoard).
        """
        try:
            token = self.get_token()

            res = self.http_session.post(
                f"{self.base_url}/api/plugins/telemetry/DEVICE/{self.dock_id}/attributes/SHARED_SCOPE",
                headers={
                    "X-Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                },
                json=mission_data,
                timeout=10
            )
            res.raise_for_status()
            return res.json()

        except Exception as e:
            logger.error(f"Error sending mission command: {e}")
            raise


    # ======================
    # HEALTH / CHECK
    # ======================

    def check_connection(self) -> bool:
        """
        Verifica rapidamente se la connessione a ThingsBoard "sembra" funzionare.

        Implementazione:
        - prova a ottenere un token (get_token)
        - se riesce, ritorna True (token non vuoto)
        - se fallisce per eccezioni, ritorna False

        Nota:
        - Questo non verifica un endpoint di telemetria; verifica solo l'autenticazione.
        - Se vuoi un check più robusto, puoi fare anche una GET telemetria con timeout breve.
        """
        try:
            token = self.get_token()
            return bool(token)
        except Exception:
            return False
