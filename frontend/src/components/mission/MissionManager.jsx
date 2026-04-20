import { useState, useEffect } from "react";
import axios from "axios";
import MiniMap from "../map/MiniMap";
import missionService from "../../services/mission.service";
import "./MissionManager.css";

export default function MissionManager({
  waypoints,
  setWaypoints,
  mapCenter,
  dronePos,
  dockPos,
  backendUrl,
}) {
  const [altitude, setAltitude] = useState(25);
  const [heading, setHeading] = useState(0);
  const [tiltGimbal, setTiltGimbal] = useState(0);
  const [hover, setHover] = useState(0);
  const [activeTab, setActiveTab] = useState("create");
  
  // Mission parameters
  const [missionName, setMissionName] = useState("");
  const [missionSpeed, setMissionSpeed] = useState(1.5);
  const [missionRTH, setMissionRTH] = useState(true);
  const [missionPhoto, setMissionPhoto] = useState(true);

  // Saved missions
  const [missions, setMissions] = useState([]);
  const [selectedMission, setSelectedMission] = useState(null);
  const [editingMission, setEditingMission] = useState(null);
  
  // Scheduling
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleType, setScheduleType] = useState("immediate");
  const [scheduleDateTime, setScheduleDateTime] = useState("");
  const [recurrenceTimes, setRecurrenceTimes] = useState(["08:00"]);
  const [recurrenceDays, setRecurrenceDays] = useState(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]); // All days by default
  const [selectedMissionForSchedule, setSelectedMissionForSchedule] = useState(null);
  
  // Execution history
  const [executions, setExecutions] = useState([]);
  const [showExecutions, setShowExecutions] = useState(false);
  
  // Schedules
  const [schedules, setSchedules] = useState([]);

  // Load saved missions on component mount
  useEffect(() => {
    loadMissions();
  }, [backendUrl]);

  const loadMissions = async () => {
    try {
      const data = await missionService.getMissions();
      setMissions(data);
    } catch (err) {
      console.warn("⚠️ Could not load missions:", err);
    }
  };

  const loadExecutionHistory = async (missionId = null) => {
    try {
      const data = await missionService.getExecutionHistory({ limit: 50 });
      setExecutions(data);
      setShowExecutions(true);
    } catch (err) {
      console.error("❌ Error loading execution history:", err);
    }
  };

  const loadSchedules = async () => {
    try {
      const data = await missionService.getSchedules();
      // Backend returns array directly (ordered by next execution)
      setSchedules(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Error loading schedules:", err);
    }
  };

  const deleteSchedule = async (scheduleId) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;

    try {
      await missionService.deleteSchedule(scheduleId);
      alert("✅ Schedule deleted");
      loadSchedules();
    } catch (err) {
      console.error("❌ Error deleting schedule:", err);
      const errorMsg = err.response?.data?.detail || err.message || "Unknown error";
      alert(`❌ Error deleting schedule: ${errorMsg}`);
    }
  };

  const toggleSchedule = async (scheduleId, currentStatus) => {
    alert("⚠️ Toggle schedule feature not implemented in backend");
    return;
    /* Backend endpoint not available
    try {
      const token = localStorage.getItem("gcs_token");
      await axios.patch(
        `${backendUrl}/api/schedules/${scheduleId}`,
        { enabled: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`✅ Schedule ${!currentStatus ? 'enabled' : 'disabled'}`);
      loadSchedules();
    } catch (err) {
      console.error("❌ Error updating schedule:", err);
      const errorMsg = err.response?.data?.detail || err.message || "Unknown error";
      alert(`❌ Error updating schedule: ${errorMsg}`);
    }
    */
  };

  const addWaypoint = (e) => {
    e.stopPropagation();
    const currentAlt = Number(altitude);

    // Use map center if available, otherwise fallback to default logic
    const centerLat = mapCenter?.[0] ?? dronePos?.[0] ?? dockPos?.[0] ?? 44.5721;
    const centerLon = mapCenter?.[1] ?? dronePos?.[1] ?? dockPos?.[1] ?? 11.2514;

    const newWp = {
      lat: centerLat,
      lon: centerLon,
      alt: currentAlt,
      heading: Number(heading),
      tilt_gimbal: Number(tiltGimbal),
      hover: Number(hover),
    };
    setWaypoints((prev) => [...prev, newWp]);
  };

  const removeLast = (e) => {
    e.stopPropagation();
    if (waypoints.length > 0) setWaypoints(waypoints.slice(0, -1));
  };

  const clearAll = (e) => {
    e.stopPropagation();
    setWaypoints([]);
    setMissionName("");
  };

  const saveMission = async (e) => {
    e.stopPropagation();
    if (!missionName.trim()) {
      alert("⚠️ Please enter a mission name");
      return;
    }
    if (waypoints.length === 0) {
      alert("⚠️ Add at least one waypoint");
      return;
    }

    try {
      const missionData = {
        name: missionName,
        description: "",
        waypoints: waypoints,
        speed: missionSpeed,
        rth: missionRTH,
        nadir: false,
        photo: missionPhoto,
        photo_time: 0
      };

      // Create new mission
      await missionService.createMission(missionData);
      alert(`✅ Mission "${missionName}" created successfully!`);
      setEditingMission(null);
      
      loadMissions();
      setMissionName("");
      setWaypoints([]);
    } catch (err) {
      console.error("❌ Error saving mission:", err);
      const errorMsg = err.response?.data?.detail || err.message || "Unknown error";
      alert(`❌ Error saving mission: ${errorMsg}`);
    }
  };

  const sendMissionNow = async (e) => {
    e.stopPropagation();
    if (waypoints.length === 0) {
      alert("⚠️ Add at least one waypoint before sending");
      return;
    }

    try {
      const mission = {
        UAVCMD: {
          command: "MISSION_LOAD",
          parameters: {
            speed: missionSpeed,
            nadir: false,
            rth: missionRTH,
            photo: missionPhoto,
            photo_time: 0,
            points: waypoints.map((wp) => ({
              lat: wp.lat,
              lon: wp.lon,
              alt: wp.alt,
              heading: wp.heading || 0,
              tilt_gimbal: wp.tilt_gimbal || 0,
              hover: wp.hover || 0,
            })),
          },
        },
      };

      const token = localStorage.getItem("gcs_token");
      const res = await axios.post(`${backendUrl}/mission`, mission, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.status === "ok") {
        alert("✅ Mission sent to drone!");
      }
    } catch (err) {
      console.error("❌ Error sending mission:", err);
      const errorMsg = err.response?.data?.detail || err.message || "Unknown error";
      alert(`❌ Error sending mission: ${errorMsg}`);
    }
  };

  const executeStoredMission = async (missionId, dockName = "dock1") => {
    if (!confirm("Execute this mission immediately?")) return;

    try {
      const result = await missionService.executeMission(missionId, dockName);
      alert(`✅ ${result.message}`);
    } catch (err) {
      console.error("❌ Error executing mission:", err);
      const errorMsg = err.response?.data?.detail || err.message || "Unknown error";
      alert(`❌ Error executing mission: ${errorMsg}`);
    }
  };

  const openScheduleModal = (mission) => {
    setSelectedMissionForSchedule(mission);
    setShowScheduleModal(true);
    setScheduleType("immediate");
  };

  const createSchedule = async () => {
    if (!selectedMissionForSchedule) return;

    try {
      // Handle immediate execution separately
      if (scheduleType === "immediate") {
        const result = await missionService.executeMission(
          selectedMissionForSchedule.id,
          "dock1"
        );
        alert(`✅ ${result.message}`);
        setShowScheduleModal(false);
        return;
      }

      // Handle scheduled missions (once or recurring)
      let scheduleData = {
        dock_name: "dock1", // Default dock
        schedule_type: scheduleType,
        enabled: true
      };

      if (scheduleType === "once") {
        if (!scheduleDateTime) {
          alert("⚠️ Please select date and time");
          return;
        }
        // Convert local datetime to ISO string without timezone conversion
        // datetime-local returns "YYYY-MM-DDTHH:mm" in local time
        // We need to preserve the user's intended time, not convert to UTC
        const localDate = new Date(scheduleDateTime);
        // Get timezone offset in minutes and convert to milliseconds
        const timezoneOffset = localDate.getTimezoneOffset() * 60000;
        // Adjust the date by the timezone offset to compensate for toISOString() UTC conversion
        const adjustedDate = new Date(localDate.getTime() - timezoneOffset);
        scheduleData.start_time = adjustedDate.toISOString();
      } else if (scheduleType === "recurring") {
        if (recurrenceTimes.length === 0) {
          alert("⚠️ Please add at least one execution time");
          return;
        }

        // Map day names to numbers: Mon=0, Sun=6
        const dayMap = {"Mon": 0, "Tue": 1, "Wed": 2, "Thu": 3, "Fri": 4, "Sat": 5, "Sun": 6};
        const dayNumbers = recurrenceDays.map(day => dayMap[day]);

        scheduleData.schedule_type = "recurring";
        scheduleData.recurrence_pattern = {
          days: dayNumbers,
          times: recurrenceTimes
        };
        scheduleData.start_time = new Date().toISOString();
      }

      await missionService.scheduleMission(
        selectedMissionForSchedule.id,
        scheduleData
      );

      alert(`✅ Mission scheduled successfully!`);
      setShowScheduleModal(false);
      loadSchedules();
    } catch (err) {
      console.error("❌ Error creating schedule:", err);
      const errorMsg = err.response?.data?.detail || err.message || "Unknown error";
      alert(`❌ Error creating schedule: ${errorMsg}`);
    }
  };

  const deleteMission = async (missionId) => {
    if (!confirm("Are you sure you want to delete this mission?")) return;

    try {
      await missionService.deleteMission(missionId);
      alert("✅ Mission deleted");
      loadMissions();
    } catch (err) {
      console.error("❌ Error deleting mission:", err);
      const errorMsg = err.response?.data?.detail || err.message || "Unknown error";
      alert(`❌ Error deleting mission: ${errorMsg}`);
    }
  };

  const loadMissionToEditor = (mission) => {
    setMissionName(mission.name);
    setWaypoints(mission.waypoints);
    setMissionSpeed(mission.speed);
    setEditingMission(mission);
    setActiveTab("create");
  };

  const addRecurrenceTime = () => {
    setRecurrenceTimes([...recurrenceTimes, "12:00"]);
  };

  const removeRecurrenceTime = (index) => {
    setRecurrenceTimes(recurrenceTimes.filter((_, i) => i !== index));
  };

  const toggleDay = (day) => {
    if (recurrenceDays.includes(day)) {
      setRecurrenceDays(recurrenceDays.filter(d => d !== day));
    } else {
      setRecurrenceDays([...recurrenceDays, day]);
    }
  };

  const handleInputClick = (e) => e.stopPropagation();

  return (
    <div className="mission-manager-content" onClick={handleInputClick}>
      <div className="mission-tabs">
        <button
          className={activeTab === "create" ? "active" : ""}
          onClick={() => setActiveTab("create")}
        >
          ✏️ Create
        </button>
        <button
          className={activeTab === "library" ? "active" : ""}
          onClick={() => setActiveTab("library")}
        >
          📚 Library
        </button>
        <button
          className={activeTab === "schedules" ? "active" : ""}
          onClick={() => {
            setActiveTab("schedules");
            loadSchedules();
          }}
        >
          ⏰ Schedules
        </button>
        <button
          className={activeTab === "history" ? "active" : ""}
          onClick={() => {
            setActiveTab("history");
            loadExecutionHistory();
          }}
        >
          📊 History
        </button>
      </div>

      {/* CREATE TAB */}
      {activeTab === "create" && (
        <div className="mission-create">
          <div className="mission-params">
            <label htmlFor="mission-name">Mission Name:</label>
            <input
              id="mission-name"
              type="text"
              placeholder="e.g., Daily Perimeter Check"
              value={missionName}
              onChange={(e) => setMissionName(e.target.value)}
            />

            <div className="params-grid">
              <div>
                <label htmlFor="alt-input">Default Alt (m):</label>
                <input
                  id="alt-input"
                  type="number"
                  min="1"
                  max="25"
                  step="1"
                  value={altitude}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setAltitude(val > 25 ? 25 : val);
                  }}
                />
              </div>
              <div>
                <label htmlFor="heading-input">Heading (°):</label>
                <input
                  id="heading-input"
                  type="number"
                  min="-180"
                  max="180"
                  step="1"
                  value={heading}
                  onChange={(e) => setHeading(Number(e.target.value))}
                />
              </div>
              <div>
                <label htmlFor="tilt-input">Gimbal Tilt (°):</label>
                <input
                  id="tilt-input"
                  type="number"
                  min="-90"
                  max="90"
                  step="1"
                  value={tiltGimbal}
                  onChange={(e) => setTiltGimbal(Number(e.target.value))}
                />
              </div>
              <div>
                <label htmlFor="speed-input">Speed (m/s):</label>
                <input
                  id="speed-input"
                  type="number"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={missionSpeed}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMissionSpeed(val > 2 ? 2 : val);
                  }}
                />
              </div>
              <div>
                <label htmlFor="hover-input">Hover Time (s):</label>
                <input
                  id="hover-input"
                  type="number"
                  min="0"
                  max="60"
                  step="1"
                  value={hover}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setHover(val > 60 ? 60 : (val < 0 ? 0 : val));
                  }}
                />
              </div>
            </div>
          </div>

          <div className="wp-list">
            <label>Waypoints ({waypoints.length}):</label>
            {waypoints.length === 0 ? (
              <p className="no-wp">No waypoints. Add one or click on the map.</p>
            ) : (
              waypoints.map((wp, i) => (
                <div key={i} className="wp-item">
                  <strong>WP{i + 1}</strong>
                  <span>
                    {wp.lat.toFixed(5)}, {wp.lon.toFixed(5)}
                  </span>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <label style={{ fontSize: '10px' }}>Alt:</label>
                    <input
                      type="number"
                      min="1"
                      max="25"
                      value={wp.alt}
                      onClick={handleInputClick}
                      onChange={(e) => {
                        const updated = [...waypoints];
                        const val = e.target.value === '' ? '' : Number(e.target.value);
                        updated[i].alt = val === '' ? '' : (val > 25 ? 25 : val);
                        setWaypoints(updated);
                      }}
                      onBlur={(e) => {
                        if (e.target.value === '') {
                          const updated = [...waypoints];
                          updated[i].alt = 1;
                          setWaypoints(updated);
                        }
                      }}
                      style={{ width: '50px' }}
                    />
                    <label style={{ fontSize: '10px' }}>Head:</label>
                    <input
                      type="number"
                      min="-180"
                      max="180"
                      value={wp.heading || 0}
                      onClick={handleInputClick}
                      onChange={(e) => {
                        const updated = [...waypoints];
                        updated[i].heading = e.target.value === '' ? '' : Number(e.target.value);
                        setWaypoints(updated);
                      }}
                      onBlur={(e) => {
                        if (e.target.value === '') {
                          const updated = [...waypoints];
                          updated[i].heading = 0;
                          setWaypoints(updated);
                        }
                      }}
                      style={{ width: '50px' }}
                    />
                    <label style={{ fontSize: '10px' }}>Tilt:</label>
                    <input
                      type="number"
                      min="-90"
                      max="90"
                      value={wp.tilt_gimbal || 0}
                      onClick={handleInputClick}
                      onChange={(e) => {
                        const updated = [...waypoints];
                        updated[i].tilt_gimbal = e.target.value === '' ? '' : Number(e.target.value);
                        setWaypoints(updated);
                      }}
                      onBlur={(e) => {
                        if (e.target.value === '') {
                          const updated = [...waypoints];
                          updated[i].tilt_gimbal = 0;
                          setWaypoints(updated);
                        }
                      }}
                      style={{ width: '50px' }}
                    />
                    <label style={{ fontSize: '10px' }}>Hover:</label>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={wp.hover || 0}
                      onClick={handleInputClick}
                      onChange={(e) => {
                        const updated = [...waypoints];
                        updated[i].hover = e.target.value === '' ? '' : Number(e.target.value);
                        setWaypoints(updated);
                      }}
                      onBlur={(e) => {
                        if (e.target.value === '') {
                          const updated = [...waypoints];
                          updated[i].hover = 0;
                          setWaypoints(updated);
                        }
                      }}
                      style={{ width: '50px' }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mission-buttons">
            <button className="mission-btn-primary" onClick={addWaypoint}>
              ➕ Add WP
            </button>
            <button className="mission-btn-secondary" onClick={removeLast}>
              ➖ Remove Last
            </button>
            <button className="mission-btn-danger" onClick={clearAll}>
              🗑️ Clear All
            </button>
            <button 
              className="mission-btn-save" 
              onClick={saveMission}
              disabled={waypoints.length === 0 || !missionName.trim()}
            >
              💾 {editingMission ? "Update" : "Save"} Mission
            </button>
            <button 
              className="mission-btn-send" 
              onClick={sendMissionNow}
              disabled={waypoints.length === 0}
            >
              🚀 Send Now ({waypoints.length} WP)
            </button>
          </div>
        </div>
      )}

      {/* LIBRARY TAB */}
      {activeTab === "library" && (
        <div className="mission-library">
          {missions.length === 0 ? (
            <p className="no-missions">No saved missions yet. Create one first!</p>
          ) : (
            <div className="mission-list">
              {missions.map((mission) => (
                <div key={mission.id} className="mission-card">
                  <div className="mission-card-header">
                    <h5>{mission.name}</h5>
                    <div className="mission-card-actions">
                      <button
                        className="btn-icon"
                        title="Edit"
                        onClick={() => loadMissionToEditor(mission)}
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-icon"
                        title="Delete"
                        onClick={() => deleteMission(mission.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  <div className="mission-card-info">
                    <span>📍 {mission.waypoints.length} waypoints</span>
                    <span>⚡ {mission.speed} m/s</span>
                  </div>

                  <div className="mini-map-container">
                    <MiniMap waypoints={mission.waypoints} />
                  </div>

                  <div className="mission-card-buttons">
                    <button
                      className="btn-execute"
                      onClick={() => executeStoredMission(mission.id)}
                    >
                      ▶️ Execute Now
                    </button>
                    <button
                      className="btn-schedule"
                      onClick={() => openScheduleModal(mission)}
                    >
                      ⏰ Schedule
                    </button>
                    <button
                      className="btn-history"
                      onClick={() => loadExecutionHistory(mission.id)}
                    >
                      📊 History
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SCHEDULES TAB */}
      {activeTab === "schedules" && (
        <div className="mission-schedules">
          {schedules.length === 0 ? (
            <p className="no-schedules">No active schedules.</p>
          ) : (
            <div className="schedule-list">
              {schedules.map((schedule) => (
                <div key={schedule.id} className={`schedule-card ${!schedule.enabled ? 'disabled' : ''}`}>
                  <div className="schedule-header">
                    <h5>
                      {schedule.schedule_type === "immediate" && "⚡ Immediate"}
                      {schedule.schedule_type === "once" && "📅 One-Time"}
                      {schedule.schedule_type === "recurring" && "🔄 Recurring"}
                      {" - "}{schedule.mission?.name || `Mission #${schedule.mission_id}`}
                    </h5>
                    <div className="schedule-actions">
                      <button
                        className={`btn-toggle ${schedule.enabled ? 'enabled' : 'disabled'}`}
                        title={schedule.enabled ? "Disable" : "Enable"}
                        onClick={() => toggleSchedule(schedule.id, schedule.enabled)}
                      >
                        {schedule.enabled ? "✓" : "○"}
                      </button>
                      <button
                        className="btn-icon"
                        title="Delete"
                        onClick={() => deleteSchedule(schedule.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  <div className="schedule-info">
                    {schedule.schedule_type === "once" && (
                      <div>📅 Scheduled for: {new Date(schedule.start_time).toLocaleString()}</div>
                    )}
                    {schedule.schedule_type === "recurring" && schedule.recurrence_pattern && (
                      <div>
                        {schedule.recurrence_pattern.days && schedule.recurrence_pattern.days.length > 0 && schedule.recurrence_pattern.days.length < 7 && (
                          <div>📆 Days: {schedule.recurrence_pattern.days.map(d => 
                            ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][d]
                          ).join(", ")}</div>
                        )}
                        {(!schedule.recurrence_pattern.days || schedule.recurrence_pattern.days.length === 0 || schedule.recurrence_pattern.days.length === 7) && (
                          <div>📆 Days: Every day</div>
                        )}
                        <div>⏰ Times: {schedule.recurrence_pattern.times?.join(", ")}</div>
                      </div>
                    )}
                    {schedule.next_execution && (
                      <div>⏭️ Next: {new Date(schedule.next_execution).toLocaleString()}</div>
                    )}
                    {schedule.last_execution && (
                      <div>✅ Last: {new Date(schedule.last_execution).toLocaleString()}</div>
                    )}
                    <div className="schedule-meta">
                      Created: {new Date(schedule.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === "history" && (
        <div className="mission-history">
          {executions.length === 0 ? (
            <p className="no-executions">No execution history yet.</p>
          ) : (
            <div className="execution-list">
              {executions.map((exec) => (
                <div key={exec.id} className={`execution-item status-${exec.status}`}>
                  <div className="execution-header">
                    <strong>Mission ID: {exec.mission_id}</strong>
                    <span className={`status-badge ${exec.status}`}>
                      {exec.status === "completed" ? "✅" : exec.status === "failed" ? "❌" : "⏳"}
                      {exec.status}
                    </span>
                  </div>
                  <div className="execution-details">
                    <div>Started: {new Date(exec.started_at).toLocaleString()}</div>
                    {exec.completed_at && (
                      <div>Completed: {new Date(exec.completed_at).toLocaleString()}</div>
                    )}
                    {exec.error_message && (
                      <div className="error-msg">Error: {exec.error_message}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SCHEDULE MODAL */}
      {showScheduleModal && (
        <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>⏰ Schedule Mission: {selectedMissionForSchedule?.name}</h3>
            
            <div className="schedule-type-selector">
              <button
                className={scheduleType === "immediate" ? "active" : ""}
                onClick={() => setScheduleType("immediate")}
              >
                ⚡ Immediate
              </button>
              <button
                className={scheduleType === "once" ? "active" : ""}
                onClick={() => setScheduleType("once")}
              >
                📅 Once
              </button>
              <button
                className={scheduleType === "recurring" ? "active" : ""}
                onClick={() => setScheduleType("recurring")}
              >
                🔄 Recurring
              </button>
            </div>

            {scheduleType === "immediate" && (
              <p className="schedule-info">Mission will execute as soon as possible.</p>
            )}

            {scheduleType === "once" && (
              <div className="schedule-once">
                <label>Select Date & Time:</label>
                <input
                  type="datetime-local"
                  value={scheduleDateTime}
                  onChange={(e) => setScheduleDateTime(e.target.value)}
                />
              </div>
            )}

            {scheduleType === "recurring" && (
              <div className="schedule-recurring">
                <div className="days-selector">
                  <label>Days (leave all selected for daily):</label>
                  <div className="days-grid">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                      <button
                        key={day}
                        className={recurrenceDays.includes(day) ? "active" : ""}
                        onClick={() => toggleDay(day)}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <label>Execution Times:</label>
                {recurrenceTimes.map((time, index) => (
                  <div key={index} className="time-input-group">
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => {
                        const updated = [...recurrenceTimes];
                        updated[index] = e.target.value;
                        setRecurrenceTimes(updated);
                      }}
                    />
                    <button onClick={() => removeRecurrenceTime(index)}>❌</button>
                  </div>
                ))}
                <button className="btn-add-time" onClick={addRecurrenceTime}>
                  ➕ Add Time
                </button>
              </div>
            )}

            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setShowScheduleModal(false)}>
                Cancel
              </button>
              <button className="btn-confirm" onClick={createSchedule}>
                Create Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
