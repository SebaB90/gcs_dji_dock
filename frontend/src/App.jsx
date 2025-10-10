import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import "./App.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAPBOX_STYLE_ID = "mapbox/satellite-v9";

const DEFAULT_CENTER = [44.5721, 11.2514];
const DEFAULT_ALT = 25;

// Icone personalizzate
const droneIcon = new L.Icon({
  iconUrl:
    "https://navigate.pl/wp-content/uploads/2024/04/EA220_drone-V1_%E7%99%BD%E5%BA%95%E5%9B%BE%E6%97%A0%E9%98%B4%E5%BD%B1_0829_020065-1.png",
  iconSize: [35, 35],
  iconAnchor: [17, 17],
});
const dockIcon = new L.Icon({
  iconUrl:
    "https://dronexcanada.ca/cdn/shop/files/DJI-Dock1_3.png?v=1711490763&width=480",
  iconSize: [50, 50],
  iconAnchor: [25, 25],
});

// Controlli mappa
function CustomControls({ position }) {
  const map = useMap();
  const handleRecenter = () => position && map.setView(position, 20);
  return (
    <div className="controls-wrapper">
      <button className="map-control-btn" onClick={() => map.zoomIn()}>
        +
      </button>
      <button className="map-control-btn" onClick={() => map.zoomOut()}>
        −
      </button>
      <button className="recenter-btn" onClick={handleRecenter}>
        📍
      </button>
    </div>
  );
}

