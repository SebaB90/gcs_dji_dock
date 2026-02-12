from fastapi import APIRouter, Depends
from app.users.service import get_current_user
from .service import DockService, get_dock_service_instance

router = APIRouter(prefix="/docks", tags=["DJI Docks"])

@router.get("/{dock_name}/telemetry")
def get_dock_telemetry(
    dock_name: str,
    current_user = Depends(get_current_user),
    service: DockService = Depends(get_dock_service_instance)
):
    # La risposta ora è istantanea perché legge dalla cache RAM del service
    return service.get_tb_telemetry(dock_name)