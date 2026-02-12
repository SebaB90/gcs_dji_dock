"""
file: app/missions/models.py
"""
from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.core import Base


class Mission(Base):
    __tablename__ = "missions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    
    # --- Parametri di Volo per API ADPM ---
    speed = Column(Float, default=1.0)          # m/s
    rth = Column(Boolean, default=True)         # Return To Home a fine missione
    nadir = Column(Boolean, default=False)      # Gimbal -90° fisso
    photo = Column(Boolean, default=False)      # Scatto foto ai waypoint
    photo_time = Column(Integer, default=0)     # Tempo di attesa per foto (sec)
    
    # Waypoints: [{lat, lon, alt, heading, tilt_gimbal}, ...]
    waypoints = Column(JSON, nullable=False) 
    
    created_at = Column(DateTime, default=datetime.now)
    created_by = Column(String, default="system")

    # Relazioni
    schedules = relationship("MissionSchedule", back_populates="mission", cascade="all, delete-orphan")
    executions = relationship("MissionExecution", back_populates="mission")


class MissionSchedule(Base):
    __tablename__ = "mission_schedules"

    id = Column(Integer, primary_key=True, index=True)
    mission_id = Column(Integer, ForeignKey("missions.id"), nullable=False)
    
    # Su quale dock deve girare? (es. "DOCK1", "DOCK2")
    dock_name = Column(String, default="DOCK1", nullable=False)

    schedule_type = Column(String, nullable=False) # 'once', 'recurring'
    start_time = Column(DateTime, nullable=True)
    
    # Pattern ricorrenza: {"days": [0,1], "times": ["08:00"]}
    recurrence_pattern = Column(JSON, nullable=True) 
    
    enabled = Column(Boolean, default=True)
    last_execution = Column(DateTime, nullable=True)
    next_execution = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.now)

    # Relazioni
    mission = relationship("Mission", back_populates="schedules")
    executions = relationship("MissionExecution", back_populates="schedule")


class MissionExecution(Base):
    __tablename__ = "mission_executions"

    id = Column(Integer, primary_key=True, index=True)
    mission_id = Column(Integer, ForeignKey("missions.id"), nullable=False)
    schedule_id = Column(Integer, ForeignKey("mission_schedules.id"), nullable=True)
    
    # Su quale dock è stata lanciata questa specifica esecuzione
    dock_name = Column(String, nullable=False)
    
    execution_type = Column(String, nullable=False) # 'manual', 'scheduled'
    status = Column(String, default="pending")      # pending, sent_to_tb, running, completed, failed
    
    started_at = Column(DateTime, default=datetime.now)
    completed_at = Column(DateTime, nullable=True)
    
    # Log risultati
    result = Column(JSON, nullable=True)            # Risposta JSON da ThingsBoard
    error_message = Column(String, nullable=True)

    # Relazioni
    mission = relationship("Mission", back_populates="executions")
    schedule = relationship("MissionSchedule", back_populates="executions")