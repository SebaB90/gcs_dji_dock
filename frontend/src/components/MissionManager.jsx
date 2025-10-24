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
  const [expanded, setExpanded] = useState(false);
  const [altitude, setAltitude] = useState(25);
  const [activeTab, setActiveTab] = useState("create"); // "create" | "load"

  // Stato per missioni salvate
  const [missions, setMissions] = useState([]);
  const [selectedMission, setSelectedMission] = useState(null);

  // 🔁 Carica lista missioni salvate
  useEffect(() => {
    axios
      .get(`${backendUrl}/missions`)
      .then((res) => setMissions(res.data))
      .catch(() => console.warn("⚠️ Nessuna missione salvata disponibile."));
  }, [backendUrl]);

  // ➕ Aggiungi waypoint
  const addWaypoint = (e) => {
    e.stopPropagation();
    const base =
      waypoints.length > 0
        ? waypoints[waypoints.length - 1]
        : (dronePos && { lat: dronePos[0], lon: dronePos[1], alt: altitude }) ||
          (dockPos && { lat: dockPos[0], lon: dockPos[1], alt: altitude }) ||
          { lat: 44.5721, lon: 11.2514, alt: altitude };

    const delta = waypoints.length * 0.00005;
    const newWp = {
      lat: base.lat + delta,
      lon: base.lon + delta,
      alt: altitude,
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
  };

  // 🚀 Invio missione creata manualmente
  const sendMission = async (e) => {
    e.stopPropagation();
    if (waypoints.length === 0) {
      alert("⚠️ Aggiungi almeno un waypoint prima di inviare la missione.");
      return;
    }

    try {
      const mission = {
        UAVCMD: {
          command: "MISSION_LOAD",
          parameters: {
            speed: 1,
            rth: true,
            photo: false,
            points: waypoints.map((wp) => ({
              lat: wp.lat,
              lon: wp.lon,
              alt: wp.alt,
            })),
          },
        },
      };

      const res = await axios.post(`${backendUrl}/mission`, mission);
      if (res.data.status === "ok") alert("✅ Missione caricata correttamente!");
      else alert("⚠️ Errore nell'invio missione");
    } catch (err) {
      console.error("❌ Errore invio missione:", err);
      alert("❌ Errore invio missione");
    }
  };

  // 📂 Selezione missione salvata
  const handleSelectMission = (id) => {
    const m = missions.find((m) => m.id === id);
    setSelectedMission(m || null);

    // ✅ Mostra i waypoint nella mappa principale subito
    if (m && m.points && m.points.length > 0) {
      setWaypoints(m.points);
    }
  };

  // 🚀 Carica missione (invio al drone)
  const loadMission = async () => {
    if (!selectedMission) return;

    try {
      const mission = {
        UAVCMD: {
          command: "MISSION_LOAD",
          parameters: {
            speed: selectedMission.speed || 1,
            rth: selectedMission.rth ?? true,
            photo: selectedMission.photo ?? false,
            points: selectedMission.points,
          },
        },
      };
      const res = await axios.post(`${backendUrl}/mission`, mission);
      if (res.data.status === "ok") alert("✅ Missione inviata correttamente!");
      else alert("⚠️ Errore invio missione");
    } catch (err) {
      console.error("❌ Errore caricamento missione:", err);
    }
  };

  // 🔄 Evita chiusura pannello su click input
  const handleInputClick = (e) => e.stopPropagation();

  return (
    <div
      className={`mission-panel ${expanded ? "expanded" : "collapsed"}`}
      onClick={() => setExpanded(!expanded)}
    >
      <h4>🚀 Mission</h4>

      {!expanded && (
        <div className="mission-collapsed">
          <p>
            <strong>WP:</strong> {waypoints.length}
          </p>
          <p>
            <strong>Alt:</strong> {altitude} m
          </p>
        </div>
      )}

      {expanded && (
        <div className="mission-expanded" onClick={handleInputClick}>
          {/* 🔹 Tabs */}
          <div className="mission-tabs">
            <button
              className={activeTab === "create" ? "active" : ""}
              onClick={() => setActiveTab("create")}
            >
              ✏️ Crea missione
            </button>
            <button
              className={activeTab === "load" ? "active" : ""}
              onClick={() => setActiveTab("load")}
            >
              📂 Carica missione
            </button>
          </div>

          {/* ✏️ CREA MISSIONE */}
          {activeTab === "create" && (
            <div className="mission-create">
              <label>Altitudine (m):</label>
              <input
                type="number"
                min="1"
                max="200"
                step="1"
                value={altitude}
                onChange={(e) => setAltitude(Number(e.target.value))}
              />

              <div className="wp-list">
                {waypoints.length === 0 ? (
                  <p className="no-wp">Nessun waypoint</p>
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
                  ➕ Aggiungi
                </button>
                <button className="mission-btn-secondary" onClick={removeLast}>
                  ➖ Rimuovi
                </button>
                <button className="mission-btn-danger" onClick={clearAll}>
                  🗑️ Reset
                </button>
                <button className="mission-btn-send" onClick={sendMission}>
                  🚀 Invia
                </button>
              </div>
            </div>
          )}

          {/* 📂 CARICA MISSIONE */}
          {activeTab === "load" && (
            <div className="mission-load">
              <label>Missioni salvate:</label>
              <select
                onChange={(e) => handleSelectMission(e.target.value)}
                value={selectedMission?.id || ""}
              >
                <option value="">-- seleziona --</option>
                {missions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>

              {selectedMission && (
                <>
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      marginTop: "6px",
                      color: "#2980b9",
                    }}
                  >
                    {selectedMission.name}
                  </p>

                  <div className="mini-map-container">
                    <MiniMap waypoints={selectedMission.points} />
                  </div>

                  <button
                    className="mission-btn-send"
                    onClick={loadMission}
                    disabled={!selectedMission}
                  >
                    🚀 Carica nel drone
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      <div className="expand-hint">
        {expanded ? "▼ Clicca per chiudere" : "▲ Clicca per espandere"}
      </div>
    </div>
  );
}
