import { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  ZoomControl,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAPBOX_STYLE_ID = "satellite-v9";

export default function MiniMap({ waypoints }) {
  const [useFallback, setUseFallback] = useState(false);

  if (!waypoints || waypoints.length === 0)
    return <p style={{ fontSize: "13px", color: "#555" }}>Nessun percorso</p>;

  const center = [waypoints[0].lat, waypoints[0].lon];

  return (
    <div
      style={{
        height: "200px",
        width: "100%",
        borderRadius: "10px",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <MapContainer
        center={center}
        zoom={18}
        maxZoom={23}
        minZoom={13}
        scrollWheelZoom={true}
        zoomControl={false}
        attributionControl={false}
        doubleClickZoom={false}
        style={{
          height: "100%",
          width: "100%",
          borderRadius: "10px",
        }}
      >
        {/* 🌍 Mapbox Satellite o fallback OSM */}
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
                console.warn("⚠️ Mapbox non disponibile, passo a OSM...");
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

        {/* Polyline missione */}
        <Polyline
          positions={waypoints.map((wp) => [wp.lat, wp.lon])}
          pathOptions={{ color: "#007bff", weight: 3 }}
        />

        {/* Marker waypoint */}
        {waypoints.map((wp, i) => (
          <Marker key={i} position={[wp.lat, wp.lon]} />
        ))}

        {/* Controlli zoom visibili */}
        <ZoomControl position="bottomright" />
      </MapContainer>
    </div>
  );
}
