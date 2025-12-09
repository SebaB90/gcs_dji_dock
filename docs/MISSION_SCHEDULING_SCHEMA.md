# Mission Storage and Scheduling Schema

## Database Schema (SQLite)

### missions table
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- name: TEXT NOT NULL
- description: TEXT
- speed: REAL
- rth: BOOLEAN (return to home)
- photo: BOOLEAN
- waypoints: JSON (array of {lat, lon, alt})
- created_at: DATETIME
- updated_at: DATETIME
- created_by: TEXT (username)

### mission_schedules table
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- mission_id: INTEGER FOREIGN KEY
- schedule_type: TEXT ('immediate', 'once', 'recurring')
- start_time: DATETIME (for 'once' and 'recurring')
- recurrence_pattern: JSON (for 'recurring': {days: [0-6], times: ["HH:MM", ...]})
- enabled: BOOLEAN
- last_execution: DATETIME
- next_execution: DATETIME
- created_at: DATETIME
- created_by: TEXT

### mission_executions table
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- mission_id: INTEGER FOREIGN KEY
- schedule_id: INTEGER FOREIGN KEY (nullable for manual)
- execution_type: TEXT ('manual', 'scheduled')
- started_at: DATETIME
- completed_at: DATETIME
- status: TEXT ('pending', 'running', 'completed', 'failed', 'cancelled')
- result: JSON
- error_message: TEXT

## API Endpoints

### Mission CRUD
- POST /missions - Create new mission
- GET /missions - List all missions
- GET /missions/{id} - Get mission details
- PUT /missions/{id} - Update mission
- DELETE /missions/{id} - Delete mission

### Mission Execution
- POST /missions/{id}/execute - Execute immediately
- GET /missions/{id}/executions - Get execution history

### Mission Scheduling
- POST /missions/{id}/schedules - Create schedule
- GET /missions/{id}/schedules - List schedules for mission
- PUT /schedules/{id} - Update schedule
- DELETE /schedules/{id} - Delete schedule
- POST /schedules/{id}/enable - Enable schedule
- POST /schedules/{id}/disable - Disable schedule

### Monitoring
- GET /executions - List all executions (with filters)
- GET /executions/{id} - Get execution details
- GET /schedules/upcoming - Get upcoming scheduled missions

## Recurrence Pattern Examples

```json
{
  "days": [1, 2, 3, 4, 5],  // Monday-Friday
  "times": ["08:00", "12:00", "17:00"]  // 3 times per day
}

{
  "days": [0, 6],  // Sunday and Saturday
  "times": ["10:00"]  // Once per day
}

{
  "days": [0, 1, 2, 3, 4, 5, 6],  // Every day
  "times": ["06:00", "18:00"]  // Twice daily
}
```
