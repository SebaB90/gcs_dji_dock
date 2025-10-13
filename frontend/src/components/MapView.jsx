import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Tooltip,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/MapView.css";
import { useEffect } from "react";
import L from "leaflet";

const DEFAULT_CENTER = [44.5721, 11.2514];
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAPBOX_STYLE_ID = "mapbox/satellite-v9";

// === Icone personalizzate ===
const droneIcon = new L.Icon({
  iconUrl:
    "https://navigate.pl/wp-content/uploads/2024/04/EA220_drone-V1_%E7%99%BD%E5%BA%95%E5%9B%BE%E6%97%A0%E9%98%B4%E5%BD%B1_0829_020065-1.png",
  iconSize: [35, 35],
  iconAnchor: [17, 17],
});

const dockIcon = new L.Icon({
  iconUrl: "https://dronexcanada.ca/cdn/shop/files/DJI-Dock1_3.png?v=1711490763&width=480",
  iconSize: [50, 50],
  iconAnchor: [25, 25],
});

// === Forza ridisegno mappa ===
function FixMap() {
  const map = useMap();
  useEffect(() => {
    const fix = () => {
      map.invalidateSize(true);
      map._resetView(map.getCenter(), map.getZoom(), true);
    };
    const timeout = setTimeout(fix, 500);
    window.addEventListener("resize", fix);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", fix);
    };
  }, [map]);
  return null;
}

// === Controlli personalizzati ===
function CustomControls({ dronePos, dockPos }) {
  const map = useMap();

  return (
    <div className="controls-wrapper">
      <button className="map-control-btn" onClick={() => map.zoomIn()}>
        +
      </button>
      <button className="map-control-btn" onClick={() => map.zoomOut()}>
        −
      </button>
      <button
        className="recenter-btn"
        onClick={() => {
          if (dronePos) map.setView(dronePos, 19);
          else if (dockPos) map.setView(dockPos, 19);
        }}
      >
        📍
      </button>
    </div>
  );
}

// === Mappa principale ===
export default function MapView({ dronePos, dockPos, path, waypoints, setWaypoints }) {
  return (
    <div className="map-wrapper">
      <MapContainer
        center={dronePos ?? dockPos ?? DEFAULT_CENTER}
        zoom={19}
        minZoom={15}
        maxZoom={22}
        zoomControl={false}
        preferCanvas={true}
        style={{ width: "100%", height: "100%" }}
      >
        {/* === MAPBOX TILE === */}
        <TileLayer
          url={`https://api.mapbox.com/styles/v1/${MAPBOX_STYLE_ID}/tiles/512/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`}
          tileSize={512}
          zoomOffset={-1}
          maxZoom={22}
          minZoom={3}
          keepBuffer={5}
          attribution='© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* === Dock e Drone === */}
        {dockPos && <Marker position={dockPos} icon={dockIcon} />}
        {dronePos && <Marker position={dronePos} icon={droneIcon} />}

        {/* === Path === */}
        {path?.length > 1 && <Polyline positions={path} color="blue" />}

        {/* === Waypoints === */}
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

        {/* === Linea rossa tra i waypoints === */}
        {waypoints.length > 1 && (
          <Polyline positions={waypoints.map((wp) => [wp.lat, wp.lon])} color="red" />
        )}

        <FixMap />
        <CustomControls dronePos={dronePos} dockPos={dockPos} />
      </MapContainer>
    </div>
  );
}
