"""
file: app/missions/service.py

Gestisce la logica di business per Missioni, Schedulazioni ed Esecuzioni.
"""
from loguru import logger 
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from fastapi import HTTPException

from . import models, schemas
from app.core import scheduler

# ==========================================
# 🔧 CONFIGURAZIONE DEBUG
# ==========================================
# Mettilo a True per vedere i dati grezzi e il loop ogni secondo.
# Mettilo a False per vedere solo quando la missione parte o finisce.
ENABLE_FSM_DEBUG = True 


# ======================
# CRUD MISSIONI 
# ======================

def create_mission(db: Session, mission: schemas.MissionCreate, username: str) -> models.Mission:
    waypoints_data = [w.model_dump() for w in mission.waypoints]
    db_mission = models.Mission(
        name=mission.name, description=mission.description, speed=mission.speed,
        rth=mission.rth, nadir=mission.nadir, photo=mission.photo,
        photo_time=mission.photo_time, waypoints=waypoints_data, created_by=username
    )
    db.add(db_mission)
    db.commit()
    db.refresh(db_mission)
    return db_mission

def get_missions(db: Session) -> List[models.Mission]:
    return db.query(models.Mission).order_by(models.Mission.created_at.desc()).all()

def get_mission_by_id(db: Session, mission_id: int) -> models.Mission:
    mission = db.query(models.Mission).filter(models.Mission.id == mission_id).first()
    if not mission: raise HTTPException(status_code=404, detail="Mission not found")
    return mission

def delete_mission(db: Session, mission_id: int) -> bool:
    mission = get_mission_by_id(db, mission_id)
    db.delete(mission)
    db.commit()
    return True

# ======================
# CRUD SCHEDULE 
# ======================

def create_schedule(db: Session, mission_id: int, schedule_data: schemas.ScheduleCreate) -> models.MissionSchedule:
    mission = db.query(models.Mission).filter(models.Mission.id == mission_id).first()
    if not mission: raise HTTPException(status_code=404, detail="Mission not found")

    if schedule_data.schedule_type == 'once' and not schedule_data.start_time:
        raise HTTPException(status_code=400, detail="Start time required for 'once'")
    if schedule_data.schedule_type == 'recurring' and not schedule_data.recurrence_pattern:
        raise HTTPException(status_code=400, detail="Recurrence pattern required for 'recurring'")

    pattern = schedule_data.recurrence_pattern.model_dump() if schedule_data.recurrence_pattern else None
    
    # Calculate next_execution for both types
    next_exec = None
    if schedule_data.schedule_type == 'once':
        next_exec = schedule_data.start_time
    elif schedule_data.schedule_type == 'recurring' and pattern:
        # Calculate next execution for recurring schedules
        from app.core import scheduler
        sched_svc = scheduler.get_scheduler()
        if sched_svc:
            next_exec = sched_svc._calculate_next_recurring_date(
                pattern.get('days', []),
                pattern.get('times', [])
            )
    
    db_schedule = models.MissionSchedule(
        mission_id=mission_id, dock_name=schedule_data.dock_name,
        schedule_type=schedule_data.schedule_type, start_time=schedule_data.start_time,
        recurrence_pattern=pattern, enabled=schedule_data.enabled, next_execution=next_exec
    )
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)

    from app.core import scheduler
    sched_svc = scheduler.get_scheduler()
    if sched_svc: sched_svc.update_schedule_job(db, db_schedule)
    return db_schedule

def get_active_schedules(db: Session) -> List[models.MissionSchedule]:
    return db.query(models.MissionSchedule).options(joinedload(models.MissionSchedule.mission))\
        .filter(models.MissionSchedule.enabled == True).order_by(models.MissionSchedule.next_execution).all()

def delete_schedule(db: Session, schedule_id: int) -> bool:
    schedule = db.query(models.MissionSchedule).filter(models.MissionSchedule.id == schedule_id).first()
    if not schedule: raise HTTPException(status_code=404, detail="Schedule not found")
    
    sched_svc = scheduler.get_scheduler()
    if sched_svc:
        job_id = f"sched_{schedule_id}"
        if sched_svc.scheduler.get_job(job_id): sched_svc.scheduler.remove_job(job_id)
        for i in range(10): 
            if sched_svc.scheduler.get_job(f"{job_id}_{i}"): sched_svc.scheduler.remove_job(f"{job_id}_{i}")

    db.delete(schedule)
    db.commit()
    return True

