import { useState, useEffect, useRef } from "react";
import Hls from "hls.js";
import "../styles/VideoPanel.css";

export default function VideoPanel() {
  const [expanded, setExpanded] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    const hlsUrl = "http://localhost:8888/webcam/index.m3u8";

    if (Hls.isSupported()) {
      // Inizializza HLS.js
      const hls = new Hls({
        liveSyncDurationCount: 3, // mantiene la latenza bassa
        enableWorker: true,
      });

      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch((err) => console.warn("Autoplay bloccato:", err));
      });

      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Fallback per Safari
      video.src = hlsUrl;
      video.play().catch((err) => console.warn("Autoplay bloccato:", err));
    }
  }, []);

  return (
    <div className={`video-panel ${expanded ? "expanded" : ""}`}>
      {/* 🔹 Header */}
      <div className="video-header">
        <div className="video-title">
          🎥 Video Live <span className="live-indicator">● LIVE</span>
        </div>
        <button className="expand-btn" onClick={() => setExpanded(!expanded)}>
          {expanded ? "⤡ Riduci" : "⤢ Espandi"}
        </button>
      </div>

      {/* 🔹 Corpo video */}
      <div className="video-body">
        <video
          ref={videoRef}
          autoPlay
          muted
          controls
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    </div>
  );
}
