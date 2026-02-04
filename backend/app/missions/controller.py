from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database.core import get_db
from app.users.service import role_required
from app.users.models import UserRole
from . import schemas, service

# --- QUESTA È LA VARIABILE CHE MANCAVA ---
router = APIRouter(prefix="/missions", tags=["Missions"])

@router.post("/", response_model=schemas.MissionResponse)
def create_mission(
    mission: schemas.MissionCreate, 
    db: Session = Depends(get_db),
    current_user = Depends(role_required([UserRole.ADMIN, UserRole.OPERATOR]))
):
    return service.create_mission(db, mission, current_user.username)

@router.get("/", response_model=List[schemas.MissionResponse])
def list_missions(
    db: Session = Depends(get_db),
    current_user = Depends(role_required([UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER]))
):
    return service.get_missions(db)

@router.post("/{mission_id}/schedule", response_model=schemas.ScheduleResponse)
def schedule_mission(
    mission_id: int,
    schedule: schemas.ScheduleCreate,
    db: Session = Depends(get_db),
    current_user = Depends(role_required([UserRole.ADMIN, UserRole.OPERATOR]))
):
    res = service.create_schedule(db, mission_id, schedule)
    if not res:
        # Caso Immediate (ritorno fittizio per soddisfare lo schema)
        return {"id": 0, "mission_id": mission_id, "schedule_type": "immediate", "enabled": True}
    return res