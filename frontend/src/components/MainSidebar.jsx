import { useState } from "react";
import "../styles/MainSidebar.css";
import {
  MdAirplanemodeActive,
  MdSatelliteAlt,
  MdAssignment,
  MdWifi,
  MdBatteryChargingFull,
  MdTimeline,
  MdWarehouse,
  MdLogout
} from "react-icons/md";

// Componente di supporto per un indicatore pulito
const StatusIndicator = ({ label, value, icon: Icon, isCritical }) => (
  <div className={`status-indicator ${isCritical ? 'critical' : ''}`}>
    <Icon className="indicator-icon" />
    <div className="indicator-label">{label}</div>
    <div className="indicator-value">{value}</div>
  </div>
);

// Definizione del percorso del logo
const LOGO_PATH = "/logo-fr-medium.png";

export default function MainSidebar({ drone, hangar, onSelect, onLogout }) {
  const [active, setActive] = useState(null);

  const handleClick = (section) => {
    const newSection = section === active ? null : section;
    setActive(newSection);
    onSelect(newSection);
  };

  // 1. Pulizia dei dati e calcoli essenziali
  const battery = drone?.battery_level?.[0]?.value ?? 0; 
  const sats = drone?.gps_num_satellites?.[0]?.value ?? "--";
  const wpCount = 0; 
  const rssi = -75;
  
  // Condizione di allerta
  const isBatteryLow = battery < 20 && battery !== 0; 
  const isGpsPoor = sats !== '--' && sats < 8; 
  const isRssiCritical = rssi < -80; 

  return (
    <div className="main-sidebar">
      
      {/* LOGO */}
      <div className="logo-container">
        <img 
          src={LOGO_PATH} 
          alt="Logo Azienda" 
          className="company-logo" 
        />
      </div>

      <hr className="separator" />
      
      {/* BARRA DI STATO RAPIDO */}
      <div className="status-bar-compact">
        
        {/* Batteria Drone */}
        <div className="battery-bar">
          <MdBatteryChargingFull 
            className="battery-icon" 
            style={{color: isBatteryLow ? '#ff6347' : (battery > 0 ? '#2ecc71' : '#999')}} 
          />
          <progress value={battery} max="100" className={isBatteryLow ? 'low-battery' : ''}></progress>
          <span className="battery-value">{battery.toFixed(0)}%</span>
        </div>
        
        <StatusIndicator 
          label="Link" 
          value={`${rssi} dBm`} 
          icon={MdWifi} 
          isCritical={isRssiCritical} 
        />
        
        <StatusIndicator 
          label="GPS" 
          value={`${sats} sats`} 
          icon={MdSatelliteAlt} 
          isCritical={isGpsPoor} 
        />
      </div>
      
      <hr className="separator" />

      {/* NAVIGAZIONE */}
      <div className="navigation-compact">
        <div
          className={`nav-item ${active === "telemetry" ? "active" : ""}`}
          onClick={() => handleClick("telemetry")}
        >
          <MdAirplanemodeActive className="nav-icon" />
          <span className="nav-label">Telemetry</span>
        </div>
        
        <div
          className={`nav-item ${active === "health" ? "active" : ""}`}
          onClick={() => handleClick("health")}
        >
          <MdTimeline className="nav-icon" />
          <span className="nav-label">Health</span>
        </div>

        <div
          className={`nav-item ${active === "mission" ? "active" : ""}`}
          onClick={() => handleClick("mission")}
        >
          <MdAssignment className="nav-icon" />
          <span className="nav-label">Mission ({wpCount})</span>
        </div>
        
        <div
          className={`nav-item ${active === "weather" ? "active" : ""}`} 
          onClick={() => handleClick("weather")} 
        >
          <MdWarehouse className="nav-icon" />
          <span className="nav-label">Dock Info</span>
        </div>
      </div>

      <hr className="separator" />

      {/* LOGOUT BUTTON */}
      <div className="logout-section">
        <div className="nav-item logout-btn" onClick={onLogout}>
          <MdLogout className="nav-icon" />
          <span className="nav-label">Logout</span>
        </div>
      </div>
    </div>
  );
}