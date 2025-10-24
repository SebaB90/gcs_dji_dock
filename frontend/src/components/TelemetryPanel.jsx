import { useState } from "react";
import "../styles/TelemetryPanel.css";

export default function TelemetryPanel({ drone, hangar, dronePos }) {
  const [expanded, setExpanded] = useState(false);

  const battery = drone?.battery_level?.[0]?.value ?? 0;
  const batteryColor = battery < 20 ? "red" : battery < 60 ? "orange" : "green";
  const dock = drone?.dock?.[0]?.value ?? {};

  return (
    <div
      className={`telemetry-panel ${expanded ? "expanded" : "collapsed"}`}
      onClick={() => setExpanded(!expanded)}
    >
      <h4>🛰️ Telemetria UAV</h4>

      {/* === DATI BASE === */}
      <div className="telemetry-basic">
        <p>
          <strong>Battery:</strong>{" "}
          <span style={{ color: batteryColor }}>{battery}%</span>
        </p>
        <p>
          <strong>Lat:</strong> {dronePos?.[0]?.toFixed(6) ?? "-"}
        </p>
        <p>
          <strong>Lon:</strong> {dronePos?.[1]?.toFixed(6) ?? "-"}
        </p>
        <p>
          <strong>Alt:</strong> {drone?.alt?.[0]?.value ?? "-"}
        </p>
      </div>

      {/* === SEZIONE ESPANDIBILE === */}
      {expanded && (
        <div className="telemetry-details">
          <h5>Drone</h5>
          <p><strong>Speed:</strong> {drone?.groundspeed?.[0]?.value ?? "-"}</p>
          <p><strong>Status:</strong> {drone?.status?.[0]?.value ?? "-"}</p>
          <p><strong>Mode:</strong> {drone?.mode?.[0]?.value ?? "-"}</p>
          <p><strong>Heading:</strong> {drone?.heading?.[0]?.value ?? "-"}</p>

          <h5>Dock</h5>
          <p><strong>Cover:</strong> {dock.cover_state ?? "-"}</p>
          <p><strong>Drone in dock:</strong> {dock.drone_in_dock ? "✅" : "❌"}</p>
          <p><strong>Dock mode:</strong> {dock.dock_mode ?? "-"}</p>
          <p><strong>Temp:</strong> {dock.dock_temperature ?? "-"}°C</p>
          <p><strong>Humidity:</strong> {dock.humidity ?? "-"}%</p>
          <p><strong>Wind:</strong> {dock.wind_speed ?? "-"} m/s</p>

          <h5>Dati grezzi</h5>
          <pre className="raw-json">
            {JSON.stringify({ drone, hangar }, null, 2)}
          </pre>
        </div>
      )}

      {/* === INDICATORE CLIC === */}
      <div className="expand-hint">
        {expanded ? "▼ Clicca per chiudere" : "▲ Clicca per espandere"}
      </div>
    </div>
  );
}
