import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/MapView.css"; 
import { useEffect, useState } from "react";
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
});
const dockIcon = new L.Icon({
  iconUrl: "https://dronexcanada.ca/cdn/shop/files/DJI-Dock1_3.png?v=1711490763&width=480",
  iconSize: [50, 50],
  iconAnchor: [25, 25],
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

// ====================================================================
// COMPONENTE PRINCIPALE MAPVIEW
// ====================================================================
export default function MapView({ 
    dronePos, dockPos, path, waypoints, setWaypoints, isResizing 
}) {
  const [useFallback, setUseFallback] = useState(false);

  return (
    // Usa la classe map-wrapper definita nel CSS
    <div className="map-wrapper">
      
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

        {/* MARKERS */}
        {dockPos && <Marker position={dockPos} icon={dockIcon} />}
        {dronePos && <Marker position={dronePos} icon={droneIcon} />}
        {path.length > 1 && <Polyline positions={path} color="#3498db" weight={4} opacity={0.8} />}

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