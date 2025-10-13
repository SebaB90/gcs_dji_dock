import { useMap } from "react-leaflet";
import "../styles/MapView.css";

export default function CustomControls({ position }) {
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