export default function App() {
  const [drone, setDrone] = useState(null);
  const [hangar, setHangar] = useState(null);
  const [dronePos, setDronePos] = useState(null);
  const [dockPos, setDockPos] = useState(null);
  const [path, setPath] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [selectedAlt, setSelectedAlt] = useState(DEFAULT_ALT);
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

  // 🚀 Invio missione
  const sendMission = async () => {
    try {
      if (waypoints.length === 0) {
        alert("⚠️ Aggiungi almeno un waypoint prima di inviare la missione.");
        return;
      }

      const mission = {
        UAVCMD: {
          command: "MISSION_LOAD",
          parameters: {
            speed: 1,
            rth: true,
            photo: false,
            points: waypoints.map((wp) => ({
              lat: wp.lat,
              lon: wp.lon,
              alt: wp.alt,
            })),
          },
        },
      };

      const res = await axios.post(`${BACKEND_URL}/mission`, mission);
      if (res.data.status === "ok") alert("✅ Missione caricata correttamente!");
      else alert("⚠️ Errore nell'invio missione");
    } catch (err) {
      console.error("Errore invio missione:", err);
      alert("❌ Errore invio missione");
    }
  };

  // ✈️ Gestione Waypoints
  const handleAddWaypoint = () => {
    const base =
      waypoints.length > 0
        ? waypoints[waypoints.length - 1]
        : (dronePos && {
            lat: dronePos[0],
            lon: dronePos[1],
            alt: selectedAlt,
          }) ||
          (dockPos && { lat: dockPos[0], lon: dockPos[1], alt: selectedAlt }) ||
          { lat: DEFAULT_CENTER[0], lon: DEFAULT_CENTER[1], alt: selectedAlt };

    const delta = waypoints.length === 0 ? 0 : 0.00005;

    const newWp = {
      lat: base.lat + delta,
      lon: base.lon + delta,
      alt: selectedAlt,
    };

    setWaypoints((prev) => [...prev, newWp]);
  };

  const handleRemoveLast = () => {
    if (waypoints.length > 0) setWaypoints(waypoints.slice(0, -1));
  };

  const handleClearAll = () => setWaypoints([]);

  if (!drone || !hangar)
    return <div className="loading">🔄 Caricamento telemetria...</div>;

  const battery = drone.battery_level?.[0]?.value ?? 0;
  const batteryColor = battery < 20 ? "red" : battery < 60 ? "orange" : "green";
  const dock = drone.dock?.[0]?.value ?? {};
  const connected = drone.conn_status?.[0]?.value ?? false;

  return (
    <>
      {/* ===== SIDEBAR ===== */}
      <div className="sidebar">
        <h3>
          Telemetria UAV{" "}
          <span style={{ fontSize: "0.8em" }}>
            {connected ? "🟢 Online" : "🔴 Offline"}
          </span>
        </h3>

        {/* === Drone === */}
        <section>
          <h4>Drone</h4>
          <p>
            <strong>Battery:</strong>{" "}
            <span style={{ color: batteryColor }}>{battery}%</span>
          </p>
          <p>
            <strong>Lat:</strong>{" "}
            {dronePos ? dronePos[0].toFixed(6) : "-"}
          </p>
          <p>
            <strong>Lon:</strong>{" "}
            {dronePos ? dronePos[1].toFixed(6) : "-"}
          </p>
          <p>
            <strong>Alt:</strong> {drone.alt?.[0]?.value ?? "-"}
          </p>
          <p>
            <strong>Speed:</strong> {drone.groundspeed?.[0]?.value ?? "-"}
          </p>
          <p>
            <strong>Status:</strong> {drone.status?.[0]?.value ?? "-"}
          </p>
          <p>
            <strong>Mode:</strong> {drone.mode?.[0]?.value ?? "-"}
          </p>
          <p>
            <strong>Heading:</strong> {drone.heading?.[0]?.value ?? "-"}
          </p>
        </section>

        {/* === Dock === */}
        <section>
          <h4>Dock</h4>
          <p>
            <strong>Cover:</strong> {dock.cover_state ?? "-"}
          </p>
          <p>
            <strong>Drone in dock:</strong>{" "}
            {dock.drone_in_dock ? "✅" : "❌"}
          </p>
          <p>
            <strong>Dock mode:</strong> {dock.dock_mode ?? "-"}
          </p>
          <p>
            <strong>Temp:</strong> {dock.dock_temperature ?? "-"}°C
          </p>
          <p>
            <strong>Humidity:</strong> {dock.humidity ?? "-"}%
          </p>
          <p>
            <strong>Wind:</strong> {dock.wind_speed ?? "-"} m/s
          </p>
        </section>

        {/* === Waypoints === */}
        <section>
          <h4>Waypoints</h4>

          <div style={{ marginBottom: "10px" }}>
            <label htmlFor="altitude" style={{ fontWeight: 600 }}>
              Altitudine (m):
            </label>
            <input
              type="number"
              id="altitude"
              min="1"
              max="200"
              step="1"
              value={selectedAlt}
              onChange={(e) => setSelectedAlt(Number(e.target.value))}
              style={{
                width: "100%",
                marginTop: "6px",
                padding: "6px",
                fontSize: "14px",
                borderRadius: "6px",
                border: "1px solid #ccc",
              }}
            />
          </div>

          <div className="wp-list">
            {waypoints.length === 0 ? (
              <p style={{ color: "#777" }}>Nessun waypoint</p>
            ) : (
              waypoints.map((wp, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "6px",
                    gap: "6px",
                  }}
                >
                  <strong>WP{i + 1}:</strong>
                  <span style={{ flexGrow: 1, fontSize: "13px" }}>
                    {wp.lat.toFixed(5)}, {wp.lon.toFixed(5)}
                  </span>
                  <input
                    type="number"
                    value={wp.alt}
                    min="1"
                    max="200"
                    step="1"
                    onChange={(e) => {
                      const newAlt = Number(e.target.value);
                      const updated = [...waypoints];
                      updated[i].alt = newAlt;
                      setWaypoints(updated);
                    }}
                    style={{
                      width: "60px",
                      fontSize: "13px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                    }}
                  />
                </div>
              ))
            )}
          </div>

          <div className="wp-buttons">
            <button onClick={handleAddWaypoint} disabled={!dronePos && !dockPos}>
              ➕ Aggiungi WP
            </button>
            <button onClick={handleRemoveLast}>➖ Rimuovi ultimo</button>
            <button onClick={handleClearAll}>🚮 Reset</button>
          </div>
        </section>

        <button onClick={sendMission}>🚀 Avvia missione</button>

        <button
          onClick={() => setShowAll((prev) => !prev)}
          style={{
            backgroundColor: showAll ? "#f39c12" : "#4caf50",
            marginTop: "10px",
          }}
        >
          {showAll ? "🔽 Riduci dettagli" : "🔼 Mostra tutti i dati"}
        </button>

        {showAll && (
          <section style={{ maxHeight: "50vh", overflowY: "auto" }}>
            <h4>Dati completi</h4>
            <pre
              style={{
                fontSize: "12px",
                background: "#f0f0f0",
                padding: "10px",
                borderRadius: "8px",
              }}
            >
              {JSON.stringify({ drone, hangar }, null, 2)}
            </pre>
          </section>
        )}
      </div>

      {/* ===== MAPPA ===== */}
      <MapContainer
        center={dockPos ?? dronePos ?? DEFAULT_CENTER}
        zoom={20}
        scrollWheelZoom
        zoomControl={false}
        style={{
          height: "100vh",
          width: "100vw",
          position: "relative",
          zIndex: 1,
        }}
      >
        <TileLayer
          url={`https://api.mapbox.com/styles/v1/${MAPBOX_STYLE_ID}/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`}
          tileSize={512}
          zoomOffset={-1}
          maxZoom={22}
          attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
        />

        {dockPos && <Marker position={dockPos} icon={dockIcon} />}
        {dronePos && <Marker position={dronePos} icon={droneIcon} />}
        {path.length > 1 && <Polyline positions={path} color="blue" />}

        {waypoints.map((wp, i) => (
          <Marker
            key={i}
            position={[wp.lat, wp.lon]}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const newPos = e.target.getLatLng();
                const newWps = [...waypoints];
                newWps[i] = { ...wp, lat: newPos.lat, lon: newPos.lng };
                setWaypoints(newWps);
              },
            }}
          >
            <Tooltip permanent>{`WP${i + 1}`}</Tooltip>
          </Marker>
        ))}
        <Polyline positions={waypoints.map((wp) => [wp.lat, wp.lon])} color="red" />
        <CustomControls position={dronePos ?? dockPos} />
      </MapContainer>
    </>
  );
}
