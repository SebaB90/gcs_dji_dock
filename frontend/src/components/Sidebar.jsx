import "../styles/Sidebar.css";
import { Activity, Cloud, Route, Video } from "lucide-react";

export default function Sidebar({ onOpen }) {
  return (
    <div className="sidebar">
      <div className="sidebar-title">Dashboard</div>

      <button onClick={() => onOpen("telemetry")}>
        <Activity size={20}/>
        <span>Telemetria</span>
      </button>
      
      <button onClick={() => onOpen("weather")}>
        <Cloud size={20}/>
        <span>Meteo</span>
      </button>

      <button onClick={() => onOpen("missions")}>
        <Route size={20}/>
        <span>Missioni</span>
      </button>

      <button onClick={() => onOpen("video")}>
        <Video size={20}/>
        <span>Video</span>
      </button>
    </div>
  );
}
