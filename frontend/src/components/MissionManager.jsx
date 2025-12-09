import { useState, useEffect } from "react";
import axios from "axios";
import MiniMap from "./MiniMap";
import "../styles/MissionManager.css";

export default function MissionManager({
  waypoints,
  setWaypoints,
  dronePos,
  dockPos,
  backendUrl,
}) {
  const [altitude, setAltitude] = useState(25);
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
  const [recurrencePattern, setRecurrencePattern] = useState("daily");
  const [recurrenceTimes, setRecurrenceTimes] = useState(["08:00"]);
  const [recurrenceDays, setRecurrenceDays] = useState(["Mon", "Wed", "Fri"]);
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
      const token = localStorage.getItem("gcs_token");
      const res = await axios.get(`${backendUrl}/api/missions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.status === "success") {
        setMissions(res.data.missions);
      }
    } catch (err) {
      console.warn("⚠️ Could not load missions:", err);
    }
  };

  const loadExecutionHistory = async (missionId = null) => {
    try {
      const token = localStorage.getItem("gcs_token");
      const url = missionId 
        ? `${backendUrl}/api/executions?mission_id=${missionId}&limit=20`
        : `${backendUrl}/api/executions?limit=50`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.status === "success") {
        setExecutions(res.data.executions);
        setShowExecutions(true);
      }
    } catch (err) {
      console.error("❌ Error loading execution history:", err);
    }
  };

  const loadSchedules = async () => {
    try {
      const token = localStorage.getItem("gcs_token");
      const res = await axios.get(`${backendUrl}/api/schedules`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.status === "success") {
        setSchedules(res.data.schedules);
      }
    } catch (err) {
      console.error("❌ Error loading schedules:", err);
    }
  };

  const deleteSchedule = async (scheduleId) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;

    try {
      const token = localStorage.getItem("gcs_token");
      await axios.delete(`${backendUrl}/api/schedules/${scheduleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("✅ Schedule deleted");
      loadSchedules();
    } catch (err) {
      console.error("❌ Error deleting schedule:", err);
      const errorMsg = err.response?.data?.detail || err.message || "Unknown error";
      alert(`❌ Error deleting schedule: ${errorMsg}`);
    }
  };

  const toggleSchedule = async (scheduleId, currentStatus) => {
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
  };

  const addWaypoint = (e) => {
    e.stopPropagation();
    const currentAlt = Number(altitude);
    
    const base =
      waypoints.length > 0
        ? waypoints[waypoints.length - 1]
        : (dronePos && { lat: dronePos[0], lon: dronePos[1], alt: currentAlt }) ||
          (dockPos && { lat: dockPos[0], lon: dockPos[1], alt: currentAlt }) ||
          { lat: 44.5721, lon: 11.2514, alt: currentAlt };

    const delta = waypoints.length * 0.00005;
    const newWp = {
      lat: base.lat + delta,
      lon: base.lon + delta,
      alt: currentAlt,
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
      const token = localStorage.getItem("gcs_token");
      const missionData = {
        name: missionName,
        waypoints: waypoints,
        speed: missionSpeed,
        rth: missionRTH,
        photo: missionPhoto
      };

      if (editingMission) {
        // Update existing mission
        const res = await axios.put(
          `${backendUrl}/api/missions/${editingMission.id}`,
          missionData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.status === "success") {
          alert(`✅ Mission "${missionName}" updated!`);
          setEditingMission(null);
        }
      } else {
        // Create new mission
        const res = await axios.post(
          `${backendUrl}/api/missions`,
          missionData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.status === "success") {
          alert(`✅ Mission "${missionName}" saved successfully!`);
        }
      }
      
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

  const executeStoredMission = async (missionId) => {
    try {
      const token = localStorage.getItem("gcs_token");
      const res = await axios.post(
        `${backendUrl}/api/missions/${missionId}/execute`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.status === "success") {
        alert(`✅ ${res.data.message}`);
      }
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
      const token = localStorage.getItem("gcs_token");
      let scheduleData = {
        schedule_type: scheduleType,
        enabled: true
      };

      if (scheduleType === "once") {
        if (!scheduleDateTime) {
          alert("⚠️ Please select date and time");
          return;
        }
        scheduleData.start_time = new Date(scheduleDateTime).toISOString();
      } else if (scheduleType === "recurring") {
        if (recurrenceTimes.length === 0) {
          alert("⚠️ Please add at least one execution time");
          return;
        }
        
        scheduleData.schedule_type = "recurring";
        scheduleData.recurrence_pattern = recurrencePattern;
        scheduleData.start_time = new Date().toISOString();
        
        if (recurrencePattern === "daily") {
          scheduleData.recurrence_value = recurrenceTimes.join(",");
        } else if (recurrencePattern === "weekly") {
          scheduleData.recurrence_value = `${recurrenceDays.join(",")}:${recurrenceTimes.join(",")}`;
        }
      }

      const res = await axios.post(
        `${backendUrl}/api/missions/${selectedMissionForSchedule.id}/schedules`,
        scheduleData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.status === "success") {
        alert(`✅ ${res.data.message}`);
        setShowScheduleModal(false);
      }
    } catch (err) {
      console.error("❌ Error creating schedule:", err);
      const errorMsg = err.response?.data?.detail || err.message || "Unknown error";
      alert(`❌ Error creating schedule: ${errorMsg}`);
    }
  };

  const deleteMission = async (missionId) => {
    if (!confirm("Are you sure you want to delete this mission?")) return;

    try {
      const token = localStorage.getItem("gcs_token");
      await axios.delete(`${backendUrl}/api/missions/${missionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
    setMissionRTH(mission.rth);
    setMissionPhoto(mission.photo);
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
                  max="200"
                  step="1"
                  value={altitude}
                  onChange={(e) => setAltitude(Number(e.target.value))}
                />
              </div>
              <div>
                <label htmlFor="speed-input">Speed (m/s):</label>
                <input
                  id="speed-input"
                  type="number"
                  min="0.5"
                  max="15"
                  step="0.5"
                  value={missionSpeed}
                  onChange={(e) => setMissionSpeed(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={missionRTH}
                  onChange={(e) => setMissionRTH(e.target.checked)}
                />
                Return to Home
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={missionPhoto}
                  onChange={(e) => setMissionPhoto(e.target.checked)}
                />
                Take Photos
              </label>
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
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={wp.alt}
                    onClick={handleInputClick}
                    onChange={(e) => {
                      const newAlt = Number(e.target.value);
                      const updated = [...waypoints];
                      updated[i].alt = newAlt;
                      setWaypoints(updated);
                    }}
                  />
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
                    <span>{mission.rth ? "🔙 RTH" : "❌ No RTH"}</span>
                    <span>{mission.photo ? "📷 Photo" : "❌ No Photo"}</span>
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
                      {" - Mission ID: "}{schedule.mission_id}
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
                        <div>🔄 Pattern: {schedule.recurrence_pattern.pattern}</div>
                        <div>⏰ Times: {schedule.recurrence_pattern.times?.join(", ")}</div>
                        {schedule.recurrence_pattern.pattern === "weekly" && (
                          <div>📆 Days: {schedule.recurrence_pattern.days?.map(d => 
                            ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]
                          ).join(", ")}</div>
                        )}
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
                <label>Pattern:</label>
                <select
                  value={recurrencePattern}
                  onChange={(e) => setRecurrencePattern(e.target.value)}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>

                {recurrencePattern === "weekly" && (
                  <div className="days-selector">
                    <label>Days:</label>
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
                )}

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
