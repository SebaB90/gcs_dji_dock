"""
file: app/core/scheduler.py

Il "Cuore" del sistema: gestisce il loop di telemetria a 1Hz, 
la macchina a stati delle missioni e lo scheduling (Once/Recurring).
"""

import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.date import DateTrigger
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from loguru import logger

from app.database.core import SessionLocal
from app.integrations.adpm.thingsboard import ThingsBoardClient
from app.core.config import settings
from app.missions import models

# Configurazione monitoraggio
# TB_KEYS rimosso - Ora richiediamo TUTTA la telemetria da ThingsBoard
MISSION_START_TIMEOUT = 120 # secondi

class MissionSchedulerService:
    
    def __init__(self, tb_client: ThingsBoardClient):
        self.scheduler = BackgroundScheduler()
        self.tb_client = tb_client
        self.scheduler.start()
        
        # LOOP UNIFICATO DI SISTEMA (1Hz)
        self.scheduler.add_job(
            self._system_unified_loop,
            trigger='interval',
            seconds=1,
            id='system_unified_loop',
            replace_existing=True,
            max_instances=3,      # Evita errore "skipped" se la rete è lenta
            coalesce=True,        # Recupera i ritardi eseguendo una sola volta
            misfire_grace_time=10 
        )
        logger.info("Core System Scheduler Started (1Hz Polling enabled)")

    def stop(self):
        self.scheduler.shutdown()

    # =================================================_
    # 1. LOOP DI SISTEMA (TELEMETRIA + MONITORING)
    # =================================================_
    
    def _system_unified_loop(self):
        """Eseguito ogni secondo: aggiorna RAM e controlla stati missioni."""
        from app.telemetry.service import DockService
        from app.missions.service import check_mission_logic
        
        # DEBUG: Decommenta se vuoi vedere che il cuore batte
        # print("--- TICK ---") 
        
        db: Session = SessionLocal()
        try:
            for dock_name, device_id in settings.DOCKS_MAP.items():
                try:
                    # 1. Recupero TUTTA la telemetria da ThingsBoard (nessun filtro keys)
                    raw_data = self.tb_client.get_telemetry(device_id)
                    
                    if not raw_data:
                        # logger.warning(f"[{dock_name}] ⚠️ Nessun dato ricevuto da TB")
                        continue

                    # 2. Aggiornamento Cache
                    DockService.update_cache(dock_name, raw_data)
                    
                    # 3. Logica Missioni
                    check_mission_logic(db, dock_name, raw_data)
                    
                except Exception as e:
                    # Usa logger.error invece di exception per non riempire i log di stack trace se non serve
                    logger.error(f"[{dock_name}] Loop Error: {e}")
                    continue 
        except Exception as outer_e:
            logger.critical(f"CRITICAL SCHEDULER ERROR: {outer_e}")
        finally:
            db.close()

    # =================================================_
    # 2. ESECUTORE MISSIONE (INVIO PAYLOAD)
    # =================================================_
    
    def _execute_mission_job(self, mission_id: int, dock_name: str, schedule_id: int = None, execution_type: str = "manual"):
        """Invia il comando di missione al drone via ThingsBoard."""
        logger.info(f"Preparing execution for Mission {mission_id} on {dock_name}")
        db: Session = SessionLocal()
        
        device_id = settings.DOCKS_MAP.get(dock_name)
        
        execution = models.MissionExecution(
            mission_id=mission_id,
            schedule_id=schedule_id,
            dock_name=dock_name,
            execution_type=execution_type,
            status="pending",
            started_at=datetime.now()
        )
        
        try:
            if not device_id:
                raise ValueError(f"Dock '{dock_name}' non trovata in DOCKS_MAP.")

            mission = db.query(models.Mission).filter(models.Mission.id == mission_id).first()
            if not mission:
                raise ValueError(f"Missione {mission_id} non trovata.")

            db.add(execution)
            db.commit()

            # Costruzione Payload per Drone ADPM
            clean_waypoints = []
            for w in mission.waypoints:
                clean_waypoints.append({
                    "lat": float(w.get("lat")),
                    "lon": float(w.get("lon")),
                    "alt": float(w.get("alt")),
                    "heading": float(w.get("heading", 0)),
                    "tilt_gimbal": float(w.get("tilt_gimbal", 0)),
                    "hover": int(w.get("hover", 0))
                })

            payload = {
                "UAVCMD": {
                    "command": "GOTO_MISSION",
                    "parameters": {
                        "speed": mission.speed,
                        "nadir": mission.nadir,
                        "rth": mission.rth,
                        "photo": mission.photo,
                        "photo_time": mission.photo_time,
                        "points": clean_waypoints
                    }
                }
            }

            # Invio effettivo
            result = self.tb_client.send_mission_command(device_id, payload)

            # Transizione a "sent_to_tb": il monitoraggio 1Hz farà il resto
            execution.status = "sent_to_tb"
            execution.result = result
            
            if schedule_id:
                self._handle_post_execution_schedule(db, schedule_id)
            
            logger.success(f"Mission command sent to {dock_name}")

        except Exception as e:
            logger.error(f"Execution failed: {str(e)}")
            execution.status = "failed"
            execution.error_message = str(e)
            execution.completed_at = datetime.now()
        
        finally:
            db.commit()
            db.close()

    # =================================================_
    # 3. LOGICA DI SCHEDULING (CALCOLO DATE)
    # =================================================_
    
    def _handle_post_execution_schedule(self, db: Session, schedule_id: int):
        sched = db.query(models.MissionSchedule).filter(models.MissionSchedule.id == schedule_id).first()
        if not sched: return

        sched.last_execution = datetime.now()
        if sched.schedule_type == 'once':
            sched.enabled = False
            sched.next_execution = None
        elif sched.schedule_type == 'recurring':
            pattern = sched.recurrence_pattern
            sched.next_execution = self._calculate_next_recurring_date(
                pattern.get('days', []), 
                pattern.get('times', [])
            )

    def _calculate_next_recurring_date(self, days: List[int], times: List[str]) -> datetime:
        now = datetime.now()
        candidates = []
        target_days = days if days and len(days) < 7 else [0, 1, 2, 3, 4, 5, 6]

        for time_str in times:
            try:
                hour, minute = map(int, time_str.split(':'))
                for i in range(8): 
                    future_date = now + timedelta(days=i)
                    candidate = future_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
                    if candidate.weekday() in target_days and candidate > now:
                        candidates.append(candidate)
                        break
            except ValueError: continue
        
        return min(candidates) if candidates else None

    # =================================================_
    # 4. METODI PUBBLICI (UPDATE JOBS)
    # =================================================_
    
    def schedule_immediate(self, mission_id: int, dock_name: str):
        self.scheduler.add_job(
            self._execute_mission_job,
            trigger=DateTrigger(run_date=datetime.now() + timedelta(seconds=1)),
            args=[mission_id, dock_name, None, "manual"]
        )

    def update_schedule_job(self, db: Session, schedule: models.MissionSchedule):
        base_job_id = f"sched_{schedule.id}"
        
        # Cleanup vecchi job
        if self.scheduler.get_job(base_job_id): self.scheduler.remove_job(base_job_id)
        for i in range(10):
            if self.scheduler.get_job(f"{base_job_id}_{i}"): 
                self.scheduler.remove_job(f"{base_job_id}_{i}")

        if not schedule.enabled: return

        if schedule.schedule_type == 'once' and schedule.start_time:
            if schedule.start_time > datetime.now():
                self.scheduler.add_job(
                    self._execute_mission_job,
                    trigger=DateTrigger(run_date=schedule.start_time),
                    args=[schedule.mission_id, schedule.dock_name, schedule.id, "scheduled"],
                    id=base_job_id
                )
        
        elif schedule.schedule_type == 'recurring' and schedule.recurrence_pattern:
            days = schedule.recurrence_pattern.get('days', [])
            times = schedule.recurrence_pattern.get('times', [])
            days_cron = "*" if not days or len(days) >= 7 else ",".join(map(str, days))

            for i, time_str in enumerate(times):
                try:
                    hour, minute = map(int, time_str.split(':'))
                    self.scheduler.add_job(
                        self._execute_mission_job,
                        trigger=CronTrigger(day_of_week=days_cron, hour=hour, minute=minute),
                        args=[schedule.mission_id, schedule.dock_name, schedule.id, "scheduled"],
                        id=f"{base_job_id}_{i}"
                    )
                except ValueError: pass

# Istanza globale
scheduler_instance: MissionSchedulerService = None

def get_scheduler():
    return scheduler_instance