# ======================
# HISTORY & MONITORING
# ======================

def get_active_executions(db: Session) -> List[models.MissionExecution]:
    return db.query(models.MissionExecution).options(joinedload(models.MissionExecution.mission))\
        .filter(models.MissionExecution.status.in_(["running", "sent_to_tb"]))\
        .order_by(models.MissionExecution.started_at.desc()).all()

def get_execution_history(db: Session, dock_name: str = None, limit: int = 50) -> List[models.MissionExecution]:
    query = db.query(models.MissionExecution).options(joinedload(models.MissionExecution.mission))
    if dock_name: query = query.filter(models.MissionExecution.dock_name == dock_name)
    return query.order_by(models.MissionExecution.started_at.desc()).limit(limit).all()


# ======================
# MACCHINA A STATI (WATCHDOG)
# ======================

def check_mission_logic(db: Session, dock_name: str, raw_data: dict):
    """
    Macchina a stati con Debug Toggle.
    """
    from app.core.scheduler import MISSION_START_TIMEOUT

    # 1. CERCA MISSIONE (Case Insensitive)
    execution = db.query(models.MissionExecution).filter(
        func.lower(models.MissionExecution.dock_name) == dock_name.lower(),
        models.MissionExecution.status.in_(["sent_to_tb", "running"])
    ).first()

    if not execution:
        return

    # LOG DEBUG: Solo se abilitato
    if ENABLE_FSM_DEBUG:
        logger.info(f"🔎 FSM DEBUG: Monitoraggio Missione {execution.id} ({execution.status}) su {dock_name}")

    # 2. PARSING DATI
    is_in_operation = False
    drone_in_dock = True 
    dock_mode_str = "unknown"

    dock_list = raw_data.get("dock", [])
    if dock_list and isinstance(dock_list, list):
        val = dock_list[0].get("value", {})
        if isinstance(val, str): # Fix per JSON string
            import json
            try: val = json.loads(val)
            except: val = {}

        if isinstance(val, dict):
            dock_mode_str = val.get("dock_mode", "unknown")
            drone_in_dock = val.get("drone_in_dock", True)
            is_in_operation = dock_mode_str in ["in_operation", "working"]

    # LOG DATI GREZZI: Solo se abilitato
    if ENABLE_FSM_DEBUG:
        logger.info(f"📡 FSM DATA: Mode={dock_mode_str} | InOp={is_in_operation} | InDock={drone_in_dock}")

    now = datetime.now()
    elapsed = (now - execution.started_at).total_seconds()

    # 3. TRANSIZIONI (I log di stato vengono stampati SEMPRE, sono importanti)

    # --- FASE AVVIO ---
    if execution.status == "sent_to_tb":
        if is_in_operation:
            execution.status = "running"
            logger.success(f"⚙️ Mission {execution.mission_id}: PRESA IN CARICO (Dock Mode: {dock_mode_str})")
            db.commit()
            return

        if not drone_in_dock:
            execution.status = "running"
            logger.success(f"🚀 Mission {execution.mission_id}: IN VOLO (Drone rilevato fuori dock)")
            db.commit()
            return

        if elapsed > MISSION_START_TIMEOUT:
            logger.error(f"❌ Mission {execution.mission_id}: Timeout Start ({elapsed}s)")
            execution.status = "failed"
            execution.error_message = f"Timeout: Dock ferma in {dock_mode_str}"
            execution.completed_at = now
            db.commit()
            return
        
        # Log di attesa (Spam) solo se debug attivo
        if ENABLE_FSM_DEBUG:
            logger.info(f"⏳ FSM WAITING: In attesa di avvio... ({int(elapsed)}s)")

    # --- FASE ESECUZIONE ---
    elif execution.status == "running":
        mission_finished = drone_in_dock and (not is_in_operation)
        
        if mission_finished and elapsed > 30:
            execution.status = "completed"
            execution.completed_at = now
            logger.success(f"🏁 Mission {execution.mission_id}: COMPLETATA")
            
            if execution.schedule_id:
                sched = scheduler.get_scheduler()
                if sched: sched._handle_post_execution_schedule(db, execution.schedule_id)
            db.commit()
        else:
            if ENABLE_FSM_DEBUG:
                logger.info(f"🚁 FSM RUNNING: Volo in corso... (Dock: {dock_mode_str})")