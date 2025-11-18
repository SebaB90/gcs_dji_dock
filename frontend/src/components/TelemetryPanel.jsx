import { useState } from "react";
import {
  BatteryFull,
  BatteryMedium,
  BatteryLow,
  Satellite,
  Gauge,
  MapPin,
  Activity,
  Plane,
  AlertTriangle,
  Cloud,
  Info,
} from "lucide-react";
import "../styles/TelemetryPanel.css";
import droneIcon from "../assets/drone_icon.avif";

export default function TelemetryPanel({ drone, hangar, dronePos }) {
  const [expanded, setExpanded] = useState(false);

  // === DRONE BASIC TELEMETRY ===
  const battery = drone?.battery_level?.[0]?.value ?? null;
  const groundspeed = drone?.groundspeed?.[0]?.value ?? null;
  const altitude = drone?.alt?.[0]?.value ?? null;
  const heading = drone?.heading?.[0]?.value ?? null;
  const mode = drone?.mode?.[0]?.value ?? "-";
  const status = drone?.system_status?.[0]?.value ?? "-";
  const pitch = drone?.pitch?.[0]?.value ?? null;
  const roll = drone?.roll?.[0]?.value ?? null;
  const yaw = drone?.yaw?.[0]?.value ?? null;
  const sat = drone?.gps_num_satellites?.[0]?.value ?? null;
  const fix = drone?.gps_fix_type?.[0]?.value ?? null;
  const dfh = drone?.distance_from_home?.[0]?.value ?? null;

  const vx = drone?.velocity_x?.[0]?.value ?? 0;
  const vy = drone?.velocity_y?.[0]?.value ?? 0;
  const vz = drone?.velocity_z?.[0]?.value ?? 0;

  const errorMessage = drone?.error_message?.[0]?.value ?? null;

  // === DOCK TELEMETRY ===
  const dock = drone?.dock?.[0]?.value ?? null;
  const dockTemp = dock?.dock_temperature ?? hangar?.ext_tmp?.[0]?.value;
  const dockHumidity = dock?.humidity ?? hangar?.ext_humidity?.[0]?.value;
  const dockWind = dock?.wind_speed ?? hangar?.wind?.[0]?.value;
  const dockCover = dock?.cover_state ?? "-";

  // === BATTERY ICON ===
  let BatteryIcon = BatteryFull;
  let batteryColor = "#27ae60";

  if (battery !== null) {
    if (battery < 20) {
      BatteryIcon = BatteryLow;
      batteryColor = "#e74c3c";
    } else if (battery < 60) {
      BatteryIcon = BatteryMedium;
      batteryColor = "#f1c40f";
    }
  }

  // === STATUS COLOR ===
  const statusColor =
    status === "online"
      ? "#27ae60"
      : status === "not_connected"
      ? "#e74c3c"
      : "#3498db";

  return (
    <div
      className={`telemetry-panel ${expanded ? "expanded" : "collapsed"}`}
      onClick={() => setExpanded(!expanded)}
    >
      {/* === HEADER === */}
      <div className="telemetry-header">
        <img src={droneIcon} alt="Drone" className="drone-icon-min" />
        <h4>Drone Status</h4>
        <span className="status-indicator" style={{ background: statusColor }} />
      </div>

      {/* === BASIC INFO (compact mode) === */}
      <div className="telemetry-basic">
        <div className="row">
          <BatteryIcon size={16} color={batteryColor} />
          <span className="value">{battery !== null ? `${battery}%` : "N/A"}</span>
        </div>

        <div className="row">
          <Plane size={15} />
          <span className="value">{mode}</span>
        </div>

        <div className="row">
          <Gauge size={15} />
          <span className="value">{groundspeed} m/s</span>
        </div>

        <div className="row">
          <Activity size={15} />
          <span className="value">{altitude} m</span>
        </div>

        <div className="row">
          <MapPin size={15} />
          <span className="value">
            {dronePos?.[0]?.toFixed(5)}, {dronePos?.[1]?.toFixed(5)}
          </span>
        </div>
      </div>

      {/* === EXPANDED DETAILS === */}
      {expanded && (
        <div
          className="telemetry-details"
          onClick={(e) => e.stopPropagation()} // evita chiusura
        >
          <h5>📡 Flight Info</h5>
          <p><strong>Heading:</strong> {heading}°</p>
          <p><strong>Velocity XYZ:</strong> {vx}, {vy}, {vz} m/s</p>
          <p><strong>Distance from Home:</strong> {dfh} m</p>

          <h5>🛰 GPS</h5>
          <p><strong>Satelliti:</strong> {sat}</p>
          <p><strong>Fix Type:</strong> {fix}</p>

          <h5>🎛 Attitude</h5>
          <p><strong>Pitch:</strong> {pitch}°</p>
          <p><strong>Roll:</strong> {roll}°</p>
          <p><strong>Yaw:</strong> {yaw}°</p>

          <h5>🏠 Dock Info</h5>
          <p><strong>Coperchio:</strong> {dockCover}</p>
          <p><strong>Temperatura:</strong> {dockTemp} °C</p>
          <p><strong>Umidità:</strong> {dockHumidity} %</p>
          <p><strong>Vento:</strong> {dockWind} m/s</p>

          {errorMessage && (
            <div className="error-box">
              <AlertTriangle size={16} color="#e74c3c" />
              <span>{errorMessage}</span>
            </div>
          )}

          <h5>Raw JSON (debug)</h5>
          <pre className="raw-json">
            {JSON.stringify({ drone, hangar }, null, 2)}
          </pre>
        </div>
      )}

      <div className="expand-hint">
        {expanded ? "▼ Chiudi" : "▲ Info dettagliate"}
      </div>
    </div>
  );
}
