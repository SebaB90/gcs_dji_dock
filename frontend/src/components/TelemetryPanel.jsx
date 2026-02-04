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
  Send,
  Thermometer,
  CloudDrizzle,
  Wind,
  Compass,
  Target,
} from "lucide-react";
import droneIcon from "../assets/drone_icon.avif";
import "../styles/TelemetryDrawer.css";

// === Componente ausiliario per singola metrica ===
const MetricCard = ({ icon: Icon, title, value, unit, color }) => (
  <div className="metric-card">
    <Icon size={20} className="card-icon" color={color || '#79a7ff'} />
    <div className="card-info">
      <div className="card-title">{title}</div>
      <div className="card-value">
        {value}
        {unit && <span className="card-unit">{unit}</span>}
      </div>
    </div>
  </div>
);

// Mappatura del GPS Fix Type
const getGpsFixData = (fixType) => {
    switch (fixType) {
        case 0: return { label: "No Fix", color: "#e74c3c" };
        case 1: return { label: "GPS Fix", color: "#f1c40f" };
        case 2: return { label: "Diff GPS", color: "#f1c40f" };
        case 3: return { label: "RTK Float", color: "#f1c40f" };
        case 4: return { label: "RTK Fixed (4)", color: "#2ecc71" };
        case 5: return { label: "RTK Fixed (5)", color: "#2ecc71" };
        default: return { label: `Fix ${fixType}`, color: "#999" };
    }
};

export default function TelemetryPanel({ telemetry }) {
  // Helper to get latest value from telemetry arrays
  const getVal = (key) => telemetry?.[key]?.[0]?.value ?? null;
  // Dock sub-object
  const dock = getVal("dock") || {};

  // Drone metrics
  const battery = getVal("battery_level") ?? dock.drone_battery_level ?? null;
  const groundspeed = getVal("groundspeed");
  const altitude = getVal("alt");
  const heading = getVal("heading");
  const mode = getVal("mode") ?? dock.dock_mode ?? "N/A";
  const status = getVal("system_status") ?? dock.dock_mode ?? "N/A";
  const sat = getVal("gps_num_satellites");
  const fix = getVal("gps_fix_type");
  const dfh = getVal("distance_from_home");
  const vx = parseFloat(getVal("velocity_x")) || 0;
  const vy = parseFloat(getVal("velocity_y")) || 0;
  const vz = parseFloat(getVal("velocity_z")) || 0;
  const vectorSpeed = (Math.sqrt(vx*vx + vy*vy + vz*vz)).toFixed(2);
  const dronePos = [getVal("lat"), getVal("lon")];

  // Dock metrics
  const dockTemp = dock.dock_temperature ?? getVal("dock_temperature") ?? null;
  const dockHumidity = dock.humidity ?? getVal("humidity") ?? null;
  const dockWind = dock.wind_speed ?? getVal("wind_speed") ?? null;

  // Styling
  let BatteryIcon = BatteryFull;
  let batteryColor = "#2ecc71";
  if (battery !== null) {
    if (battery < 20) {
      BatteryIcon = BatteryLow;
      batteryColor = "#e74c3c";
    } else if (battery < 60) {
      BatteryIcon = BatteryMedium;
      batteryColor = "#f1c40f";
    }
  }
  const statusColor =
    status === "online"
      ? "#2ecc71"
      : status === "not_connected" || status === "N/A"
      ? "#e74c3c"
      : "#3498db";

  // GPS fix helper
  const getGpsFixData = (fixType) => {
    switch (fixType) {
      case 0: return { label: "No Fix", color: "#e74c3c" };
      case 1: return { label: "GPS Fix", color: "#f1c40f" };
      case 2: return { label: "Diff GPS", color: "#f1c40f" };
      case 3: return { label: "RTK Float", color: "#f1c40f" };
      case 4: return { label: "RTK Fixed (4)", color: "#2ecc71" };
      case 5: return { label: "RTK Fixed (5)", color: "#2ecc71" };
      default: return { label: `Fix ${fixType}`, color: "#999" };
    }
  };
  const fixData = getGpsFixData(fix);

  return (
    <div className="telemetry-drawer">
      {/* HEADER */}
      <div className="drawer-header-tele">
        <img src={droneIcon} className="drawer-drone-icon" alt="Drone" />
        <div className="status-label">
          <span className="status-dot" style={{ background: statusColor }} />
          <span>{String(status).toUpperCase().replace('_', ' ')}</span>
        </div>
      </div>

      {/* Drone Metrics */}
      <div className="section-title">Drone Metrics</div>
      <div className="telemetry-grid">
        <MetricCard icon={BatteryIcon} title="Battery" value={battery !== null ? Number(battery).toFixed(0) : "N/A"} unit="%" color={batteryColor} />
        <MetricCard icon={Plane} title="Mode" value={String(mode).toUpperCase().replace('_', ' ')} color="#3498db" />
        <MetricCard icon={Activity} title="Altitude (AGL)" value={altitude !== null ? Number(altitude).toFixed(2) : "N/A"} unit="m" />
        <MetricCard icon={Gauge} title="Ground Speed (XY)" value={groundspeed !== null ? Number(groundspeed).toFixed(2) : "N/A"} unit="m/s" />
        <MetricCard icon={Compass} title="Heading (Yaw)" value={heading !== null ? Number(heading).toFixed(1) : "N/A"} unit="°" />
        <MetricCard icon={Send} title="Vector Speed (3D)" value={vectorSpeed} unit="m/s" color={parseFloat(vectorSpeed) > 0.1 ? "#2ecc71" : "#999"} />
      </div>

      {/* Position & GPS */}
      <div className="section-title">Position & GPS</div>
      <div className="telemetry-grid cols-1">
        <MetricCard icon={Target} title="Coordinates (Lat, Lon)" value={`${dronePos?.[0]?.toFixed(6) ?? 'N/A'}, ${dronePos?.[1]?.toFixed(6) ?? 'N/A'}`} />
        <MetricCard icon={MapPin} title="Distance From Home" value={dfh !== null ? Number(dfh).toFixed(2) : "N/A"} unit="m" />
      </div>
      <div className="telemetry-grid">
        <MetricCard icon={Satellite} title="Satellites" value={sat ?? "N/A"} color={sat && sat >= 10 ? "#2ecc71" : "#f1c40f"} />
        <MetricCard icon={fixData.color === "#2ecc71" ? Satellite : AlertTriangle} title="GPS Fix Type" value={fixData.label} color={fixData.color} />
      </div>

      {/* Dock / Environmental */}
      <div className="section-title">Dock / Environmental</div>
      <div className="telemetry-grid">
        <MetricCard icon={Thermometer} title="Temperature" value={dockTemp ?? "N/A"} unit="°C" />
        <MetricCard icon={CloudDrizzle} title="Humidity" value={dockHumidity ?? "N/A"} unit="%" />
        <MetricCard icon={Wind} title="Wind Speed" value={dockWind ?? "N/A"} unit="m/s" />
      </div>
    </div>
  );
}
