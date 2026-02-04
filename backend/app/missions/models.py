from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.core import Base

class Mission(Base):
    __tablename__ = "missions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    speed = Column(Float, default=1.0)
    rth = Column(Boolean, default=True)
    photo = Column(Boolean, default=False)
    
    # SQLAlchemy gestisce automaticamente la conversione Dict <-> JSON
    waypoints = Column(JSON, nullable=False) 
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String, default="system")

    # Relazioni
    # cascade="all, delete-orphan" significa che se cancelli la missione, 
    # si cancellano anche le schedulazioni associate.
    schedules = relationship("MissionSchedule", back_populates="mission", cascade="all, delete-orphan")
    executions = relationship("MissionExecution", back_populates="mission")


class MissionSchedule(Base):
    __tablename__ = "mission_schedules"

    id = Column(Integer, primary_key=True, index=True)
    mission_id = Column(Integer, ForeignKey("missions.id"), nullable=False)
    
    schedule_type = Column(String, nullable=False) # 'once', 'recurring'
    start_time = Column(DateTime, nullable=True)
    
    # Esempio JSON: {"days": [0, 2], "times": ["10:00"]}
    recurrence_pattern = Column(JSON, nullable=True) 
    
    enabled = Column(Boolean, default=True)
    last_execution = Column(DateTime, nullable=True)
    next_execution = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relazioni
    mission = relationship("Mission", back_populates="schedules")
    executions = relationship("MissionExecution", back_populates="schedule")


class MissionExecution(Base):
    __tablename__ = "mission_executions"

    id = Column(Integer, primary_key=True, index=True)
    mission_id = Column(Integer, ForeignKey("missions.id"), nullable=False)
    schedule_id = Column(Integer, ForeignKey("mission_schedules.id"), nullable=True)
    
    execution_type = Column(String, nullable=False) # 'manual', 'scheduled'
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    status = Column(String, default="pending") # pending, running, completed, failed
    
    # Salviamo la risposta di ThingsBoard o errori qui
    result = Column(JSON, nullable=True)
    error_message = Column(String, nullable=True)

    # Relazioni
    mission = relationship("Mission", back_populates="executions")
    schedule = relationship("MissionSchedule", back_populates="executions")