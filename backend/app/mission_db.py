"""
Mission Database Manager
Handles mission storage and retrieval using SQLite
"""

import sqlite3
import json
from datetime import datetime
from typing import List, Dict, Optional
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class MissionDB:
    def __init__(self, db_path: str = "missions.db"):
        self.db_path = db_path
        self.init_database()
    
    def get_connection(self):
        """Get database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def init_database(self):
        """Initialize database tables"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Missions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS missions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                speed REAL DEFAULT 1.0,
                rth BOOLEAN DEFAULT 1,
                photo BOOLEAN DEFAULT 0,
                waypoints TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_by TEXT DEFAULT 'system'
            )
        """)
        
        # Mission schedules table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS mission_schedules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mission_id INTEGER NOT NULL,
                schedule_type TEXT NOT NULL,
                start_time DATETIME,
                recurrence_pattern TEXT,
                enabled BOOLEAN DEFAULT 1,
                last_execution DATETIME,
                next_execution DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_by TEXT DEFAULT 'system',
                FOREIGN KEY (mission_id) REFERENCES missions (id) ON DELETE CASCADE
            )
        """)
        
        # Mission executions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS mission_executions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mission_id INTEGER NOT NULL,
                schedule_id INTEGER,
                execution_type TEXT NOT NULL,
                started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                completed_at DATETIME,
                status TEXT DEFAULT 'pending',
                result TEXT,
                error_message TEXT,
                FOREIGN KEY (mission_id) REFERENCES missions (id),
                FOREIGN KEY (schedule_id) REFERENCES mission_schedules (id)
            )
        """)
        
        conn.commit()
        conn.close()
        logger.info(f"Database initialized at {self.db_path}")
    
    # ==================
    # MISSION CRUD
    # ==================
    
    def create_mission(self, name: str, waypoints: List[Dict], speed: float = 1.0, 
                      rth: bool = True, photo: bool = False, description: str = "", 
                      created_by: str = "system") -> int:
        """Create a new mission"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO missions (name, description, speed, rth, photo, waypoints, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (name, description, speed, rth, photo, json.dumps(waypoints), created_by))
        
        mission_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        logger.info(f"Mission created: {name} (ID: {mission_id})")
        return mission_id
    
    def get_mission(self, mission_id: int) -> Optional[Dict]:
        """Get mission by ID"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM missions WHERE id = ?", (mission_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return self._row_to_mission_dict(row)
        return None
    
    def get_all_missions(self) -> List[Dict]:
        """Get all missions"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM missions ORDER BY created_at DESC")
        rows = cursor.fetchall()
        conn.close()
        
        return [self._row_to_mission_dict(row) for row in rows]
    
    def update_mission(self, mission_id: int, **kwargs) -> bool:
        """Update mission fields"""
        allowed_fields = ['name', 'description', 'speed', 'rth', 'photo', 'waypoints']
        updates = []
        values = []
        
        for key, value in kwargs.items():
            if key in allowed_fields:
                if key == 'waypoints':
                    value = json.dumps(value)
                updates.append(f"{key} = ?")
                values.append(value)
        
        if not updates:
            return False
        
        updates.append("updated_at = CURRENT_TIMESTAMP")
        values.append(mission_id)
        
        conn = self.get_connection()
        cursor = conn.cursor()
        
        query = f"UPDATE missions SET {', '.join(updates)} WHERE id = ?"
        cursor.execute(query, values)
        
        affected = cursor.rowcount
        conn.commit()
        conn.close()
        
        logger.info(f"Mission {mission_id} updated")
        return affected > 0
    
    def delete_mission(self, mission_id: int) -> bool:
        """Delete mission (also deletes schedules and executions via CASCADE)"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM missions WHERE id = ?", (mission_id,))
        affected = cursor.rowcount
        
        conn.commit()
        conn.close()
        
        logger.info(f"Mission {mission_id} deleted")
        return affected > 0
    
    # ==================
    # SCHEDULE CRUD
    # ==================
    
    def create_schedule(self, mission_id: int, schedule_type: str, 
                       start_time: Optional[datetime] = None,
                       recurrence_pattern: Optional[Dict] = None,
                       created_by: str = "system") -> int:
        """Create mission schedule"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Handle start_time - can be datetime object or ISO string
        if start_time:
            if isinstance(start_time, str):
                start_time_str = start_time
            else:
                start_time_str = start_time.isoformat()
        else:
            start_time_str = None
        
        cursor.execute("""
            INSERT INTO mission_schedules 
            (mission_id, schedule_type, start_time, recurrence_pattern, created_by)
            VALUES (?, ?, ?, ?, ?)
        """, (
            mission_id, 
            schedule_type, 
            start_time_str,
            json.dumps(recurrence_pattern) if recurrence_pattern else None,
            created_by
        ))
        
        schedule_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        logger.info(f"Schedule created for mission {mission_id}: {schedule_type}")
        return schedule_id
    
    def get_schedules_for_mission(self, mission_id: int) -> List[Dict]:
        """Get all schedules for a mission"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM mission_schedules 
            WHERE mission_id = ? 
            ORDER BY created_at DESC
        """, (mission_id,))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [self._row_to_schedule_dict(row) for row in rows]
    
    def get_enabled_schedules(self) -> List[Dict]:
        """Get all enabled schedules"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM mission_schedules 
            WHERE enabled = 1
        """)
        
        rows = cursor.fetchall()
        conn.close()
        
        return [self._row_to_schedule_dict(row) for row in rows]
    
    def update_schedule(self, schedule_id: int, **kwargs) -> bool:
        """Update schedule"""
        allowed_fields = ['start_time', 'recurrence_pattern', 'enabled', 
                         'last_execution', 'next_execution']
        updates = []
        values = []
        
        for key, value in kwargs.items():
            if key in allowed_fields:
                if key in ['recurrence_pattern'] and value:
                    value = json.dumps(value)
                elif key in ['start_time', 'last_execution', 'next_execution'] and value:
                    value = value.isoformat() if isinstance(value, datetime) else value
                updates.append(f"{key} = ?")
                values.append(value)
        
        if not updates:
            return False
        
        values.append(schedule_id)
        
        conn = self.get_connection()
        cursor = conn.cursor()
        
        query = f"UPDATE mission_schedules SET {', '.join(updates)} WHERE id = ?"
        cursor.execute(query, values)
        
        affected = cursor.rowcount
        conn.commit()
        conn.close()
        
        return affected > 0
    
    def delete_schedule(self, schedule_id: int) -> bool:
        """Delete schedule"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM mission_schedules WHERE id = ?", (schedule_id,))
        affected = cursor.rowcount
        
        conn.commit()
        conn.close()
        
        return affected > 0
    
    # ==================
    # EXECUTION TRACKING
    # ==================
    
    def create_execution(self, mission_id: int, execution_type: str, 
                        schedule_id: Optional[int] = None) -> int:
        """Create execution record"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO mission_executions (mission_id, schedule_id, execution_type, status)
            VALUES (?, ?, ?, 'pending')
        """, (mission_id, schedule_id, execution_type))
        
        execution_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        logger.info(f"Execution created for mission {mission_id}: {execution_type}")
        return execution_id
    
    def update_execution(self, execution_id: int, status: str, 
                        result: Optional[Dict] = None, 
                        error_message: Optional[str] = None) -> bool:
        """Update execution status"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        completed_at = datetime.now().isoformat() if status in ['completed', 'failed', 'cancelled'] else None
        
        cursor.execute("""
            UPDATE mission_executions 
            SET status = ?, completed_at = ?, result = ?, error_message = ?
            WHERE id = ?
        """, (status, completed_at, json.dumps(result) if result else None, error_message, execution_id))
        
        affected = cursor.rowcount
        conn.commit()
        conn.close()
        
        return affected > 0
    
    def get_executions(self, mission_id: Optional[int] = None, limit: int = 50) -> List[Dict]:
        """Get execution history"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        if mission_id:
            cursor.execute("""
                SELECT * FROM mission_executions 
                WHERE mission_id = ? 
                ORDER BY started_at DESC 
                LIMIT ?
            """, (mission_id, limit))
        else:
            cursor.execute("""
                SELECT * FROM mission_executions 
                ORDER BY started_at DESC 
                LIMIT ?
            """, (limit,))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [self._row_to_execution_dict(row) for row in rows]
    
    # ==================
    # HELPER METHODS
    # ==================
    
    def _row_to_mission_dict(self, row) -> Dict:
        """Convert database row to mission dict"""
        return {
            "id": row["id"],
            "name": row["name"],
            "description": row["description"],
            "speed": row["speed"],
            "rth": bool(row["rth"]),
            "photo": bool(row["photo"]),
            "waypoints": json.loads(row["waypoints"]),
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
            "created_by": row["created_by"]
        }
    
    def _row_to_schedule_dict(self, row) -> Dict:
        """Convert database row to schedule dict"""
        return {
            "id": row["id"],
            "mission_id": row["mission_id"],
            "schedule_type": row["schedule_type"],
            "start_time": row["start_time"],
            "recurrence_pattern": json.loads(row["recurrence_pattern"]) if row["recurrence_pattern"] else None,
            "enabled": bool(row["enabled"]),
            "last_execution": row["last_execution"],
            "next_execution": row["next_execution"],
            "created_at": row["created_at"],
            "created_by": row["created_by"]
        }
    
    def _row_to_execution_dict(self, row) -> Dict:
        """Convert database row to execution dict"""
        return {
            "id": row["id"],
            "mission_id": row["mission_id"],
            "schedule_id": row["schedule_id"],
            "execution_type": row["execution_type"],
            "started_at": row["started_at"],
            "completed_at": row["completed_at"],
            "status": row["status"],
            "result": json.loads(row["result"]) if row["result"] else None,
            "error_message": row["error_message"]
        }
