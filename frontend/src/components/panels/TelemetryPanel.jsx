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
import droneIcon from "../../assets/drone_icon.avif";
import "./TelemetryPanel.css";

// === Helper Component for Single Metric ===
const MetricCard = ({ icon: Icon, title, value, unit, color = '#79a7ff' }) => (
  // We pass the color to style so ::before pseudo-element can use currentColor
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
  const dock = getVal("dock") || {}; // Fallback if dock object is missing

  // Drone Metrics
  const battery = getVal("battery_level") ?? dock.drone_battery_level ?? null;
  const groundspeed = getVal("groundspeed");
  const altitude = getVal("alt");
  const heading = getVal("heading");
  const mode = getVal("mode") ?? dock.dock_mode ?? "N/A";
  // Prioritize system_status, fallback to dock_mode
  const status = getVal("system_status") ?? (dock.dock_mode ? "Connected" : "Not Connected"); 
  
  const sat = getVal("gps_num_satellites");
  const fix = getVal("gps_fix_type");
  const dfh = getVal("distance_from_home");
  
  // Velocity Vector
  const vx = parseFloat(getVal("velocity_x")) || 0;
  const vy = parseFloat(getVal("velocity_y")) || 0;
  const vz = parseFloat(getVal("velocity_z")) || 0;
  const vectorSpeed = (Math.sqrt(vx*vx + vy*vy + vz*vz)).toFixed(2);
  
  const lat = getVal("lat");
  const lon = getVal("lon");
  const dronePos = [lat, lon];

  // Dock Metrics
  const dockTemp = dock.dock_temperature ?? getVal("dock_temperature") ?? null;
  const dockHumidity = dock.humidity ?? getVal("humidity") ?? null;
  const dockWind = dock.wind_speed ?? getVal("wind_speed") ?? null;

  // --- Logic for Colors & Icons ---

  // Battery Logic
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

  // Status Logic
  let statusColor = "#95a5a6"; // Grey default
  let statusText = String(status).toUpperCase().replace(/_/g, ' ');
  
  if (status === "online" || status === "Armed" || status === "Connected") {
      statusColor = "#2ecc71"; // Green
  } else if (status === "not_connected" || status === "N/A") {
      statusColor = "#e74c3c"; // Red
  } else {
      statusColor = "#3498db"; // Blue (other states)
  }

  // GPS Fix Helper
  const getGpsFixData = (fixType) => {
    switch (fixType) {
      case 0: return { label: "No Fix", color: "#e74c3c" };
      case 1: return { label: "GPS Fix", color: "#f39c12" };
      case 2: return { label: "Diff GPS", color: "#f39c12" };
      case 3: return { label: "RTK Float", color: "#f39c12" };
      case 4: return { label: "RTK Fixed", color: "#2ecc71" }; // Typically 4 or 5 is fixed
      case 5: return { label: "RTK Fixed", color: "#2ecc71" };
      default: return { label: `Type ${fixType || '?'}`, color: "#7f8c8d" };
    }
  };
  const fixData = getGpsFixData(fix);

  return (
    <div className="telemetry-drawer">
      
      {/* HEADER: Drone Visual & Status */}
      <div className="drawer-header-tele">
        <img src={droneIcon} className="drawer-drone-icon" alt="Drone Visual" />
        <div className="status-label" style={{ borderColor: statusColor }}>
          <span 
            className="status-dot" 
            style={{ 
                backgroundColor: statusColor,
                color: statusColor // used for shadow in CSS
            }} 
          />
          <span>{statusText}</span>
        </div>
      </div>

      {/* SECTION 1: FLIGHT METRICS */}
      <div className="section-title">Flight Data</div>
      <div className="telemetry-grid">
        <MetricCard 
            icon={BatteryIcon} 
            title="Battery" 
            value={battery !== null ? Number(battery).toFixed(0) : "--"} 
            unit="%" 
            color={batteryColor} 
        />
        <MetricCard 
            icon={Plane} 
            title="Flight Mode" 
            value={String(mode).toUpperCase().replace(/_/g, ' ')} 
            color="#3498db" 
        />
        <MetricCard 
            icon={Activity} 
            title="Altitude (AGL)" 
            value={altitude !== null ? Number(altitude).toFixed(1) : "--"} 
            unit="m" 
            color="#9b59b6"
        />
        <MetricCard 
            icon={Gauge} 
            title="Ground Speed" 
            value={groundspeed !== null ? Number(groundspeed).toFixed(1) : "--"} 
            unit="m/s" 
        />
        <MetricCard 
            icon={Compass} 
            title="Heading" 
            value={heading !== null ? Number(heading).toFixed(0) : "--"} 
            unit="°" 
        />
        <MetricCard 
            icon={Send} 
            title="3D Speed" 
            value={Number(vectorSpeed).toFixed(1)} 
            unit="m/s" 
        />
      </div>

      {/* SECTION 2: GPS & LOCATION */}
      <div className="section-title">Navigation</div>
      <div className="telemetry-grid cols-1">
        <MetricCard 
            icon={Target} 
            title="Coordinates" 
            value={lat && lon ? `${Number(lat).toFixed(6)}, ${Number(lon).toFixed(6)}` : "No GPS Data"} 
            color="#e67e22"
        />
      </div>
      <div className="telemetry-grid">
         <MetricCard 
            icon={Satellite} 
            title="Satellites" 
            value={sat ?? "--"} 
            color={sat >= 12 ? "#2ecc71" : (sat >= 6 ? "#f39c12" : "#e74c3c")} 
        />
        <MetricCard 
            icon={fixData.color === "#2ecc71" ? MapPin : AlertTriangle} 
            title="GPS Fix" 
            value={fixData.label} 
            color={fixData.color} 
        />
        <MetricCard 
            icon={MapPin} 
            title="Dist. to Home" 
            value={dfh !== null ? Number(dfh).toFixed(1) : "--"} 
            unit="m" 
        />
      </div>

      {/* SECTION 3: ENVIRONMENT (DOCK) */}
      <div className="section-title">Environment</div>
      <div className="telemetry-grid">
        <MetricCard 
            icon={Thermometer} 
            title="Temp" 
            value={dockTemp ?? "--"} 
            unit="°C" 
            color="#e74c3c"
        />
        <MetricCard 
            icon={CloudDrizzle} 
            title="Humidity" 
            value={dockHumidity ?? "--"} 
            unit="%" 
            color="#3498db"
        />
        <MetricCard 
            icon={Wind} 
            title="Wind" 
            value={dockWind ?? "--"} 
            unit="m/s" 
            color="#2ecc71"
        />
      </div>

    </div>
  );
}