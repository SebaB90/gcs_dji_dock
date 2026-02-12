import {
  MdAirplanemodeActive,
  MdAssignment,
  MdTimeline,
  MdWarehouse,
  MdLogout,
  MdPeople
} from "react-icons/md";
import { useAuth } from "../../context/AuthContext";
import "./MainSidebar.css";

const LOGO_PATH = "/logo-fr-medium.png";

export default function MainSidebar({ onSelect, onLogout, activeSection }) {
  const { user } = useAuth();

  const handleClick = (section) => {
    onSelect(section === activeSection ? null : section);
  };

  return (
    <div className="main-sidebar">
      
      {/* 1. LOGO */}
      <div className="logo-container">
        <img src={LOGO_PATH} alt="Logo" className="company-logo" />
      </div>

      <hr className="separator" />

      {/* 3. NAVIGAZIONE PRINCIPALE (Top) */}
      <div className="navigation-compact">

        <div
          className={`nav-item ${activeSection === "dock1" ? "active" : ""}`}
          onClick={() => handleClick("dock1")}
          title="Dock 1"
        >
          <MdWarehouse className="nav-icon" />
          <span className="nav-label">Dock 1</span>
        </div>

        <div
          className={`nav-item ${activeSection === "dock2" ? "active" : ""}`}
          onClick={() => handleClick("dock2")}
          title="Dock 2"
        >
          <MdWarehouse className="nav-icon" />
          <span className="nav-label">Dock 2</span>
        </div>

        {/* COMMENTED OUT - Health Status
        <div
          className={`nav-item ${activeSection === "health" ? "active" : ""}`}
          onClick={() => handleClick("health")}
          title="Health Status"
        >
          <MdTimeline className="nav-icon" />
          <span className="nav-label">Health</span>
        </div>
        */}

        <div
          className={`nav-item ${activeSection === "mission" ? "active" : ""}`}
          onClick={() => handleClick("mission")}
          title="Mission Manager"
        >
          <MdAssignment className="nav-icon" />
          <span className="nav-label">Mission</span>
        </div>

        {/* COMMENTED OUT - Dock & Weather
        <div
          className={`nav-item ${activeSection === "weather" ? "active" : ""}`}
          onClick={() => handleClick("weather")}
          title="Dock & Weather"
        >
          <MdWarehouse className="nav-icon" />
          <span className="nav-label">Dock</span>
        </div>
        */}

      </div>

      {/* SPAZIATORE: Spinge tutto quello che c'è sotto verso il fondo */}
      <div style={{ flex: 1 }}></div>

      {/* 4. FOOTER (Admin + Logout) */}
      <div className="sidebar-footer">
        
        { /* Pulsante Users per gestire utenti (Mostrato solo se lo user attuale è Admin) */}
        {user?.role === 'admin' && (
          <div
            className={`nav-item admin-item ${activeSection === "users" ? "active" : ""}`} 
            onClick={() => handleClick("users")}
            title="User Management"
          >
            <MdPeople className="nav-icon" />
            <span className="nav-label">Users</span>
          </div>
        )}

        {/* Logout */}
        <div className="nav-item logout-btn" onClick={onLogout} title="Logout">
          <MdLogout className="nav-icon" />
          <span className="nav-label">Logout</span>
        </div>
      </div>

    </div>
  );
}