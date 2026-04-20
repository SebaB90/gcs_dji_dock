import { MdClose } from "react-icons/md";

// Import dei pannelli
import TelemetryPanel from "../panels/TelemetryPanel";
import MissionManager from "../mission/MissionManager";
import UsersManagement from "../admin/UsersManagement";

import "./SidebarDrawer.css";

export default function SidebarDrawer({
  section,
  onClose,
  telemetry,
  waypoints,
  setWaypoints,
  mapCenter,
  dronePos,
  dockPos,
  backendUrl
}) {
  
  // Se nessuna sezione è selezionata, il drawer non deve renderizzare nulla (o essere chiuso via CSS)
  // Nota: La classe 'open' gestisce la visibilità, ma qui preveniamo rendering inutili
  
  // Funzione per il titolo dinamico
  const getTitle = (s) => {
    switch (s) {
      case "dock1":     return "Dock 1 - Telemetry Overview";
      case "dock2":     return "Dock 2 - Telemetry Overview";
      case "mission":   return "Mission Manager";
      case "users":     return "Admin User Management";
      default:          return "Details";
    }
  };

  return (
    <div className={`drawer ${section ? "open" : ""}`}>
      
      {/* Header del Drawer */}
      <div className="drawer-header">
        <h2 className="drawer-title">{getTitle(section)}</h2>
        <button className="drawer-close" onClick={onClose}>
            <MdClose className="close-icon" /> 
        </button>
      </div>
      
      {/* Contenuto Dinamico */}
      <div className="drawer-content">

        {section === "dock1" && (
          <TelemetryPanel telemetry={telemetry} />
        )}

        {section === "dock2" && (
          <TelemetryPanel telemetry={telemetry} />
        )}

        {section === "mission" && (
          <MissionManager
            waypoints={waypoints}
            setWaypoints={setWaypoints}
            mapCenter={mapCenter}
            dronePos={dronePos}
            dockPos={dockPos}
            backendUrl={backendUrl}
          />
        )}

        {/* Sezione Admin */}
        {section === "users" && (
          <UsersManagement />
        )}

      </div>

    </div>
  );
}