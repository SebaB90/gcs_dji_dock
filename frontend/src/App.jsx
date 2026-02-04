import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

import MapView from "./components/MapView";
import VideoPanel from "./components/VideoPanel"; // Questo ora è la Dashboard destra
import MainSidebar from "./components/MainSidebar";
import SidebarDrawer from "./components/SidebarDrawer";
import LoginScreen from "./components/LoginScreen";

import "./styles/App.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
const DEFAULT_CENTER = [44.5721, 11.2514];

export default function App() {
  // --- AUTHENTICATION STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  
  // --- STATI DATI ---
  const [drone, setDrone] = useState(null);
  const [hangar, setHangar] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [dronePos, setDronePos] = useState(DEFAULT_CENTER);
  const [dockPos, setDockPos] = useState(null);
  const [path, setPath] = useState([]);
  const [waypoints, setWaypoints] = useState([]);
  
  // --- STATI UI ---
  const [drawerSection, setDrawerSection] = useState(null);
  
  // --- LOGICA SPLIT VIEW ---
  const [leftWidth, setLeftWidth] = useState(50); // % larghezza mappa iniziale
  const [isResizing, setIsResizing] = useState(false);
  const splitContainerRef = useRef(null);

  // Handler inizio trascinamento
  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  // Handler fine trascinamento
  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Handler movimento mouse (calcolo %)
  const resize = useCallback((mouseMoveEvent) => {
    if (isResizing && splitContainerRef.current) {
      const containerRect = splitContainerRef.current.getBoundingClientRect();
      const newLeftWidth = ((mouseMoveEvent.clientX - containerRect.left) / containerRect.width) * 100;
      
      // Limiti min/max (es. Mappa min 20%, max 80%)
      if (newLeftWidth > 20 && newLeftWidth < 80) {
        setLeftWidth(newLeftWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);


  // 🔐 Verifica token all'avvio dell'app
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("gcs_token");
      const tokenExpires = localStorage.getItem("gcs_token_expires");
      
      if (!token || !tokenExpires) {
        setIsCheckingAuth(false);
        return;
      }
      
      // Check if token is expired
      if (Date.now() > parseInt(tokenExpires)) {
        localStorage.removeItem("gcs_token");
        localStorage.removeItem("gcs_token_expires");
        localStorage.removeItem("gcs_username");
        setIsCheckingAuth(false);
        return;
      }
      
      // Verify token with backend
      try {
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        const response = await axios.get(`${BACKEND_URL}/verify-token`);
        
        setCurrentUser(response.data);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Token verification failed:", error);
        localStorage.removeItem("gcs_token");
        localStorage.removeItem("gcs_token_expires");
        localStorage.removeItem("gcs_username");
      } finally {
        setIsCheckingAuth(false);
      }
    };
    
    checkAuth();
  }, []);

  // 🔐 Session timeout check (every minute)
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const interval = setInterval(() => {
      const tokenExpires = localStorage.getItem("gcs_token_expires");
      
      if (!tokenExpires || Date.now() > parseInt(tokenExpires)) {
        handleLogout();
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // 🔐 Logout function
  const handleLogout = async () => {
    try {
      await axios.post(`${BACKEND_URL}/logout`);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear token and state
      localStorage.removeItem("gcs_token");
      localStorage.removeItem("gcs_token_expires");
      localStorage.removeItem("gcs_username");
      delete axios.defaults.headers.common["Authorization"];
      setIsAuthenticated(false);
      setCurrentUser(null);
    }
  };

  // 🔐 Login success handler
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    const username = localStorage.getItem("gcs_username");
    setCurrentUser({ username });
  };


  // 📡 Lettura telemetria
  useEffect(() => {
    if (!isAuthenticated) return; // Don't fetch telemetry if not authenticated
    
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/telemetry`);
        const data = res.data;
        setTelemetry(data);
        setDrone(data.drone); // legacy, can be removed after migration
        setHangar(data.hangar); // legacy, can be removed after migration

        const lat = parseFloat(data.drone?.lat?.[0]?.value);
        const lon = parseFloat(data.drone?.lon?.[0]?.value);
        if (!isNaN(lat) && !isNaN(lon)) {
          setDronePos([lat, lon]);
        }

        const hLat = parseFloat(data.hangar?.home_latitude?.[0]?.value) || parseFloat(data.hangar?.lat?.[0]?.value);
        const hLon = parseFloat(data.hangar?.home_longitude?.[0]?.value) || parseFloat(data.hangar?.lon?.[0]?.value);
        if (!isNaN(hLat) && !isNaN(hLon)) setDockPos([hLat, hLon]);
      } catch (err) {
        console.error("❌ Telemetry error:", err);
        
        // If we get a 401, the token is invalid - logout
        if (err.response?.status === 401) {
          handleLogout();
        }
      }
    }, 2000); // 2000ms = 0.5 updates per second (reduced to avoid rate limiting)
    return () => clearInterval(interval);
  }, [isAuthenticated]);


  // If checking authentication, show loading
  if (isCheckingAuth) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0e0e0e',
        color: '#ccc',
        fontSize: '14px'
      }}>
        <div>Verifying authentication...</div>
      </div>
    );
  }

  // If not authenticated, show login screen
  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className={`app-container ${isResizing ? 'resizing' : ''}`}>

      {/* 1. SIDEBAR (Fissa) */}
      <div className="sidebar-area">
        <MainSidebar
            drone={drone}
            hangar={hangar}
            onSelect={setDrawerSection}
            onLogout={handleLogout}
        />
        <SidebarDrawer
          section={drawerSection}
          onClose={() => setDrawerSection(null)}
          telemetry={telemetry}
          drone={drone}
          hangar={hangar}
          waypoints={waypoints}
          setWaypoints={setWaypoints}
          dronePos={dronePos}
          dockPos={dockPos}
          backendUrl={BACKEND_URL}
        />
      </div>

      {/* 2. SPLIT CONTAINER (Mappa | Dashboard) */}
      <div className="split-view-container" ref={splitContainerRef}>
        
        {/* PANNELLO SINISTRO: MAPPA */}
        <div className="left-pane-map" style={{ width: `${leftWidth}%` }}>
          <MapView
            dronePos={dronePos}
            dockPos={dockPos}
            path={path}
            waypoints={waypoints}
            setWaypoints={setWaypoints}
            // Passiamo flag per dire alla mappa di aggiornare le dimensioni
            isResizing={isResizing} 
          />
        </div>

        {/* MANIGLIA DI TRASCINAMENTO */}
        <div className="gutter-col" onMouseDown={startResizing}></div>

        {/* PANNELLO DESTRO: DASHBOARD (Video + Strumenti) */}
        <div className="right-pane-dashboard" style={{ width: `${100 - leftWidth}%` }}>
          <VideoPanel 
            telemetry={telemetry}
            dronePos={dronePos}
            dockPos={dockPos}
            backendUrl={BACKEND_URL}
          />
        </div>

      </div>
    </div>
  );
}