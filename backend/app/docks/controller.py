from fastapi import APIRouter, Depends
from app.users.service import get_current_user, role_required
from app.users.models import UserRole
from .service import DockService, get_dock_service_instance

router = APIRouter(tags=["Docks & Devices"])

@router.get("/telemetry")
def get_telemetry(
    current_user = Depends(get_current_user),
    service: DockService = Depends(get_dock_service_instance)
):
    return service.get_telemetry_cached()

@router.post("/mission/manual")
def send_manual_command(
    command: dict,
    service: DockService = Depends(get_dock_service_instance),
    current_user = Depends(role_required([UserRole.ADMIN, UserRole.OPERATOR]))
):
    return {"status": "ok", "result": service.send_manual_command(command)}

@router.get("/dji/token")
def get_dji_token(
    current_user = Depends(get_current_user),
    service: DockService = Depends(get_dock_service_instance)
):
    return service.get_dji_token()