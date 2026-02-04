from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- Shared Models ---
class Waypoint(BaseModel):
    lat: float
    lon: float
    alt: float

class RecurrencePattern(BaseModel):
    pattern: str = "daily" # o 'weekly'
    days: List[int] # 0=Domenica, 1=Lunedi... (o viceversa, standardizziamo a 0=Lunedi come python)
    times: List[str] # ["08:00", "16:00"]

# --- Mission Schemas ---
class MissionBase(BaseModel):
    name: str
    description: Optional[str] = ""
    speed: float = 1.0
    rth: bool = True
    photo: bool = False
    waypoints: List[Waypoint]

class MissionCreate(MissionBase):
    pass

# QUESTA È LA CLASSE CHE MANCAVA
class MissionResponse(MissionBase):
    id: int
    created_at: datetime
    # Configurazione Pydantic V2 per leggere da oggetti SQLAlchemy
    model_config = ConfigDict(from_attributes=True)

# --- Schedule Schemas ---
class ScheduleCreate(BaseModel):
    schedule_type: str # 'once', 'recurring', 'immediate'
    start_time: Optional[datetime] = None
    recurrence_pattern: Optional[RecurrencePattern] = None
    enabled: bool = True

class ScheduleResponse(ScheduleCreate):
    id: int
    mission_id: int
    last_execution: Optional[datetime] = None
    next_execution: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

# --- Execution Schemas ---
class ExecutionResponse(BaseModel):
    id: int
    mission_id: int
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    result: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)