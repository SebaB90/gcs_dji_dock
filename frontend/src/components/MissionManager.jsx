import axios from "axios";
import { useState } from "react";
import "../styles/MissionManager.css";

const DEFAULT_ALT = 25;

export default function MissionManager({
  dronePos,
  dockPos,
  waypoints,
  setWaypoints,
  BACKEND_URL,
}) {
  const [selectedAlt, setSelectedAlt] = useState(DEFAULT_ALT);
  const [missionStatus, setMissionStatus] = useState("Idle");

  const handleAddWaypoint = () => {
    const base =
      waypoints.at(-1) ||
      (dronePos && { lat: dronePos[0], lon: dronePos[1], alt: selectedAlt }) ||
      (dockPos && { lat: dockPos[0], lon: dockPos[1], alt: selectedAlt }) || {
        lat: 44.5721,
        lon: 11.2514,
        alt: selectedAlt,
      };

    const delta = waypoints.length === 0 ? 0 : 0.00005;
    const newWp = { lat: base.lat + delta, lon: base.lon + delta, alt: selectedAlt };
    setWaypoints((prev) => [...prev, newWp]);
  };

  const handleRemoveLast = () => setWaypoints(waypoints.slice(0, -1));
  const handleClearAll = () => setWaypoints([]);

  const sendMission = async () => {
    try {
      if (waypoints.length === 0) {
        alert("⚠️ Nessun waypoint definito!");
        return;
      }

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

      setMissionStatus("Uploading...");
      const res = await axios.post(`${BACKEND_URL}/mission`, mission);
      if (res.data.status === "ok") {
        alert("✅ Missione caricata con successo!");
        setMissionStatus("Ready");
      } else {
        alert("⚠️ Errore nell'invio missione");
        setMissionStatus("Error");
      }
    } catch (err) {
      console.error("Errore invio missione:", err);
      setMissionStatus("Error");
    }
  };

  return (
    <section className="mission-manager">
      <h4>Gestione Missione</h4>

      <div className="mission-status">
        <p>
          <strong>Stato:</strong>{" "}
          <span
            style={{
              color:
                missionStatus === "Ready"
                  ? "green"
                  : missionStatus === "Error"
                  ? "red"
                  : "orange",
            }}
          >
            {missionStatus}
          </span>
        </p>
      </div>

      <div className="mission-altitude">
        <label>
          Altitudine (m):
          <input
            type="number"
            min="1"
            max="200"
            value={selectedAlt}
            onChange={(e) => setSelectedAlt(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="wp-list">
        {waypoints.length === 0 ? (
          <p>Nessun waypoint</p>
        ) : (
          waypoints.map((wp, i) => (
            <div key={i}>
              <strong>WP{i + 1}</strong> {wp.lat.toFixed(5)}, {wp.lon.toFixed(5)}
              <input
                type="number"
                value={wp.alt}
                onChange={(e) => {
                  const newWps = [...waypoints];
                  newWps[i].alt = Number(e.target.value);
                  setWaypoints(newWps);
                }}
              />
            </div>
          ))
        )}
      </div>

      <div className="mission-buttons">
        <button onClick={handleAddWaypoint}>➕ Aggiungi WP</button>
        <button onClick={handleRemoveLast}>➖ Rimuovi ultimo</button>
        <button onClick={handleClearAll}>🚮 Reset</button>
        <button onClick={sendMission}>🚀 Carica Missione</button>
      </div>
    </section>
  );
}
