import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet"; 
import "../styles/VideoPanel.css"; // Usa gli stili del video panel

// Icone (mantieni le definizioni)
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAPBOX_STYLE_ID = "satellite-v9";

const droneIcon = new L.Icon({
  iconUrl:
    "https://navigate.pl/wp-content/uploads/2024/04/EA220_drone-V1_%E7%99%BD%E5%BA%95%E5%9B%BE%E6%97%A0%E9%98%B4%E5%BD%B1_0829_020065-1.png",
  iconSize: [30, 30], 
  iconAnchor: [15, 15],
});
const dockIcon = new L.Icon({
  iconUrl: "https://dronexcanada.ca/cdn/shop/files/DJI-Dock1_3.png?v=1711490763&width=480",
  iconSize: [40, 40], 
  iconAnchor: [20, 20],
});

// Componente ausiliario per forzare il resize di Leaflet
function MapResizeFix() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize(true);
  }, [map]);
  return null;
}


export default function MiniMapPip({ dronePos, dockPos }) {
  const [useFallback, setUseFallback] = useState(false);
  
  const center = dronePos || dockPos;

  if (!center) {
    return (
      <div className="video-placeholder-map">
        <p>🛰️ Mappa PIP</p>
        <p style={{ fontSize: "11px", color: "#999" }}>Dati di posizione non disponibili.</p>
      </div>
    );
  }
  
  // Usiamo una classe CSS per lo stile esterno
  return (
    <div className="minimap-pip-wrapper">
      <MapContainer
        center={center}
        zoom={18}
        maxZoom={23}
        minZoom={13}
        scrollWheelZoom={false}
        dragging={false}
        zoomControl={false} // Disabilitiamo lo zoom control nativo
        attributionControl={false}
        doubleClickZoom={false}
        className="leaflet-minimap" // Classe per styling specifico Leaflet
        key={`${center[0]}-${center[1]}`} 
      >
        {/* 🌍 Layer */}
        {!useFallback ? (
          <TileLayer
            url={`https://api.mapbox.com/styles/v1/mapbox/${MAPBOX_STYLE_ID}/tiles/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`}
            tileSize={512}
            zoomOffset={-1}
            maxZoom={23}
            crossOrigin={true}
            attribution='© Mapbox © OpenStreetMap contributors'
            eventHandlers={{ tileerror: () => setUseFallback(true) }}
          />
        ) : (
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={20}
            attribution='© OpenStreetMap contributors'
          />
        )}
        
        {/* Mostra Dock e Drone */}
        {dockPos && <Marker position={dockPos} icon={dockIcon} />}
        {dronePos && <Marker position={dronePos} icon={droneIcon} />}

        <MapResizeFix /> 
        
      </MapContainer>
    </div>
  );
}