import { useState, useEffect } from "react";
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
import "../styles/HealthPanel.css"; // Nuovo CSS
import { Battery, Maximize, Target } from "lucide-react"; // Nuove icone

// Configurazione standard Dark Mode per Recharts
const CHART_CONFIG = {
    gridColor: "#444444", 
    textColor: "#ccc",
    tooltipBackground: "#1c1c1e",
    tooltipBorder: "#444",
};

// Funzione Tooltip personalizzata per Dark Mode (riutilizzata da WeatherPanel)
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip" style={{
          background: CHART_CONFIG.tooltipBackground,
          border: `1px solid ${CHART_CONFIG.tooltipBorder}`,
          padding: '10px',
          color: CHART_CONFIG.textColor,
          fontSize: '12px',
          borderRadius: '4px'
      }}>
        <p className="label" style={{ fontWeight: 'bold' }}>{label}</p>
        {payload.map((item, index) => (
            <p key={index} style={{ color: item.stroke }}>
                {item.name}: {item.value} {item.unit || ''}
            </p>
        ))}
      </div>
    );
  }
  return null;
};


export default function HealthPanel({ drone }) {
  const [history, setHistory] = useState([]);

  // ====== STORICO PER GRAFICI ======
  useEffect(() => {
    if (!drone) return;
    
    // Estrazione dati (attenzione ai valori "N/A" che vanno convertiti a null)
    const currentTimestamp = drone?.timestamp?.[0]?.value || new Date().toISOString();
    const ts = new Date(currentTimestamp).toLocaleTimeString("it-IT", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
    
    const batLevel = drone?.battery_level?.[0]?.value ?? null;
    const batVolt = drone?.battery_voltage?.[0]?.value ?? null;
    const pitch = drone?.pitch?.[0]?.value ?? null;
    const roll = drone?.roll?.[0]?.value ?? null;
    const alt = drone?.alt?.[0]?.value ?? null;
    const sats = drone?.gps_num_satellites?.[0]?.value ?? null;


    const point = {
      time: ts,
      batLevel: batLevel,
      batVolt: batVolt,
      pitch: pitch,
      roll: roll,
      alt: alt,
      sats: sats,
    };

    setHistory((prev) => {
      const next = [...prev, point];
      // Mantieni gli ultimi 120 punti (come per il meteo)
      return next.slice(-120);
    });
    
  }, [drone]); 

  
  return (
    <div className="health-manager-content">
      
      <p className="history-info">Storico ultime {history.length} letture</p>

      <div className="chart-container">

          {/* 1. ENERGIA (Batteria) */}
          <div className="chart-block">
            <div className="chart-title"><Battery size={16} /> Energia (Livello % / Tensione V)</div>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={history} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_CONFIG.gridColor} />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: CHART_CONFIG.textColor }} />
                <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 10, fill: '#2ecc71' }}
                    label={{ value: 'Level %', angle: -90, position: 'insideLeft', fill: '#2ecc71', fontSize: 10 }}
                    domain={[0, 100]}
                    unit="%"
                />
                <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 10, fill: '#3498db' }}
                    label={{ value: 'Volt (V)', angle: 90, position: 'insideRight', fill: '#3498db', fontSize: 10 }}
                    domain={["auto", "auto"]}
                    allowDecimals={true}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ padding: '0 0 5px 0' }} />
                
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="batLevel"
                  name="Livello Batteria"
                  stroke="#2ecc71" // Verde (Livello %)
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="batVolt"
                  name="Tensione"
                  stroke="#3498db" // Blu (Voltaggio)
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 2. STABILITÀ (Pitch & Roll) */}
          <div className="chart-block">
            <div className="chart-title"><Maximize size={16} /> Pitch & Roll (Gradi)</div>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={history} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_CONFIG.gridColor} />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: CHART_CONFIG.textColor }} />
                <YAxis
                  tick={{ fontSize: 10, fill: CHART_CONFIG.textColor }}
                  domain={[-15, 15]} // Range realistico per Pitch/Roll
                  allowDecimals={true}
                  unit="°"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ padding: '0 0 5px 0' }} />
                
                <Line
                  type="monotone"
                  dataKey="pitch"
                  name="Pitch"
                  stroke="#e67e22" // Arancione
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="roll"
                  name="Roll"
                  stroke="#c0392b" // Rosso
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 3. POSIZIONE & GPS */}
          <div className="chart-block">
            <div className="chart-title"><Target size={16} /> Altitudine (m) & Satelliti</div>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={history} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_CONFIG.gridColor} />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: CHART_CONFIG.textColor }} />
                <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 10, fill: '#16a085' }}
                    label={{ value: 'Altitudine (m)', angle: -90, position: 'insideLeft', fill: '#16a085', fontSize: 10 }}
                    domain={["auto", "auto"]}
                    unit="m"
                />
                <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 10, fill: '#7f8c8d' }}
                    label={{ value: 'Satelliti', angle: 90, position: 'insideRight', fill: '#7f8c8d', fontSize: 10 }}
                    domain={[0, "auto"]}
                    allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ padding: '0 0 5px 0' }} />
                
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="alt"
                  name="Altitudine"
                  stroke="#16a085" // Verde Acqua (Altitudine)
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="sats"
                  name="Satelliti"
                  stroke="#7f8c8d" // Grigio (Satelliti)
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

      </div>
    </div>
  );
}