import { useState, useEffect } from "react";
import {
  ThermometerSun,
  Droplets,
  Wind,
  Gauge,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import "../styles/WeatherPanel.css";

export default function WeatherPanel({ hangar, drone }) {
  const [expanded, setExpanded] = useState(false);
  const [history, setHistory] = useState([]);

  // ====== ESTRAZIONE DATI ATTUALI ======

  const dockFromDrone = drone?.dock?.[0]?.value;
  const dockFromHangar = hangar?.dock?.[0]?.value;

  // Priorità: dock dentro drone (ma puoi invertire se preferisci)
  const dock = dockFromDrone || dockFromHangar || {};

  const tempStr = dock?.dock_temperature ?? hangar?.ext_tmp?.[0]?.value;
  const humidityStr = dock?.humidity ?? hangar?.ext_humidity?.[0]?.value;
  const windSpeedStr = dock?.wind_speed ?? hangar?.wind?.[0]?.value;
  const windGustStr = hangar?.wind_gust?.[0]?.value;
  const pressure = hangar?.pressure?.[0]?.value ?? "-";
  const rainfall = hangar?.rainfall?.[0]?.value ?? 0;

  const temp = tempStr != null ? Number(tempStr) : null;
  const humidity = humidityStr != null ? Number(humidityStr) : null;
  const windSpeed = windSpeedStr != null ? Number(windSpeedStr) : null;
  const windGust = windGustStr != null ? Number(windGustStr) : null;

  // Timestamp (x axis)
  const timestamp =
    hangar?.timestamp?.[0]?.value ||
    dock?.timestamp ||
    new Date().toISOString();

  // ====== COSTRUZIONE STATO METEO (icona / label) ======

  let conditionIcon = "☀️";
  let conditionLabel = "Sereno";

  if (rainfall > 0) {
    conditionIcon = "🌧";
    conditionLabel = "Pioggia";
  } else if (humidity > 80) {
    conditionIcon = "🌫";
    conditionLabel = "Umido";
  } else if (windSpeed > 8 || windGust > 10) {
    conditionIcon = "💨";
    conditionLabel = "Vento forte";
  } else if (humidity > 60) {
    conditionIcon = "⛅";
    conditionLabel = "Variabile";
  }

  // Semaforo vento (safety)
  let windLevel = "ok";
  if (windSpeed != null) {
    if (windSpeed > 10) windLevel = "danger";
    else if (windSpeed > 5) windLevel = "warn";
  }

  // ====== STORICO PER GRAFICI ======
  // Ogni volta che cambia "hangar" aggiungo un punto allo storico

  useEffect(() => {
    if (!hangar) return;

    const point = {
      time: new Date(timestamp).toLocaleTimeString("it-IT", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      temp: temp ?? null,
      humidity: humidity ?? null,
      wind: windSpeed ?? null,
      windGust: windGust ?? null,
      pressure: pressure ?? null,
    };

    setHistory((prev) => {
      const next = [...prev, point];
      // mantieni ultimi 120 punti
      return next.slice(-120);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hangar]); // ogni nuovo pacchetto telemetria

  return (
    <div
      className={`weather-panel ${expanded ? "expanded" : "collapsed"}`}
      onClick={() => setExpanded((prev) => !prev)}
    >
      {/* ===== HEADER COMPATTO (sempre visibile) ===== */}
      <div className="weather-header">
        <div className="weather-header-left">
          <span className="weather-main-icon">{conditionIcon}</span>
          <div className="weather-main-text">
            <h4>Meteo Dock</h4>
            <span className="weather-condition-label">{conditionLabel}</span>
          </div>
        </div>

        <div className="weather-header-right">
          <div className="weather-temp-row">
            <ThermometerSun size={16} />
            <span>{temp != null ? `${temp.toFixed(1)}°C` : "N/A"}</span>
          </div>
          <div className="weather-wind-row">
            <Wind size={16} />
            <span>{windSpeed != null ? `${windSpeed.toFixed(1)} m/s` : "N/A"}</span>
            <span className={`wind-pill wind-${windLevel}`} />
          </div>
        </div>

        <div className="weather-expand-icon">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* ===== RIGA COMPATTA VALORI RAPIDI ===== */}
      <div className="weather-quick-row">
        <div className="quick-item">
          <Droplets size={14} />
          <span>{humidity != null ? `${humidity.toFixed(0)}%` : "—"}</span>
        </div>
        <div className="quick-item">
          <Gauge size={14} />
          <span>{pressure ? `${pressure.toFixed?.(1) ?? pressure} hPa` : "—"}</span>
        </div>
        <div className="quick-item">
          <span>Rain</span>
          <span>{rainfall ? `${rainfall} mm` : "0 mm"}</span>
        </div>
      </div>

      {/* ===== SEZIONE ESTESA CON GRAFICI ===== */}
      {expanded && (
        <div
          className="weather-expanded"
          onClick={(e) => e.stopPropagation()} // evita chiusura quando clicchi sui grafici
        >
          {/* TEMPERATURA */}
          <div className="chart-block">
            <div className="chart-title">📈 Temperatura (°C)</div>
            <ResponsiveContainer width="100%" height={130}>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  domain={["auto", "auto"]}
                  allowDecimals={true}
                />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="temp"
                  stroke="#e67e22"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* VENTO & RAFFICHE */}
          <div className="chart-block">
            <div className="chart-title">💨 Vento & Raffiche (m/s)</div>
            <ResponsiveContainer width="100%" height={130}>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  domain={[0, "auto"]}
                  allowDecimals={true}
                />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="wind"
                  name="Vento"
                  stroke="#2980b9"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="windGust"
                  name="Raffiche"
                  stroke="#c0392b"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* UMIDITÀ */}
          <div className="chart-block">
            <div className="chart-title">💧 Umidità (%)</div>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  domain={[0, 100]}
                  allowDecimals={false}
                />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="humidity"
                  stroke="#16a085"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* PRESSIONE */}
          <div className="chart-block">
            <div className="chart-title">🧭 Pressione (hPa)</div>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  domain={["auto", "auto"]}
                  allowDecimals={true}
                />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="pressure"
                  stroke="#7f8c8d"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
