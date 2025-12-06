import "../styles/SidebarDrawer.css";
import TelemetryPanel from "./TelemetryPanel";
import MissionManager from "./MissionManager";
import WeatherPanel from "./WeatherPanel";
import HealthPanel from "./HealthPanel"; // Import del nuovo pannello
import { MdClose } from "react-icons/md"; 

export default function SidebarDrawer({ section, onClose, drone, hangar, waypoints, setWaypoints, dronePos, dockPos, backendUrl }) {
  
  if (!section || section === "video") { 
    return null;
  }

  // Funzione per determinare il titolo del pannello
  const getTitle = (s) => {
    switch (s) {
      case "telemetry":
        return "Drone Telemetry Overview";
      case "health": // Nuovo Titolo
        return "Drone Health & History";
      case "mission":
        return "Mission Manager";
      case "weather":
        return "Weather & Dock Status";
      default:
        return "Details";
    }
  };

  return (
    <div className="drawer">
      
      <div className="drawer-header">
        <h2 className="drawer-title">{getTitle(section)}</h2>
        <button className="drawer-close" onClick={onClose}>
            <MdClose className="close-icon" /> 
        </button>
      </div>
      
      <div className="drawer-content">
        {section === "telemetry" && (
          <TelemetryPanel drone={drone} hangar={hangar} dronePos={dronePos} />
        )}
        
        {/* NUOVA SEZIONE */}
        {section === "health" && (
          <HealthPanel drone={drone} />
        )}

        {section === "mission" && (
          <MissionManager
            waypoints={waypoints}
            setWaypoints={setWaypoints}
            dronePos={dronePos}
            dockPos={dockPos}
            backendUrl={backendUrl}
          />
        )}

        {section === "weather" && (
          <WeatherPanel drone={drone} hangar={hangar} />
        )}
      </div>

    </div>
  );
}