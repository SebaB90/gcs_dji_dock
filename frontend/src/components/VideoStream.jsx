import "../styles/VideoStream.css";

export default function VideoStream() {
  return (
    <div className="video-wrapper">
      {/* Qui potrai sostituire l’URL con un feed DJI o ThingsBoard */}
      <video
        src="http://localhost:8080/stream.m3u8"
        autoPlay
        muted
        controls
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <div className="video-overlay">🎥 Live Stream</div>
    </div>
  );
}
