import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/MapView.css";
import { useEffect, useState } from "react";
import L from "leaflet";

const DEFAULT_CENTER = [44.5721, 11.2514];
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAPBOX_STYLE_ID = "satellite-v9";

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

// ✅ Fixa il resize
function FixMap() {
  const map = useMap();
  useEffect(() => {
    const fix = () => {
      map.invalidateSize(true);
      map._resetView(map.getCenter(), map.getZoom(), true);
    };
    const timeout = setTimeout(fix, 800);
    window.addEventListener("resize", fix);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", fix);
    };
  }, [map]);
  return null;
}

// ✅ Controlli personalizzati
function MapControls({ dronePos }) {
  const map = useMap();

  const zoomIn = () => map.zoomIn();
  const zoomOut = () => map.zoomOut();
  const recenter = () => {
    if (dronePos) {
      map.flyTo(dronePos, map.getZoom(), { animate: true, duration: 1 });
    }
  };

  return (
    <div className="custom-map-controls">
      <button className="ctrl-btn" onClick={zoomIn}>
        +
      </button>
      <button className="ctrl-btn" onClick={zoomOut}>
        −
      </button>
      <button className="ctrl-btn recenter" onClick={recenter}>
        🎯
      </button>
    </div>
  );
}

export default function MapView({ dronePos, dockPos, path, waypoints, setWaypoints }) {
  const [useFallback, setUseFallback] = useState(false);

  return (
    <div className="map-wrapper">
      <MapContainer
        center={dronePos ?? dockPos ?? DEFAULT_CENTER}
        zoom={19}
        minZoom={15}
        maxZoom={23}
        zoomControl={false}
        preferCanvas={true}
        style={{ width: "100%", height: "100%" }}
      >
        {!useFallback ? (
          <TileLayer
            url={`https://api.mapbox.com/styles/v1/mapbox/${MAPBOX_STYLE_ID}/tiles/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`}
            tileSize={512}
            zoomOffset={-1}
            maxZoom={23}
            crossOrigin={true}
            attribution='© Mapbox © OpenStreetMap contributors'
            eventHandlers={{
              tileerror: () => {
                console.warn("⚠️ Mapbox bloccato, passo a OSM fallback...");
                setUseFallback(true);
              },
            }}
          />
        ) : (
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={20}
            attribution='© OpenStreetMap contributors'
          />
        )}

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
            <Tooltip permanent>{`WP${i + 1} (${wp.alt}m)`}</Tooltip>
          </Marker>
        ))}

        <Polyline positions={waypoints.map((wp) => [wp.lat, wp.lon])} color="red" />

        <FixMap />
        <MapControls dronePos={dronePos} />
      </MapContainer>
    </div>
  );
}
