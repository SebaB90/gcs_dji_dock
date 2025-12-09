"""
Mission Scheduler Service
Handles scheduled and recurring mission execution using APScheduler
"""

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.date import DateTrigger
from datetime import datetime, timedelta
from typing import Dict, Optional
import logging
import requests

from .mission_db import MissionDB

logger = logging.getLogger(__name__)

class MissionScheduler:
    def __init__(self, mission_db: MissionDB, tb_api_url: str, get_token_func):
        self.db = mission_db
        self.tb_api_url = tb_api_url
        self.get_token = get_token_func
        self.scheduler = BackgroundScheduler()
        self.scheduler.start()
        logger.info("Mission scheduler started")
        
        # Load existing schedules
        self.load_schedules()
    
    def load_schedules(self):
        """Load all enabled schedules from database and add to scheduler"""
        schedules = self.db.get_enabled_schedules()
        
        for schedule in schedules:
            try:
                self._add_job_to_scheduler(schedule)
                logger.info(f"Loaded schedule {schedule['id']} for mission {schedule['mission_id']}")
            except Exception as e:
                logger.error(f"Failed to load schedule {schedule['id']}: {e}")
    
    def _add_job_to_scheduler(self, schedule: Dict):
        """Add a schedule to APScheduler"""
        schedule_id = schedule['id']
        mission_id = schedule['mission_id']
        schedule_type = schedule['schedule_type']
        
        job_id = f"schedule_{schedule_id}"
        
        # Remove existing job if present
        if self.scheduler.get_job(job_id):
            self.scheduler.remove_job(job_id)
        
        if schedule_type == 'immediate':
            # Execute immediately (not really a schedule, handled elsewhere)
            return
        
        elif schedule_type == 'once':
            # Execute once at specific time
            start_time = datetime.fromisoformat(schedule['start_time'])
            trigger = DateTrigger(run_date=start_time)
            
            self.scheduler.add_job(
                func=self._execute_mission,
                trigger=trigger,
                args=[mission_id, schedule_id],
                id=job_id,
                name=f"Once: Mission {mission_id} at {start_time}",
                replace_existing=True
            )
            
            # Update next_execution
            self.db.update_schedule(schedule_id, next_execution=start_time)
        
        elif schedule_type == 'recurring':
            # Execute on recurring schedule
            pattern = schedule['recurrence_pattern']
            
            if not pattern or 'days' not in pattern or 'times' not in pattern:
                logger.error(f"Invalid recurrence pattern for schedule {schedule_id}")
                return
            
            days = pattern['days']  # [0-6] where 0=Sunday
            times = pattern['times']  # ["HH:MM", ...]
            
            # Convert days to cron format (0=Sunday in pattern, but Monday in cron)
            # APScheduler uses: 0=Mon, 1=Tue, ... 6=Sun
            cron_days = [(d - 1) % 7 for d in days]
            day_of_week = ','.join(map(str, cron_days))
            
            for time_str in times:
                hour, minute = map(int, time_str.split(':'))
                
                trigger = CronTrigger(
                    day_of_week=day_of_week,
                    hour=hour,
                    minute=minute
                )
                
                job_id_time = f"{job_id}_{time_str.replace(':', '')}"
                
                self.scheduler.add_job(
                    func=self._execute_mission,
                    trigger=trigger,
                    args=[mission_id, schedule_id],
                    id=job_id_time,
                    name=f"Recurring: Mission {mission_id} at {time_str}",
                    replace_existing=True
                )
            
            # Calculate next execution
            next_exec = self._calculate_next_execution(days, times)
            self.db.update_schedule(schedule_id, next_execution=next_exec)
    
    def add_immediate_mission(self, mission_id: int, schedule_id: int):
        """Add mission for immediate execution"""
        logger.info(f"Adding immediate execution for mission {mission_id}")
        
        job_id = f"immediate_{mission_id}_{schedule_id}"
        
        self.scheduler.add_job(
            func=self._execute_mission,
            trigger='date',
            run_date=datetime.now() + timedelta(seconds=1),
            args=[mission_id, schedule_id],
            id=job_id,
            name=f"Immediate: Mission {mission_id}",
            replace_existing=True
        )
        
        logger.info(f"Immediate job scheduled: {job_id}")
    
    def _calculate_next_execution(self, days: list, times: list) -> datetime:
        """Calculate next execution time for recurring schedule"""
        now = datetime.now()
        current_day = now.weekday()  # 0=Monday
        current_time = now.time()
        
        # Convert to pattern format (0=Sunday)
        current_day_pattern = (current_day + 1) % 7
        
        # Find next execution
        for day_offset in range(8):  # Check next 7 days + today
            check_day = (current_day_pattern + day_offset) % 7
            
            if check_day not in days:
                continue
            
            for time_str in sorted(times):
                hour, minute = map(int, time_str.split(':'))
                exec_time = datetime.now().replace(hour=hour, minute=minute, second=0, microsecond=0)
                exec_time += timedelta(days=day_offset)
                
                if exec_time > now:
                    return exec_time
        
        # Fallback (shouldn't happen)
        return now + timedelta(days=1)
    
    def _execute_mission(self, mission_id: int, schedule_id: Optional[int] = None):
        """Execute a mission (called by scheduler)"""
        logger.info(f"Executing mission {mission_id} (schedule: {schedule_id})")
        
        try:
            # Get mission details
            mission = self.db.get_mission(mission_id)
            if not mission:
                logger.error(f"Mission {mission_id} not found")
                return
            
            # Create execution record
            execution_id = self.db.create_execution(
                mission_id=mission_id,
                execution_type='scheduled' if schedule_id else 'manual',
                schedule_id=schedule_id
            )
            
            # Update execution status to running
            self.db.update_execution(execution_id, status='running')
            
            # Send mission to ThingsBoard
            token = self.get_token()
            headers = {"X-Authorization": f"Bearer {token}"}
            
            # Build mission payload with all DJI required parameters
            payload = {
                "UAVCMD": {
                    "command": "MISSION_LOAD",
                    "parameters": {
                        "speed": mission['speed'],
                        "nadir": False,  # DJI required parameter
                        "rth": mission['rth'],
                        "photo": mission['photo'],
                        "photo_time": 0,  # DJI required parameter
                        "points": mission['waypoints']
                    }
                }
            }
            
            response = requests.post(
                f"{self.tb_api_url}",
                headers=headers,
                json=payload,
                timeout=10
            )
            
            response.raise_for_status()
            
            # Update execution as completed
            self.db.update_execution(
                execution_id, 
                status='completed',
                result={"response": response.json() if response.text else {}}
            )
            
            logger.info(f"Mission {mission_id} executed successfully")
            
            # Update schedule last_execution
            if schedule_id:
                self.db.update_schedule(schedule_id, last_execution=datetime.now())
                
                # For recurring, calculate next execution
                schedule = self.db.get_schedules_for_mission(mission_id)
                for s in schedule:
                    if s['id'] == schedule_id and s['schedule_type'] == 'recurring':
                        pattern = s['recurrence_pattern']
                        next_exec = self._calculate_next_execution(pattern['days'], pattern['times'])
                        self.db.update_schedule(schedule_id, next_execution=next_exec)
        
        except Exception as e:
            logger.error(f"Mission {mission_id} execution failed: {e}")
            if 'execution_id' in locals():
                self.db.update_execution(
                    execution_id,
                    status='failed',
                    error_message=str(e)
                )
    
    def execute_immediate(self, mission_id: int):
        """Execute mission immediately"""
        self._execute_mission(mission_id, schedule_id=None)
    
    def add_schedule(self, schedule: Dict):
        """Add new schedule to scheduler"""
        self._add_job_to_scheduler(schedule)
    
    def remove_schedule(self, schedule_id: int):
        """Remove schedule from scheduler"""
        job_id = f"schedule_{schedule_id}"
        
        # Also remove all time-based jobs for recurring
        jobs = self.scheduler.get_jobs()
        for job in jobs:
            if job.id.startswith(job_id):
                self.scheduler.remove_job(job.id)
                logger.info(f"Removed job {job.id}")
    
    def update_schedule(self, schedule_id: int):
        """Update existing schedule in scheduler"""
        # Get updated schedule from DB
        schedules = self.db.get_enabled_schedules()
        schedule = next((s for s in schedules if s['id'] == schedule_id), None)
        
        if schedule:
            self.remove_schedule(schedule_id)
            if schedule['enabled']:
                self._add_job_to_scheduler(schedule)
    
    def reload_schedules(self):
        """Reload all schedules from database"""
        logger.info("Reloading all schedules from database")
        
        # Remove all existing jobs
        jobs = self.scheduler.get_jobs()
        for job in jobs:
            self.scheduler.remove_job(job.id)
        
        # Load schedules fresh from database
        self.load_schedules()
    
    def shutdown(self):
        """Shutdown scheduler"""
        self.scheduler.shutdown()
        logger.info("Mission scheduler shutdown")
