import { useState, useEffect } from "react";
import { 
  Thermometer, 
  Wind, 
  CloudDrizzle, 
  CloudSun,
  HardDrive, // Icona Storage
  Zap,       // Icona Batteria Backup
  Cpu,       // Icona CPU/Sistema
  X
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import "../styles/WeatherPanel.css";

export default function WeatherPanel({ drone, onClose }) {
  
  // ==========================================
  // 1. ESTRAZIONE DATI DAL JSON
  // ==========================================
  const dockData = drone?.dock?.[0]?.value || {};
  
  // --- DATI METEO ---
  const currentTemp = parseFloat(dockData.dock_temperature || 0);
  const currentWind = parseFloat(dockData.wind_speed || 0);
  const currentHum = parseFloat(dockData.humidity || 0);

  // --- DATI SALUTE DOCK (Health) ---
  // Storage
  const storageUsed = parseFloat(dockData.storage_used_mb || 0);
  const storageTotal = parseFloat(dockData.storage_total_mb || 1); // Evita div/0
  // Calcolo percentuale (clamp a 100%)
  const storagePercent = Math.min((storageUsed / storageTotal) * 100, 100);

  // Backup Battery (UPS) - arriva in mV, convertiamo in V
  const backupBatVolts = (parseFloat(dockData.backup_battery_voltage || 0) / 1000).toFixed(1);
  const backupBatTemp = dockData.backup_battery_temp || "N/A";
  
  // Dock Mode (es. "remote_debugging" -> "REMOTE DEBUGGING")
  const dockMode = dockData.dock_mode 
    ? dockData.dock_mode.replace(/_/g, ' ').toUpperCase() 
    : "N/A";


  // ==========================================
  // 2. LOGICA STORICO (Grafici)
  // ==========================================
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const now = new Date().toLocaleTimeString('it-IT', { 
        hour: '2-digit', minute: '2-digit', second: '2-digit' 
    });
    
    const newDataPoint = {
      time: now,
      temp: currentTemp,
      wind: currentWind,
      hum: currentHum
    };

    setHistory(prev => {
      // Mantieni ultimi 30 punti
      const newHistory = [...prev, newDataPoint];
      if (newHistory.length > 30) newHistory.shift(); 
      return newHistory;
    });
  }, [currentTemp, currentWind, currentHum]); 

  return (
    <div className="weather-panel-container">

      <div className="weather-content">
        
        {/* ================================= */}
        {/* SEZIONE 1: METEO ATTUALE          */}
        {/* ================================= */}
        <div className="current-status-card">
          
          <div className="weather-hero">
            <CloudSun size={42} color="#fff" strokeWidth={1.5} /> 
            <div className="weather-hero-text">
              <div className="weather-label-main">Dati Dock</div>
              <div className="weather-sub-label">Rilevazione sensori locali</div>
            </div>
          </div>

          <div className="metrics-grid-compact">
            
            {/* TEMPERATURA */}
            <div className="metric-box theme-orange">
              <div className="m-icon"><Thermometer size={18} /></div>
              <div className="m-info">
                <span className="m-label">TEMP. DOCK</span>
                <span className="m-value">{currentTemp.toFixed(1)} <small>°C</small></span>
              </div>
            </div>

            {/* VENTO */}
            <div className="metric-box theme-blue">
              <div className="m-icon"><Wind size={18} /></div>
              <div className="m-info">
                <span className="m-label">VENTO</span>
                <span className="m-value">{currentWind.toFixed(1)} <small>m/s</small></span>
              </div>
            </div>

            {/* UMIDITÀ */}
            <div className="metric-box theme-green">
              <div className="m-icon"><CloudDrizzle size={18} /></div>
              <div className="m-info">
                <span className="m-label">UMIDITÀ</span>
                <span className="m-value">{currentHum.toFixed(0)} <small>%</small></span>
              </div>
            </div>

          </div>
        </div>

        <div className="section-divider">STORICO METEO (Ultime 30 letture)</div>

        {/* --- GRAFICO 1: TEMPERATURA --- */}
        <div className="chart-card">
          <div className="chart-header-row">
             <div className="chart-title-icon theme-orange"><Thermometer size={14}/></div>
             <span>Temperatura Dock (°C)</span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="time" hide />
                <YAxis domain={['auto', 'auto']} stroke="#666" fontSize={10} width={30} />
                <Tooltip 
                    contentStyle={{background:'#222', border:'1px solid #444', borderRadius:'4px'}} 
                    itemStyle={{fontSize:'12px'}}
                    labelStyle={{display:'none'}}
                />
                <Line type="monotone" dataKey="temp" stroke="#e67e22" strokeWidth={2} dot={false} activeDot={{r: 4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* --- GRAFICO 2: VENTO --- */}
        <div className="chart-card">
          <div className="chart-header-row">
             <div className="chart-title-icon theme-blue"><Wind size={14}/></div>
             <span>Vento (m/s)</span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="time" hide />
                <YAxis domain={[0, 'auto']} stroke="#666" fontSize={10} width={30} />
                <Tooltip 
                    contentStyle={{background:'#222', border:'1px solid #444', borderRadius:'4px'}} 
                    itemStyle={{fontSize:'12px'}}
                    labelStyle={{display:'none'}}
                />
                <Line type="monotone" dataKey="wind" stroke="#3498db" strokeWidth={2} dot={false} activeDot={{r: 4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* --- GRAFICO 3: UMIDITÀ --- */}
        <div className="chart-card">
           <div className="chart-header-row">
             <div className="chart-title-icon theme-green"><CloudDrizzle size={14}/></div>
             <span>Umidità (%)</span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="time" hide />
                <YAxis domain={[0, 100]} stroke="#666" fontSize={10} width={30} />
                <Tooltip 
                    contentStyle={{background:'#222', border:'1px solid #444', borderRadius:'4px'}} 
                    itemStyle={{fontSize:'12px'}}
                    labelStyle={{display:'none'}}
                />
                <Line type="monotone" dataKey="hum" stroke="#2ecc71" strokeWidth={2} dot={false} activeDot={{r: 4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ================================= */}
        {/* SEZIONE 2: DOCK HEALTH            */}
        {/* ================================= */}
        <div className="section-divider" style={{marginTop: '25px'}}>STATO SISTEMA DOCK</div>
       
        <div className="metrics-grid-compact">
            
            {/* 1. STORAGE */}
            <div className="metric-box" style={{borderLeft: '2px solid #9b59b6'}}>
                <div className="m-icon"><HardDrive size={18} color="#9b59b6" /></div>
                <div className="m-info">
                    <span className="m-label">STORAGE</span>
                    <span className="m-value">{storagePercent.toFixed(2)} <small>%</small></span>
                </div>
                {/* Mini Barra Progresso */}
                <div style={{width: '100%', height: '3px', background: '#333', marginTop: 'auto', borderRadius: '2px'}}>
                    <div style={{width: `${storagePercent}%`, height: '100%', background: '#9b59b6', borderRadius: '2px'}}></div>
                </div>
            </div>

            {/* 2. BACKUP BATT (UPS) */}
            <div className="metric-box" style={{borderLeft: '2px solid #f1c40f'}}>
                <div className="m-icon"><Zap size={18} color="#f1c40f" /></div>
                <div className="m-info">
                    <span className="m-label">UPS BATT</span>
                    <span className="m-value">{backupBatVolts} <small>V</small></span>
                </div>
                <span style={{fontSize:'9px', color:'#888', marginTop:'2px'}}>Temp: {backupBatTemp}°C</span>
            </div>

            {/* 3. MODE / STATUS */}
            <div className="metric-box" style={{borderLeft: '2px solid #fff'}}>
                <div className="m-icon"><Cpu size={18} color="#fff" /></div>
                <div className="m-info">
                    <span className="m-label">DOCK MODE</span>
                    <span className="m-value" style={{
                        fontSize: '10px', 
                        whiteSpace: 'nowrap', 
                        overflow:'hidden', 
                        textOverflow:'ellipsis',
                        lineHeight: '1.4'
                    }}>
                        {dockMode}
                    </span>
                </div>
            </div>

        </div>

      </div>
    </div>
  );
}