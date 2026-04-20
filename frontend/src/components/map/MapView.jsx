import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./MapView.css"; 
import { useEffect, useState, useRef } from "react";
import L from "leaflet";
import { MdGpsFixed } from "react-icons/md"; 

// --- CONFIGURAZIONE ---
const DEFAULT_CENTER = [44.5721, 11.2514];
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAPBOX_STYLE_ID = "satellite-v9";

// --- ICONE ---
const droneIcon = new L.Icon({
  iconUrl: "https://navigate.pl/wp-content/uploads/2024/04/EA220_drone-V1_%E7%99%BD%E5%BA%95%E5%9B%BE%E6%97%A0%E9%98%B4%E5%BD%B1_0829_020065-1.png",
  iconSize: [35, 35],
  iconAnchor: [17, 17],
  className: 'smooth-drone-marker glow-marker', // Add glow class
});
const dockIcon = new L.Icon({
  iconUrl: "https://dronexcanada.ca/cdn/shop/files/DJI-Dock1_3.png?v=1711490763&width=480",
  iconSize: [50, 50],
  iconAnchor: [25, 25],
  className: 'glow-marker', // Add glow class
});

// --------------------------------------------------------
// 1. GESTORE RESIZE
// --------------------------------------------------------
function MapResizeHandler({ isResizing }) {
  const map = useMap();
  
  useEffect(() => {
    const triggerResize = () => { map.invalidateSize(); };
    triggerResize();
    
    const timer = setTimeout(() => triggerResize(), 10);
    window.addEventListener("resize", triggerResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", triggerResize);
    };
  }, [map, isResizing]);

  return null;
}

// --------------------------------------------------------
// 2. CONTROLLI ZOOM E RECENTER (Stile Aggiornato)
// --------------------------------------------------------
function MapControls({ dronePos }) {
  const map = useMap();

  // Stop propagation per evitare click sulla mappa
  const prevent = (e) => { e.stopPropagation(); e.preventDefault(); };
  const zoomIn = (e) => { prevent(e); map.zoomIn(); };
  const zoomOut = (e) => { prevent(e); map.zoomOut(); };
  const recenter = (e) => {
    prevent(e);
    if (dronePos) {
      map.flyTo(dronePos, map.getZoom(), { animate: true, duration: 1 });
    } else {
      map.flyTo(DEFAULT_CENTER, map.getZoom());
    }
  };

  return (
    <div className="custom-map-controls" onMouseDown={prevent} onDoubleClick={prevent}>

      {/* Gruppo Zoom (+ e - uniti) */}
      <div className="ctrl-group">
        <button className="ctrl-btn" onClick={zoomIn}>+</button>
        <button className="ctrl-btn" onClick={zoomOut}>−</button>
      </div>

      {/* Pulsante Recenter (Staccato) */}
      <button className="ctrl-btn recenter" onClick={recenter} title="Centra sul Drone">
        <MdGpsFixed />
      </button>

    </div>
  );
}

// --------------------------------------------------------
// 3. MAP CENTER TRACKER
// --------------------------------------------------------
function MapCenterTracker({ setMapCenter }) {
  const map = useMap();

  useEffect(() => {
    const updateCenter = () => {
      const center = map.getCenter();
      setMapCenter([center.lat, center.lng]);
    };

    // Update on moveend (after user finishes panning)
    map.on('moveend', updateCenter);

    // Update initial center
    updateCenter();

    return () => {
      map.off('moveend', updateCenter);
    };
  }, [map, setMapCenter]);

  return null;
}

