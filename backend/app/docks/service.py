import logging
from typing import Dict, Any, Optional
from datetime import datetime
from fastapi import HTTPException
from app.core.config import settings
from app.integrations.adpm.thingsboard import ThingsBoardClient

logger = logging.getLogger(__name__)

# Cache in memoria interna al modulo
_telemetry_cache: Dict[str, Any] = {}

class DockService:
    def __init__(self, tb_client: ThingsBoardClient):
        self.tb_client = tb_client
        self.dock_registry = settings.DOCKS_MAP

    @staticmethod
    def update_cache(dock_name: str, raw_data: Dict[str, Any]):
        """Aggiorna la telemetria in RAM. Chiamato dallo scheduler."""
        # Restituisce il JSON completo di ThingsBoard senza modifiche
        raw_data["updated_at"] = datetime.now().isoformat()
        _telemetry_cache[dock_name] = raw_data

    def _resolve_dock_id(self, dock_name: str) -> str:
        tb_device_id = self.dock_registry.get(dock_name)
        if not tb_device_id:
            raise HTTPException(status_code=404, detail=f"Dock '{dock_name}' non configurata")
        return tb_device_id
    
    def get_tb_telemetry(self, dock_name: str):
        """Restituisce istantaneamente l'ultimo dato in RAM."""
        self._resolve_dock_id(dock_name)
        data = _telemetry_cache.get(dock_name)
        if not data:
            return {"status": "offline", "dock_name": dock_name}
        return data

def get_dock_service_instance():
    from app.main import tb_client
    return DockService(tb_client)