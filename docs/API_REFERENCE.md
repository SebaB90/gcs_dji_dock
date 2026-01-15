# Mission Scheduling API Documentation

Complete API reference for mission management and scheduling features.

## Overview

The mission scheduling system allows you to:
- Create and save missions for future use
- Execute missions immediately
- Schedule missions for specific times (one-time)
- Set up recurring mission schedules (daily, weekly, monthly)
- Track mission execution history

All endpoints require JWT authentication via Bearer token.

---

## Base URL

```
http://localhost:8000
```

---

## Authentication

All mission endpoints require a valid JWT token obtained from `/login`.

Include the token in the Authorization header:
```
Authorization: Bearer <your-token>
```

---

## Mission Management Endpoints

### Create Mission

**POST** `/api/missions`

Create a new mission and save it to the database.

**Request Body:**
```json
{
  "name": "Warehouse Inspection North",
  "waypoints": [
    {"lat": 44.5721534, "lon": 11.2514301, "alt": 25},
    {"lat": 44.5721970, "lon": 11.2514373, "alt": 25},
    {"lat": 44.5722105, "lon": 11.2515108, "alt": 25}
  ],
  "speed": 1.2,
  "rth": true,
  "photo": true
}
```

**Response:**
```json
{
  "status": "success",
  "mission_id": 1,
  "message": "Mission 'Warehouse Inspection North' created successfully"
}
```

---

### List All Missions

**GET** `/api/missions`

Retrieve all saved missions from the database.

**Response:**
```json
{
  "status": "success",
  "missions": [
    {
      "id": 1,
      "name": "Warehouse Inspection North",
      "waypoints": [...],
      "speed": 1.2,
      "rth": true,
      "photo": true,
      "created_at": "2025-12-06T12:30:00",
      "updated_at": "2025-12-06T12:30:00"
    }
  ]
}
```

---

### Get Mission Details

**GET** `/api/missions/{mission_id}`

Get details of a specific mission.

**Response:**
```json
{
  "status": "success",
  "mission": {
    "id": 1,
    "name": "Warehouse Inspection North",
    "waypoints": [...],
    "speed": 1.2,
    "rth": true,
    "photo": true,
    "created_at": "2025-12-06T12:30:00",
    "updated_at": "2025-12-06T12:30:00"
  }
}
```

---

### Update Mission

**PUT** `/api/missions/{mission_id}`

Update an existing mission.

**Request Body:** (Same as Create Mission)

**Response:**
```json
{
  "status": "success",
  "message": "Mission 'Warehouse Inspection North' updated successfully"
}
```

---

### Delete Mission

**DELETE** `/api/missions/{mission_id}`

Delete a mission and all its schedules.

**Response:**
```json
{
  "status": "success",
  "message": "Mission deleted successfully"
}
```

---

## Mission Execution Endpoints

### Execute Mission Immediately

**POST** `/api/missions/{mission_id}/execute`

Execute a mission immediately (as soon as possible).

**Response:**
```json
{
  "status": "success",
  "message": "Mission 'Warehouse Inspection North' scheduled for immediate execution",
  "schedule_id": 5
}
```

---

## Schedule Management Endpoints

### Create Mission Schedule

**POST** `/api/missions/{mission_id}/schedules`

Create a schedule for a mission (one-time or recurring).

**Request Body - One-Time Schedule:**
```json
{
  "schedule_type": "once",
  "start_time": "2025-12-07T08:00:00",
  "enabled": true
}
```

**Request Body - Recurring Daily:**
```json
{
  "schedule_type": "recurring",
  "start_time": "2025-12-06T08:00:00",
  "recurrence_pattern": "daily",
  "recurrence_value": "08:00,14:00,20:00",
  "enabled": true
}
```

**Request Body - Recurring Weekly:**
```json
{
  "schedule_type": "recurring",
  "start_time": "2025-12-06T08:00:00",
  "recurrence_pattern": "weekly",
  "recurrence_value": "Mon,Wed,Fri:08:00,14:00",
  "enabled": true
}
```

**Response:**
```json
{
  "status": "success",
  "schedule_id": 3,
  "message": "Schedule created for mission 'Warehouse Inspection North'"
}
```

---

### Get Mission Schedules

**GET** `/api/missions/{mission_id}/schedules`

Get all schedules for a specific mission.

**Response:**
```json
{
  "status": "success",
  "schedules": [
    {
      "id": 1,
      "mission_id": 1,
      "schedule_type": "recurring",
      "start_time": "2025-12-06T08:00:00",
      "recurrence_pattern": "daily",
      "recurrence_value": "08:00,14:00,20:00",
      "enabled": true,
      "next_execution": "2025-12-06T14:00:00",
      "created_at": "2025-12-06T12:00:00"
    }
  ]
}
```

---

### Update Schedule

