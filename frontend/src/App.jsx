import { useState, useEffect } from "react";
import axios from "axios";
import MapView from "./components/MapView";
import MissionManager from "./components/MissionManager";
import "./styles/App.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

export default function App() {
  const [drone, setDrone] = useState(null);
  const [hangar, setHangar] = useState(null);
  const [dronePos, setDronePos] = useState(null);
  const [dockPos, setDockPos] = useState(null);
  const [path, setPath] = useState([]);
  const [waypoints, setWaypoints] = useState([]);

  // 📡 Lettura telemetria
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/telemetry`);
        const data = res.data;

        setDrone(data.drone);
        setHangar(data.hangar);

        const lat = parseFloat(data.drone?.lat?.[0]?.value);
        const lon = parseFloat(data.drone?.lon?.[0]?.value);
        if (!isNaN(lat) && !isNaN(lon)) {
          setDronePos([lat, lon]);
          setPath((prev) =>
            prev.length === 0 ? [[lat, lon]] : [...prev.slice(-100), [lat, lon]]
          );
        }

        const hLat =
          parseFloat(data.hangar?.home_latitude?.[0]?.value) ||
          parseFloat(data.hangar?.lat?.[0]?.value);
        const hLon =
          parseFloat(data.hangar?.home_longitude?.[0]?.value) ||
          parseFloat(data.hangar?.lon?.[0]?.value);
        if (!isNaN(hLat) && !isNaN(hLon)) setDockPos([hLat, hLon]);
      } catch (err) {
        console.error("❌ Errore lettura telemetria:", err);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      <div className="sidebar">
        <MissionManager
          drone={drone}
          hangar={hangar}
          waypoints={waypoints}
          setWaypoints={setWaypoints}
          dockPos={dockPos}
          dronePos={dronePos}
        />
      </div>

      <div className="map-wrapper">
        <MapView
          dronePos={dronePos}
          dockPos={dockPos}
          path={path}
          waypoints={waypoints}
          setWaypoints={setWaypoints}
        />
      </div>
    </div>
  );
}
