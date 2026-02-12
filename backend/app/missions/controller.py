"""
file: app/missions/controller.py

Rotte FastAPI per la gestione delle missioni.
Delega tutta la logica di accesso ai dati al modulo 'service'.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.core import get_db
from app.users.service import role_required
from app.users.models import UserRole
from . import schemas, service, models

# Necessario solo per recuperare l'istanza dello scheduler nell'endpoint execute
from app.core import scheduler as sched_module

# Impostazione del prefisso /missions
router = APIRouter(prefix="/missions", tags=["Missions"])


# ======================
# GESTIONE MISSIONI (CRUD)
# ======================

@router.post("/create_mission", response_model=schemas.MissionResponse)
def create_mission(
    mission: schemas.MissionCreate, 
    db: Session = Depends(get_db),
    current_user = Depends(role_required([UserRole.ADMIN, UserRole.OPERATOR]))
):
    return service.create_mission(db, mission, current_user.username)


@router.get("/list_missions", response_model=List[schemas.MissionResponse])
def list_missions(
    db: Session = Depends(get_db),
    current_user = Depends(role_required([UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER]))
):
    return service.get_missions(db)


@router.get("/list/{mission_id}", response_model=schemas.MissionResponse)
def get_mission(
    mission_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(role_required([UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER]))
):
    return service.get_mission_by_id(db, mission_id)


@router.delete("/delete/{mission_id}")
def delete_mission(
    mission_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(role_required([UserRole.ADMIN, UserRole.OPERATOR]))
):
    service.delete_mission(db, mission_id)
    return {"message": "Mission deleted successfully"}


# ======================
# GESTIONE SCHEDULING
# ======================

@router.post("/schedules/schedule_mission/{mission_id}", response_model=schemas.ScheduleResponse)
def schedule_mission(
    mission_id: int,
    schedule: schemas.ScheduleCreate,
    db: Session = Depends(get_db),
    current_user = Depends(role_required([UserRole.ADMIN, UserRole.OPERATOR]))
):
    # Crea una pianificazione (Once o Recurring) per una specifica Dock
    return service.create_schedule(db, mission_id, schedule)


@router.get("/schedules/list_schedules", response_model=List[schemas.ScheduleResponse])
def list_schedules(
    db: Session = Depends(get_db),
    current_user = Depends(role_required([UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER]))
):
    # Restituisce solo le schedulazioni attive
    return service.get_active_schedules(db)


@router.delete("/schedules/delete/{schedule_id}")
def delete_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(role_required([UserRole.ADMIN, UserRole.OPERATOR]))
):
    # Rimuove dal DB e pulisce la memoria dello scheduler
    service.delete_schedule(db, schedule_id)
    return {"message": "Schedule deleted successfully"}


# ======================
# GESTIONE ESECUZIONI (RUN & MONITOR)
# ======================

@router.post("/execute/execute_mission/{mission_id}")
def execute_mission(
    mission_id: int,
    # Possiamo passare opzionalmente la dock su cui eseguire ("dock1" o "dock2")
    dock_name: str = Query("dock1", description="Nome della Dock su cui eseguire (dock1, dock2)"),
    db: Session = Depends(get_db),
    current_user = Depends(role_required([UserRole.ADMIN, UserRole.OPERATOR]))
):
    # Esegue una missione IMMEDIATAMENTE (senza creare uno schedule).
    # Richiede Admin o Operator.
    # Verifica esistenza missione tramite service
    mission = service.get_mission_by_id(db, mission_id)
    
    # Recupera istanza scheduler
    sched = sched_module.get_scheduler()
    if not sched:
        raise HTTPException(status_code=503, detail="Scheduler not available")
    
    # Passiamo anche il dock_name allo scheduler
    sched.schedule_immediate(mission_id, dock_name)
    
    return {"status": "success", "message": f"Mission '{mission.name}' sent to {dock_name}"}


@router.get("/execute/active_executions", response_model=List[schemas.ExecutionResponse])
def get_active_executions(
    db: Session = Depends(get_db),
    current_user = Depends(role_required([UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER]))
):
    # Ritorna le missioni che sono in stato 'running' o 'sent_to_tb'
    return service.get_active_executions(db)


@router.get("/execute/history", response_model=List[schemas.ExecutionResponse])
def get_execution_history(
    limit: int = 50,
    dock_name: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(role_required([UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER]))
):
    # Storico completo delle esecuzioni (Success, Failed, ecc.)
    return service.get_execution_history(db, dock_name, limit)