// ====================================================================
// COMPONENTE PRINCIPALE MAPVIEW
// ====================================================================
export default function MapView({
    dronePos, dockPos, path, waypoints, setWaypoints, setMapCenter, isResizing,
    scheduledMissions = [],
    activeExecutions = []
}) {
  const [useFallback, setUseFallback] = useState(false);

  // Get the next scheduled mission (first in array, already sorted)
  const nextScheduledMission = scheduledMissions.length > 0 ? scheduledMissions[0] : null;
  
  // Get active execution mission
  const activeMission = activeExecutions.length > 0 ? activeExecutions[0] : null;
  
  // Show legend only if there are missions to display
  const showLegend = nextScheduledMission || activeMission;

  return (
    // Usa la classe map-wrapper definita nel CSS
    <div className="map-wrapper">
      
      {/* Mission Legend */}
      {showLegend && (
        <div className="mission-legend">
          <div className="legend-title">Mission Routes</div>
          {activeMission && (
            <div className="legend-item">
              <div className="legend-marker executing"></div>
              <span>Executing: {activeMission.mission?.name || 'Unknown'}</span>
            </div>
          )}
          {nextScheduledMission && (
            <div className="legend-item">
              <div className="legend-marker scheduled"></div>
              <span>Scheduled: {nextScheduledMission.mission?.name || 'Unknown'}</span>
            </div>
          )}
        </div>
      )}
      
      <MapContainer
        center={dronePos ?? dockPos ?? DEFAULT_CENTER}
        zoom={18}
        minZoom={3}
        maxZoom={22}
        zoomControl={false}
        preferCanvas={true}
        style={{ width: "100%", height: "100%" }}
      >
        {!useFallback ? (
          <TileLayer
            url={`https://api.mapbox.com/styles/v1/mapbox/${MAPBOX_STYLE_ID}/tiles/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`}
            tileSize={512}
            zoomOffset={-1}
            maxZoom={22}
            attribution='© Mapbox'
            eventHandlers={{ tileerror: () => setUseFallback(true) }}
          />
        ) : (
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} attribution='© OSM' />
        )}

        <MapResizeHandler isResizing={isResizing} />
        <MapControls dronePos={dronePos} />
        <MapCenterTracker setMapCenter={setMapCenter} />

        {/* MARKERS WITH GLOW EFFECT */}
        {/* Dock with pulsing halo */}
        {dockPos && (
          <>
            <CircleMarker 
              center={dockPos} 
              radius={25}
              pathOptions={{
                fillColor: '#ff6b35',
                fillOpacity: 0.15,
                color: '#ff6b35',
                weight: 2,
                opacity: 0.3
              }}
              className="pulsing-halo"
            />
            <CircleMarker 
              center={dockPos} 
              radius={15}
              pathOptions={{
                fillColor: '#ff6b35',
                fillOpacity: 0.25,
                color: '#ff6b35',
                weight: 1,
                opacity: 0.5
              }}
            />
            <Marker position={dockPos} icon={dockIcon}>
              <Tooltip direction="top" offset={[0, -25]} permanent={false}>
                <strong>🏠 Dock Station</strong>
              </Tooltip>
            </Marker>
          </>
        )}
        
        {/* Drone with animated halo */}
        {dronePos && (
          <>
            <CircleMarker 
              center={dronePos} 
              radius={20}
              pathOptions={{
                fillColor: '#1e90ff',
                fillOpacity: 0.15,
                color: '#1e90ff',
                weight: 2,
                opacity: 0.4
              }}
              className="pulsing-halo-fast"
            />
            <CircleMarker 
              center={dronePos} 
              radius={12}
              pathOptions={{
                fillColor: '#00d4ff',
                fillOpacity: 0.3,
                color: '#00d4ff',
                weight: 1,
                opacity: 0.6
              }}
            />
            <Marker position={dronePos} icon={droneIcon}>
              <Tooltip direction="top" offset={[0, -18]} permanent={false}>
                <strong>🚁 Drone</strong>
              </Tooltip>
            </Marker>
          </>
        )}

        {/* SCHEDULED MISSION ROUTE (Next Mission - Transparent) */}
        {nextScheduledMission?.mission?.waypoints && nextScheduledMission.mission.waypoints.length > 1 && (
          <>
            <Polyline 
              positions={nextScheduledMission.mission.waypoints.map(wp => [wp.lat, wp.lon])} 
              color="#79a7ff" 
              weight={3}
              opacity={0.4}
              dashArray="10, 10"
            />
            {nextScheduledMission.mission.waypoints.map((wp, i) => (
              <Marker
                key={`scheduled-${i}`}
                position={[wp.lat, wp.lon]}
                icon={new L.DivIcon({
                  className: 'custom-waypoint-marker',
                  html: `<div style="background: rgba(121, 167, 255, 0.4); color: white; border: 2px solid #79a7ff; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold;">S${i + 1}</div>`,
                  iconSize: [24, 24],
                  iconAnchor: [12, 12]
                })}
              >
                <Tooltip direction="top" offset={[0, -12]}>
                  <div style={{ fontSize: '11px' }}>
                    <strong>Scheduled WP{i + 1}</strong><br/>
                    Alt: {wp.alt}m<br/>
                    {wp.hover > 0 && <span>Hover: {wp.hover}s<br/></span>}
                    Mission: {nextScheduledMission.mission.name}
                  </div>
                </Tooltip>
              </Marker>
            ))}
          </>
        )}

        {/* ACTIVE EXECUTION ROUTE (More Visible) */}
        {activeMission?.mission?.waypoints && activeMission.mission.waypoints.length > 1 && (
          <>
            <Polyline 
              positions={activeMission.mission.waypoints.map(wp => [wp.lat, wp.lon])} 
              color="#4ade80" 
              weight={4}
              opacity={0.9}
              dashArray="5, 10"
            />
            {activeMission.mission.waypoints.map((wp, i) => (
              <Marker
                key={`active-${i}`}
                position={[wp.lat, wp.lon]}
                icon={new L.DivIcon({
                  className: 'custom-waypoint-marker',
                  html: `<div style="background: #4ade80; color: black; border: 2px solid #22c55e; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; animation: pulse 2s ease-in-out infinite;">E${i + 1}</div>`,
                  iconSize: [28, 28],
                  iconAnchor: [14, 14]
                })}
              >
                <Tooltip direction="top" offset={[0, -14]}>
                  <div style={{ fontSize: '11px' }}>
                    <strong>🚁 Executing WP{i + 1}</strong><br/>
                    Alt: {wp.alt}m<br/>
                    {wp.hover > 0 && <span>Hover: {wp.hover}s<br/></span>}
                    Mission: {activeMission.mission.name}<br/>
                    Status: {activeMission.status}
                  </div>
                </Tooltip>
              </Marker>
            ))}
          </>
        )}

        {/* USER CREATED WAYPOINTS (Mission Planning) */}
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
            <Tooltip permanent direction="top" offset={[0, -10]}>{`WP${i + 1}`}</Tooltip>
          </Marker>
        ))}
        {waypoints.length > 1 && <Polyline positions={waypoints.map((wp) => [wp.lat, wp.lon])} color="#e74c3c" dashArray="5, 5" />}
        
      </MapContainer>
    </div>
  );
}