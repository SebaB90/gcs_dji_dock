import MissionManager from "./MissionManager";
import "../styles/TelemetryPanel.css";

export default function TelemetryPanel({
  drone,
  hangar,
  dronePos,
  dockPos,
  waypoints,
  setWaypoints,
  BACKEND_URL,
}) {
  const connected = drone.conn_status?.[0]?.value ?? false;
  const battery = drone.battery_level?.[0]?.value ?? 0;
  const batteryColor = battery < 20 ? "red" : battery < 60 ? "orange" : "green";

  return (
    <div className="sidebar">
      <h3>
        Mission Manager{" "}
        <span style={{ fontSize: "0.8em" }}>
          {connected ? "🟢 Online" : "🔴 Offline"}
        </span>
      </h3>

      <section>
        <h4>Drone</h4>
        <p>
          <strong>Battery:</strong>{" "}
          <span style={{ color: batteryColor }}>{battery}%</span>
        </p>
        <p><strong>Lat:</strong> {dronePos?.[0]?.toFixed(6) ?? "-"}</p>
        <p><strong>Lon:</strong> {dronePos?.[1]?.toFixed(6) ?? "-"}</p>
        <p><strong>Alt:</strong> {drone.alt?.[0]?.value ?? "-"}</p>
        <p><strong>Speed:</strong> {drone.groundspeed?.[0]?.value ?? "-"}</p>
        <p><strong>Mode:</strong> {drone.mode?.[0]?.value ?? "-"}</p>
      </section>

      <MissionManager
        dronePos={dronePos}
        dockPos={dockPos}
        waypoints={waypoints}
        setWaypoints={setWaypoints}
        BACKEND_URL={BACKEND_URL}
      />
    </div>
  );
}
