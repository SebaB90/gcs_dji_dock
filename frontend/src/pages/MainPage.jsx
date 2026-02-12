import { useState, useEffect, useRef } from "react";
import dockService from "../services/dock.service";
import missionService from "../services/mission.service";
import { useAuth } from "../context/AuthContext";

// Import dei componenti componenti
import MapView from "../components/map/MapView";
import VideoPanel from "../components/panels/VideoPanel";
import MissionStatusPanel from "../components/panels/MissionStatusPanel";
import MainSidebar from "../components/layout/MainSidebar";
import SidebarDrawer from "../components/layout/SidebarDrawer";

import "./MainPage.css";

const DEFAULT_CENTER = [44.5721, 11.2514];
const DOCK1_NAME = "dock1";
const DOCK2_NAME = "dock2";

export default function MainPage() {
  const { logout } = useAuth();

  // Stati Dati Dock 1
  const [telemetry1, setTelemetry1] = useState(null);
  const [dronePos1, setDronePos1] = useState(DEFAULT_CENTER);
  const [dockPos1, setDockPos1] = useState(null);

  // Stati Dati Dock 2
  const [telemetry2, setTelemetry2] = useState(null);
  const [dronePos2, setDronePos2] = useState(DEFAULT_CENTER);
  const [dockPos2, setDockPos2] = useState(null);
  
  // Missioni
  const [scheduledMissions, setScheduledMissions] = useState([]);
  const [activeExecutions, setActiveExecutions] = useState([]);
  
  // Stati UI
  const [drawerSection, setDrawerSection] = useState(null);
  const [waypoints, setWaypoints] = useState([]);

  // Logica Split View Orizzontale (Map | Dashboard)
  const [leftWidth, setLeftWidth] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const splitContainerRef = useRef(null);

  // Logica Split View Verticale (Video | Missions)
  const [topHeight, setTopHeight] = useState(50);
  const [isResizingVertical, setIsResizingVertical] = useState(false);
  const rightPaneRef = useRef(null);

  const startResizing = () => setIsResizing(true);
  const stopResizing = () => {
    setIsResizing(false);
    setIsResizingVertical(false);
  };

  const startVerticalResizing = () => setIsResizingVertical(true);

  const resize = (e) => {
    if (isResizing && splitContainerRef.current) {
        const rect = splitContainerRef.current.getBoundingClientRect();
        const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
        if (newWidth > 20 && newWidth < 80) setLeftWidth(newWidth);
    }

    if (isResizingVertical && rightPaneRef.current) {
        const rect = rightPaneRef.current.getBoundingClientRect();
        const newHeight = ((e.clientY - rect.top) / rect.height) * 100;
        if (newHeight > 20 && newHeight < 80) setTopHeight(newHeight);
    }
  };

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
        window.removeEventListener("mousemove", resize);
        window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, isResizingVertical]);

  // Polling Telemetria Dock 1
  useEffect(() => {
    const fetchTelemetry1 = async () => {
      try {
        const data = await dockService.getTelemetry(DOCK1_NAME);
        setTelemetry1(data);

        // Estrai coordinate drone dalla telemetria completa ThingsBoard
        const lat = parseFloat(data.latitude?.[0]?.value);
        const lon = parseFloat(data.longitude?.[0]?.value);
        if (!isNaN(lat) && !isNaN(lon)) setDronePos1([lat, lon]);

        // Estrai coordinate dock (usa le stesse coordinate per ora)
        if (!isNaN(lat) && !isNaN(lon)) setDockPos1([lat, lon]);

      } catch (err) {
        console.error("Telemetry error dock1", err);
      }
    };

    fetchTelemetry1();
    const interval = setInterval(fetchTelemetry1, 2000);
    return () => clearInterval(interval);
  }, []);

  // Polling Telemetria Dock 2
  useEffect(() => {
    const fetchTelemetry2 = async () => {
      try {
        const data = await dockService.getTelemetry(DOCK2_NAME);
        setTelemetry2(data);

        // Estrai coordinate drone dalla telemetria completa ThingsBoard
        const lat = parseFloat(data.latitude?.[0]?.value);
        const lon = parseFloat(data.longitude?.[0]?.value);
        if (!isNaN(lat) && !isNaN(lon)) setDronePos2([lat, lon]);

        // Estrai coordinate dock (usa le stesse coordinate per ora)
        if (!isNaN(lat) && !isNaN(lon)) setDockPos2([lat, lon]);

      } catch (err) {
        console.error("Telemetry error dock2", err);
      }
    };

    fetchTelemetry2();
    const interval = setInterval(fetchTelemetry2, 2000);
    return () => clearInterval(interval);
  }, []);

  // Polling Missioni Schedulate e In Esecuzione
  useEffect(() => {
    const fetchMissions = async () => {
      try {
        // Fetch scheduled missions
        const schedules = await missionService.getSchedules();
        setScheduledMissions(schedules.filter(s => s.enabled && s.next_execution));
        
        // Fetch active executions
        const executions = await missionService.getActiveExecutions();
        setActiveExecutions(executions);
      } catch (err) {
        console.error("Error fetching missions:", err);
      }
    };

    fetchMissions();
    const interval = setInterval(fetchMissions, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`app-container ${isResizing || isResizingVertical ? 'resizing' : ''}`}>

      {/* Sidebar Area */}
      <div className="sidebar-area">
        <MainSidebar
            activeSection={drawerSection}
            onSelect={setDrawerSection}
            onLogout={logout}
        />

        <SidebarDrawer
          section={drawerSection}
          onClose={() => setDrawerSection(null)}
          telemetry={drawerSection === "dock2" ? telemetry2 : telemetry1}
          waypoints={waypoints}
          setWaypoints={setWaypoints}
          dronePos={drawerSection === "dock2" ? dronePos2 : dronePos1}
          dockPos={drawerSection === "dock2" ? dockPos2 : dockPos1}
          backendUrl={import.meta.env.VITE_BACKEND_URL}
        />
      </div>

      {/* Split View: Map | Dashboard */}
      <div className="split-view-container" ref={splitContainerRef}>
        <div className="left-pane-map" style={{ width: `${leftWidth}%` }}>
          <MapView
            dronePos={dronePos1}
            dockPos={dockPos1}
            isResizing={isResizing}
            waypoints={waypoints}
            setWaypoints={setWaypoints}
            scheduledMissions={scheduledMissions}
            activeExecutions={activeExecutions}
          />
        </div>

        <div className="gutter-col" onMouseDown={startResizing}></div>

        <div className="right-pane-dashboard" style={{ width: `${100 - leftWidth}%` }} ref={rightPaneRef}>
          <div className="top-pane-video" style={{ height: `${topHeight}%` }}>
            <VideoPanel
              telemetry={telemetry1}
              dronePos={dronePos1}
              dockPos={dockPos1}
              backendUrl={import.meta.env.VITE_BACKEND_URL}
            />
          </div>

          <div className="gutter-row" onMouseDown={startVerticalResizing}></div>

          <div className="bottom-pane-missions" style={{ height: `${100 - topHeight}%` }}>
            <MissionStatusPanel />
          </div>
        </div>
      </div>
    </div>
  );
}