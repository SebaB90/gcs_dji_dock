import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.date import DateTrigger
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.database.core import SessionLocal
from app.integrations.adpm.thingsboard import ThingsBoardClient
from . import models

logger = logging.getLogger(__name__)

class MissionSchedulerService:
    def __init__(self, tb_client: ThingsBoardClient):
        self.scheduler = BackgroundScheduler()
        self.tb_client = tb_client
        self.scheduler.start()
        logger.info("Mission Scheduler System Started")

    def stop(self):
        self.scheduler.shutdown()

    # --- JOB EXECUTOR (Gira nel thread background) ---
    def _execute_mission_job(self, mission_id: int, schedule_id: int = None, execution_type: str = "manual"):
        """
        Questa funzione viene chiamata dallo scheduler. 
        Deve creare la propria sessione DB.
        """
        logger.info(f"Starting execution for Mission {mission_id} (Schedule: {schedule_id})")
        db: Session = SessionLocal()
        
        try:
            # 1. Recupera Missione
            mission = db.query(models.Mission).filter(models.Mission.id == mission_id).first()
            if not mission:
                logger.error(f"Mission {mission_id} not found during execution")
                return

            # 2. Crea Execution Record (Pending)
            execution = models.MissionExecution(
                mission_id=mission_id,
                schedule_id=schedule_id,
                execution_type=execution_type,
                status="running",
                started_at=datetime.utcnow()
            )
            db.add(execution)
            db.commit()

            # 3. Prepara Payload DJI
            waypoints_list = [w for w in mission.waypoints] # Assumiamo sia già lista di dict grazie a JSON type
            
            payload = {
                "UAVCMD": {
                    "command": "MISSION_LOAD",
                    "parameters": {
                        "speed": mission.speed,
                        "nadir": False,
                        "rth": mission.rth,
                        "photo": mission.photo,
                        "photo_time": 0,
                        "points": waypoints_list
                    }
                }
            }

            # 4. Invia a ThingsBoard
            logger.info(f"Sending command to ThingsBoard for Mission {mission.name}")
            result = self.tb_client.send_mission_command(payload)

            # 5. Aggiorna Successo
            execution.status = "completed"
            execution.completed_at = datetime.utcnow()
            execution.result = result
            
            # Aggiorna last_execution nello schedule
            if schedule_id:
                sched = db.query(models.MissionSchedule).filter(models.MissionSchedule.id == schedule_id).first()
                if sched:
                    sched.last_execution = datetime.utcnow()
            
            db.commit()
            logger.info(f"Mission {mission_id} completed successfully")

        except Exception as e:
            logger.error(f"Execution failed for Mission {mission_id}: {str(e)}")
            if 'execution' in locals():
                execution.status = "failed"
                execution.completed_at = datetime.utcnow()
                execution.error_message = str(e)
                db.commit()
        finally:
            db.close()

    # --- SCHEDULING LOGIC ---

    def schedule_immediate(self, mission_id: int):
        self.scheduler.add_job(
            self._execute_mission_job,
            trigger=DateTrigger(run_date=datetime.now() + timedelta(seconds=1)),
            args=[mission_id, None, "manual"],
            id=f"immediate_{mission_id}_{datetime.now().timestamp()}"
        )

    def update_schedule_job(self, db: Session, schedule: models.MissionSchedule):
        """Aggiunge o Aggiorna un job nello scheduler basandosi sul DB"""
        job_id = f"sched_{schedule.id}"
        
        # Rimuovi se esiste
        if self.scheduler.get_job(job_id):
            self.scheduler.remove_job(job_id)

        if not schedule.enabled:
            return

        if schedule.schedule_type == 'once' and schedule.start_time:
            self.scheduler.add_job(
                self._execute_mission_job,
                trigger=DateTrigger(run_date=schedule.start_time),
                args=[schedule.mission_id, schedule.id, "scheduled"],
                id=job_id,
                replace_existing=True
            )
        
        elif schedule.schedule_type == 'recurring' and schedule.recurrence_pattern:
            # Pattern esempio: {"days": [0, 2], "times": ["10:00"]}
            # APScheduler: 0=Mon, 6=Sun. Assicuriamoci di mappare correttamente.
            pattern = schedule.recurrence_pattern
            days = ",".join(map(str, pattern.get('days', [])))
            times = pattern.get('times', ["08:00"])

            for i, time_str in enumerate(times):
                hour, minute = map(int, time_str.split(':'))
                sub_job_id = f"{job_id}_{i}"
                
                self.scheduler.add_job(
                    self._execute_mission_job,
                    trigger=CronTrigger(day_of_week=days, hour=hour, minute=minute),
                    args=[schedule.mission_id, schedule.id, "scheduled"],
                    id=sub_job_id,
                    replace_existing=True
                )

# Istanza globale (verrà inizializzata nel main)
scheduler_instance: MissionSchedulerService = None

def get_scheduler():
    return scheduler_instance