**PUT** `/api/schedules/{schedule_id}`

Update an existing schedule.

**Request Body:** (Same as Create Schedule)

**Response:**
```json
{
  "status": "success",
  "message": "Schedule updated successfully"
}
```

---

### Delete Schedule

**DELETE** `/api/schedules/{schedule_id}`

Delete a schedule.

**Response:**
```json
{
  "status": "success",
  "message": "Schedule deleted successfully"
}
```

---

## Execution History Endpoints

### Get Execution History

**GET** `/api/executions?mission_id={mission_id}&limit={limit}`

Get mission execution history.

**Query Parameters:**
- `mission_id` (optional): Filter by specific mission ID
- `limit` (optional, default=50): Maximum number of records

**Response:**
```json
{
  "status": "success",
  "executions": [
    {
      "id": 1,
      "mission_id": 1,
      "schedule_id": 1,
      "status": "completed",
      "started_at": "2025-12-06T08:00:00",
      "completed_at": "2025-12-06T08:15:32",
      "error_message": null
    },
    {
      "id": 2,
      "mission_id": 1,
      "schedule_id": 1,
      "status": "failed",
      "started_at": "2025-12-06T14:00:00",
      "completed_at": "2025-12-06T14:02:15",
      "error_message": "Connection timeout to ThingsBoard"
    }
  ]
}
```

---

## Recurrence Patterns

### Daily Recurrence

Execute multiple times per day at specific times.

**Pattern:** `daily`

**Value Format:** `HH:MM,HH:MM,HH:MM`

**Example:**
```json
{
  "recurrence_pattern": "daily",
  "recurrence_value": "08:00,12:00,18:00"
}
```
Executes at 8:00 AM, 12:00 PM, and 6:00 PM every day.

---

### Weekly Recurrence

Execute on specific days of the week at specific times.

**Pattern:** `weekly`

**Value Format:** `Day,Day,Day:HH:MM,HH:MM`

**Days:** `Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`, `Sun`

**Example:**
```json
{
  "recurrence_pattern": "weekly",
  "recurrence_value": "Mon,Wed,Fri:08:00,16:00"
}
```
Executes on Monday, Wednesday, and Friday at 8:00 AM and 4:00 PM.

---

### Monthly Recurrence

Execute on specific days of the month at specific times.

**Pattern:** `monthly`

**Value Format:** `day,day,day:HH:MM,HH:MM`

**Example:**
```json
{
  "recurrence_pattern": "monthly",
  "recurrence_value": "1,15:09:00"
}
```
Executes on the 1st and 15th of each month at 9:00 AM.

---

## Error Responses

All endpoints return standard error responses:

### 400 Bad Request
```json
{
  "detail": "Invalid schedule_type. Use 'once' or 'recurring'"
}
```

### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials"
}
```

### 404 Not Found
```json
{
  "detail": "Mission not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Error creating mission: Database connection failed"
}
```

---

## Complete Workflow Example

### 1. Create a Mission

```bash
curl -X POST http://localhost:8000/api/missions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Daily Perimeter Check",
    "waypoints": [
      {"lat": 44.572, "lon": 11.251, "alt": 30},
      {"lat": 44.573, "lon": 11.252, "alt": 30}
    ],
    "speed": 1.5,
    "rth": true,
    "photo": true
  }'
```

Response: `{"mission_id": 1}`

---

### 2. Schedule for Daily Execution

```bash
curl -X POST http://localhost:8000/api/missions/1/schedules \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "schedule_type": "recurring",
    "start_time": "2025-12-06T06:00:00",
    "recurrence_pattern": "daily",
    "recurrence_value": "06:00,18:00",
    "enabled": true
  }'
```

Response: `{"schedule_id": 1}`

---

### 3. Execute Immediately (Test)

```bash
curl -X POST http://localhost:8000/api/missions/1/execute \
  -H "Authorization: Bearer <token>"
```

---

### 4. Check Execution History

```bash
curl -X GET "http://localhost:8000/api/executions?mission_id=1" \
  -H "Authorization: Bearer <token>"
```

---

## Notes

1. **Time Format**: All times use ISO 8601 format: `YYYY-MM-DDTHH:MM:SS`
2. **Timezone**: All times are in server local timezone
3. **Schedule Types**: Only `immediate`, `once`, and `recurring` are supported
4. **Recurrence Patterns**: `daily`, `weekly`, `monthly`, `custom`
5. **Database**: Missions stored in SQLite database (`missions.db`)
6. **Scheduler**: Uses APScheduler for reliable execution
7. **ThingsBoard Integration**: Missions sent to ThingsBoard via shared attributes

---

## Database Schema

See [MISSION_SCHEDULING_SCHEMA.md](MISSION_SCHEDULING_SCHEMA.md) for complete database schema documentation.
