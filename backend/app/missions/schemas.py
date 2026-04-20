"""
file: app/missions/schemas.py
"""
from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional, Any
from datetime import datetime
from enum import Enum


# ======================
# COMPONENTI BASE
# ======================
class Waypoint(BaseModel):
    lat: float
    lon: float
    alt: float
    heading: Optional[float] = 0.0
    tilt_gimbal: Optional[float] = 0.0
    hover: Optional[int] = 0  # Tempo di sosta in secondi ad ogni waypoint raggiunto

class RecurrencePattern(BaseModel):
    days: List[int] = []  # 0=Lun, 6=Dom. Vuoto = Tutti i giorni
    times: List[str]      # ["08:00", "14:30"]
    
class ScheduleType(str, Enum):
    ONCE = "once"
    RECURRING = "recurring"


# ======================
# MISSIONI
# ======================
class MissionBase(BaseModel):
    name: str
    description: Optional[str] = ""
    speed: float = Field(default=1.0, gt=0)
    rth: bool = True
    nadir: bool = False
    photo: bool = False
    photo_time: int = Field(default=0, ge=0)
    waypoints: List[Waypoint]

class MissionCreate(MissionBase):
    pass

class MissionResponse(MissionBase):
    id: int
    created_at: datetime
    created_by: str
    model_config = ConfigDict(from_attributes=True)


# ======================
# SCHEDULING
# ======================
class ScheduleCreate(BaseModel):
    dock_name: str = "DOCK1"
    schedule_type: ScheduleType = Field(..., description="Tipo di programma: 'once' o 'recurring'")
    start_time: Optional[datetime] = None
    recurrence_pattern: Optional[RecurrencePattern] = None
    enabled: bool = True

class ScheduleResponse(ScheduleCreate):
    id: int
    mission_id: int
    last_execution: Optional[datetime] = None
    next_execution: Optional[datetime] = None
    mission: Optional[MissionResponse] = None
    model_config = ConfigDict(from_attributes=True)


# ======================
# ESECUZIONI
# ======================
class ExecutionResponse(BaseModel):
    id: int
    mission_id: int
    schedule_id: Optional[int] = None
    dock_name: str
    execution_type: str
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    result: Optional[Any] = None
    error_message: Optional[str] = None
    mission: Optional[MissionResponse] = None
    model_config = ConfigDict(from_attributes=True)