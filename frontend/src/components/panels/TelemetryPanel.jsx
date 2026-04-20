import {
  BatteryFull,
  BatteryMedium,
  BatteryLow,
  Satellite,
  MapPin,
  Plane,
  Compass,
  Thermometer,
  CloudDrizzle,
  Wind,
  Home,
  Activity,
  Navigation,
} from "lucide-react";
import droneIcon from "../../assets/drone_icon.avif";
import dockIcon from "../../assets/dock_icon.png";
import "./TelemetryPanel.css";

// === Helper Component for Single Metric ===
const MetricCard = ({ icon: Icon, title, value, unit, color = '#79a7ff' }) => (
  <div className="metric-card" style={{ color: color }}>
    <Icon size={20} className="card-icon" color={color} />
    <div className="card-info">
      <div className="card-title">{title}</div>
      <div className="card-value">
        {value}
        {unit && <span className="card-unit">{unit}</span>}
      </div>
    </div>
  </div>
);

export default function TelemetryPanel({ telemetry }) {
  // Helper to safely extract values
  const getVal = (key) => telemetry?.[key]?.[0]?.value ?? null;

  // === DOCK DATA (nested object) ===
  const dockData = telemetry?.dock?.[0]?.value || {};

  // === DRONE METRICS (top-level) ===
  const lat = getVal("lat");
  const lon = getVal("lon");
  const mode = getVal("mode");
  const battery = getVal("battery_level");
  const heading = getVal("heading");
  const altitude = getVal("alt");
  const pitch = getVal("pitch");
  const roll = getVal("roll");
  const yaw = getVal("yaw");
  const systemStatus = getVal("system_status");
  const satellites = getVal("gps_num_satellites");
  const log = getVal("log");

  // === DOCK METRICS (from nested dock object) ===
  const dockMode = dockData.dock_mode;
  const homeLatitude = getVal("home_latitude");
  const homeLongitude = getVal("home_longitude");
  const droneInDock = dockData.drone_in_dock;
  const droneOnline = dockData.drone_online;
  const dronePaired = dockData.drone_paired;
  const dockTemp = dockData.dock_temperature;
  const humidity = dockData.humidity;
  const windSpeed = dockData.wind_speed;
  const coverState = dockData.cover_state;

  // --- Battery Logic ---
  let BatteryIcon = BatteryFull;
  let batteryColor = "#2ecc71"; // Green
  if (battery !== null) {
    if (battery < 20) {
      BatteryIcon = BatteryLow;
      batteryColor = "#e74c3c"; // Red
    } else if (battery < 50) {
      BatteryIcon = BatteryMedium;
      batteryColor = "#f39c12"; // Orange
    }
  }

  // --- Drone Status Logic ---
  let droneStatusColor = "#95a5a6"; // Grey default
  let droneStatusText = systemStatus ? String(systemStatus).toUpperCase().replace(/_/g, ' ') : "N/A";

  if (systemStatus === "online" || systemStatus === "armed") {
    droneStatusColor = "#2ecc71"; // Green
  } else if (systemStatus === "offline" || systemStatus === "not_connected") {
    droneStatusColor = "#e74c3c"; // Red
  } else if (systemStatus) {
    droneStatusColor = "#3498db"; // Blue
  }

  // --- Dock Status Logic ---
  let dockStatusColor = "#95a5a6"; // Grey default
  let dockStatusText = dockMode ? String(dockMode).toUpperCase().replace(/_/g, ' ') : "N/A";

  if (dockMode === "working" || dockMode === "live") {
    dockStatusColor = "#2ecc71"; // Green
  } else if (dockMode === "offline" || dockMode === "error") {
    dockStatusColor = "#e74c3c"; // Red
  } else if (dockMode) {
    dockStatusColor = "#3498db"; // Blue
  }

  // --- Boolean state formatting ---
  const formatBool = (val) => {
    if (val === true || val === 1 || val === "true") return "YES";
    if (val === false || val === 0 || val === "false") return "NO";
    return "--";
  };

  return (
    <div className="telemetry-drawer">

      {/* ======================================== */}
      {/* DRONE SECTION */}
      {/* ======================================== */}
      <div className="drawer-header-tele">
        <img src={droneIcon} className="drawer-drone-icon" alt="Drone" />
        <div className="status-label" style={{ borderColor: droneStatusColor }}>
          <span
            className="status-dot"
            style={{
              backgroundColor: droneStatusColor,
              color: droneStatusColor
            }}
          />
          <span>{droneStatusText}</span>
        </div>
      </div>

      <div className="section-title">Drone Telemetry</div>

      {/* Coordinates */}
      <div className="telemetry-grid cols-1">
        <MetricCard
          icon={MapPin}
          title="Position (Lat, Lon)"
          value={lat && lon ? `${Number(lat).toFixed(6)}, ${Number(lon).toFixed(6)}` : "No GPS"}
          color="#e67e22"
        />
      </div>

      {/* Log Message */}
      {log && (
        <div className="telemetry-grid cols-1">
          <MetricCard
            icon={Activity}
            title="Log"
            value={log}
            color="#95a5a6"
          />
        </div>
      )}

      {/* Main Metrics */}
      <div className="telemetry-grid">
        <MetricCard
          icon={Plane}
          title="Mode"
          value={mode ? String(mode).toUpperCase().replace(/_/g, ' ') : "N/A"}
          color="#3498db"
        />
        <MetricCard
          icon={BatteryIcon}
          title="Battery"
          value={battery !== null ? Number(battery).toFixed(0) : "--"}
          unit="%"
          color={batteryColor}
        />
        <MetricCard
          icon={Compass}
          title="Heading"
          value={heading !== null ? Number(heading).toFixed(0) : "--"}
          unit="°"
          color="#9b59b6"
        />
        <MetricCard
          icon={Activity}
          title="Altitude"
          value={altitude !== null ? Number(altitude).toFixed(1) : "--"}
          unit="m"
          color="#2ecc71"
        />
        <MetricCard
          icon={Navigation}
          title="Pitch"
          value={pitch !== null ? Number(pitch).toFixed(1) : "--"}
          unit="°"
          color="#f39c12"
        />
        <MetricCard
          icon={Navigation}
          title="Roll"
          value={roll !== null ? Number(roll).toFixed(1) : "--"}
          unit="°"
          color="#e74c3c"
        />
        <MetricCard
          icon={Navigation}
          title="Yaw"
          value={yaw !== null ? Number(yaw).toFixed(1) : "--"}
          unit="°"
          color="#1abc9c"
        />
        <MetricCard
          icon={Satellite}
          title="GPS Sats"
          value={satellites ?? "--"}
          color={satellites >= 12 ? "#2ecc71" : (satellites >= 6 ? "#f39c12" : "#e74c3c")}
        />
      </div>

      {/* ======================================== */}
      {/* DOCK SECTION */}
      {/* ======================================== */}
      <div className="drawer-header-tele" style={{ marginTop: "30px" }}>
        <img src={dockIcon} className="drawer-drone-icon" alt="Dock" />
        <div className="status-label" style={{ borderColor: dockStatusColor }}>
          <span
            className="status-dot"
            style={{
              backgroundColor: dockStatusColor,
              color: dockStatusColor
            }}
          />
          <span>{dockStatusText}</span>
        </div>
      </div>

      <div className="section-title">Dock Status</div>

      {/* Home Coordinates */}
      <div className="telemetry-grid cols-1">
        <MetricCard
          icon={Home}
          title="Home Position (Lat, Lon)"
          value={homeLatitude && homeLongitude ? `${Number(homeLatitude).toFixed(6)}, ${Number(homeLongitude).toFixed(6)}` : "Not Set"}
          color="#16a085"
        />
      </div>

      {/* Dock State */}
      <div className="telemetry-grid">
        <MetricCard
          icon={Activity}
          title="Drone In Dock"
          value={formatBool(droneInDock)}
          color={droneInDock ? "#2ecc71" : "#e74c3c"}
        />
        <MetricCard
          icon={Activity}
          title="Drone Online"
          value={formatBool(droneOnline)}
          color={droneOnline ? "#2ecc71" : "#e74c3c"}
        />
        <MetricCard
          icon={Activity}
          title="Drone Paired"
          value={formatBool(dronePaired)}
          color={dronePaired ? "#2ecc71" : "#e74c3c"}
        />
        <MetricCard
          icon={Activity}
          title="Cover State"
          value={coverState ? String(coverState).toUpperCase().replace(/_/g, ' ') : "N/A"}
          color="#3498db"
        />
      </div>

      {/* Environment */}
      <div className="section-title">Environment</div>
      <div className="telemetry-grid">
        <MetricCard
          icon={Thermometer}
          title="Temperature"
          value={dockTemp !== null ? Number(dockTemp).toFixed(1) : "--"}
          unit="°C"
          color="#e74c3c"
        />
        <MetricCard
          icon={CloudDrizzle}
          title="Humidity"
          value={humidity !== null ? Number(humidity).toFixed(0) : "--"}
          unit="%"
          color="#3498db"
        />
        <MetricCard
          icon={Wind}
          title="Wind Speed"
          value={windSpeed !== null ? Number(windSpeed).toFixed(1) : "--"}
          unit="m/s"
          color="#2ecc71"
        />
      </div>

    </div>
  );
}