import { useState, useEffect } from "react";
import videoService from "../../services/video.service";
import {
    LayoutGrid,
    Monitor,
    Activity,
    Navigation,
    MoveVertical,
    Battery,
    Signal,
    ArrowUp,
    ArrowDown
} from "lucide-react"; 
import "./VideoPanel.css";

// === COMPONENTE FRAME VIDEO ===
// Accetta 'headerContent' per inserire pulsanti custom (es. switch termica) nell'intestazione
const StreamFrame = ({ title, type, activeSource, headerContent }) => {
    
    // URL STREAM (Punta al tuo MediaMTX locale)
    const streamUrl = type === 'drone' ? "http://192.168.200.55:8888/drone" : null; // HARDCODATO!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

    return (
        <div className="stream-frame">
            {/* HEADER DEL VIDEO */}
            <div className="stream-header">
                <span className="stream-title">{title}</span>
                
                <div className="header-actions">
                    {/* Controlli Custom (es. Toggle Termica) */}
                    {headerContent}

                    {/* Indicatore LIVE */}
                    <div className="stream-status">
                        <span className="blinking-dot"></span>
                        <span>LIVE</span>
                    </div>
                </div>
            </div>
            
            {/* CONTENUTO VIDEO */}
            <div className="stream-content">
                {streamUrl ? (
                    <iframe 
                        src={streamUrl}
                        title={`${title} Stream`}
                        allow="autoplay; fullscreen"
                        // Nota: scrolling="no" è ridondante col CSS pointer-events, ma male non fa
                        scrolling="no"
                    />
                ) : (
                    // Placeholder se non c'è segnale
                    <div className="placeholder-video">
                        <div className="no-signal-box">
                            <Monitor size={32} />
                            <span>NO SIGNAL</span>
                        </div>
                    </div>
                )}
                
                {/* Overlay Info in basso (solo testo) */}
                <div className="stream-overlay-info">
                    {type === 'drone' && <div>CAM: H20T</div>}
                    {type === 'drone' && (
                        <div className={`source-indicator source-${activeSource}`}>
                            ● {activeSource === 'thermal' ? 'THERMAL' : 
                               activeSource === 'zoom' ? 'ZOOM' : 
                               'WIDE'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// === COMPONENTE METRICA VISUALE (Telemetria) ===
const VisualMetric = ({ label, value, unit, icon: Icon, max = 100, type = "text", trend = null }) => {
    let statusColor = "status-good";
    let bgColor = "bg-good";
    
    // Logica Colori: Batteria
    if (type === "battery") {
        if (value < 20) { statusColor = "status-crit"; bgColor = "bg-crit"; }
        else if (value < 50) { statusColor = "status-warn"; bgColor = "bg-warn"; }
    }
    // Logica Colori: Segnale
    if (type === "signal") {
        if (value < 8) { statusColor = "status-crit"; bgColor = "bg-crit"; }
        else if (value < 12) { statusColor = "status-warn"; bgColor = "bg-warn"; }
    }

    // Calcolo larghezza barra
    const barWidth = Math.min((value / max) * 100, 100);

    return (
        <div className="t-item">
            <div className="t-header">
                <span className="label">{label}</span>
                {Icon && <Icon size={14} color="#555" />}
            </div>
            
            <div className="t-value-group">
                {/* Freccia Trend (per V.SPD) */}
                {trend !== null && Math.abs(trend) > 0.1 && (
                    trend > 0 
                    ? <ArrowUp size={14} className="status-good trend-icon" /> 
                    : <ArrowDown size={14} className="status-crit trend-icon" />
                )}
                
                <span className={`value ${type === 'battery' ? statusColor : ''}`}>
                    {value}
                </span>
                <span className="unit">{unit}</span>
            </div>

            {/* Barre di progresso (solo per Battery/Signal) */}
            {(type === "battery" || type === "signal") && (
                <div className="progress-track">
                    <div className={`progress-fill ${bgColor}`} style={{ width: `${barWidth}%` }}></div>
                </div>
            )}
        </div>
    );
};

export default function VideoPanel({ telemetry, dronePos, dockPos, backendUrl }) {
    const [irMode, setIrMode] = useState(false);
    const [activeSource, setActiveSource] = useState("wide"); // Track active video source
    const [switchingSource, setSwitchingSource] = useState(false); // Track switching state

    // Gestione Layout (Quali stream mostrare)
    const [visibleStreams, setVisibleStreams] = useState({
        dock: false,
        drone: true
    });

    const toggleStream = (streamKey) => {
        setVisibleStreams(prev => ({ ...prev, [streamKey]: !prev[streamKey] }));
    };

    // Function to switch video source via API
    // Function to switch video source via API
    const switchVideoSource = async (sourceName) => {
        // Prevent multiple simultaneous switches
        if (switchingSource) return;
        
        setSwitchingSource(true);
        
        try {
            const response = await videoService.setVideoSource(sourceName);
            setActiveSource(sourceName);
            console.log(`✅ Video source switched to: ${sourceName}`, response);
        } catch (error) {
            console.error(`❌ Error switching to ${sourceName}:`, error);
            
            // Better error feedback for user
            if (error.response?.status === 401) {
                alert("Session expired. Please login again.");
            } else if (error.code === "ERR_NETWORK") {
                alert(`Network error: Cannot reach backend\nPlease check your connection.`);
            } else {
                alert(`Failed to switch camera to ${sourceName}. ${error.response?.data?.detail || error.message}`);
            }
        } finally {
            setSwitchingSource(false);
        }
    };

    // Get current video source on mount and periodically
    useEffect(() => {
        const fetchCurrentSource = async () => {
            try {
                const response = await videoService.getVideoSource();
                if (response.source_name) {
                    setActiveSource(response.source_name);
                    console.log(`📹 Current video source: ${response.source_name}`);
                }
            } catch (error) {
                console.error("Error fetching current video source:", error);
            }
        };

        // Fetch immediately on mount
        fetchCurrentSource();

        // Poll every 10 seconds
        const interval = setInterval(fetchCurrentSource, 10000);
        return () => clearInterval(interval);
    }, []);

    const getVal = (key) => telemetry?.[key]?.[0]?.value ?? null;
    const altitude = parseFloat(getVal("alt")) || 0;
    const hSpeed = parseFloat(getVal("groundspeed")) || 0;
    const vSpeed = parseFloat(getVal("vertical_speed")) || 0;
    const distance = parseFloat(getVal("distance_from_home")) || 0;
    const battery = parseFloat(getVal("battery_level")) || 0;
    const sats = parseInt(getVal("gps_num_satellites")) || 0;

    // Costruzione del Toggle Camera per l'header
    const DroneControls = (
        <div className="cam-toggle">
            <button 
                className={`cam-toggle-btn ${activeSource === 'wide' ? 'active-vis' : ''}`} 
                onClick={() => switchVideoSource('wide')}
                disabled={switchingSource}
                title="Wide camera view"
            >
                WIDE
            </button>
            <button 
                className={`cam-toggle-btn ${activeSource === 'zoom' ? 'active-zoom' : ''}`} 
                onClick={() => switchVideoSource('zoom')}
                disabled={switchingSource}
                title="Zoom camera view"
            >
                ZOOM
            </button>
            <button 
                className={`cam-toggle-btn ${activeSource === 'thermal' ? 'active-ir' : ''}`} 
                onClick={() => switchVideoSource('thermal')}
                disabled={switchingSource}
                title="Thermal camera view"
            >
                THERMAL
            </button>
        </div>
    );

    return (
        <div className="dashboard-panel">
            
            {/* 1. TOOLBAR SUPERIORE */}
            <div className="panel-toolbar">
                <div className="toolbar-title">
                    <LayoutGrid size={14} /> 
                    MISSION LIVE FEED
                </div>

                <div className="view-controls-group">
                    <button 
                        className={`view-btn ${visibleStreams.dock ? 'active' : ''}`}
                        onClick={() => toggleStream('dock')}
                    >
                        <span className="indicator"></span>
                        DOCK
                    </button>

                    <button 
                        className={`view-btn ${visibleStreams.drone ? 'active' : ''}`}
                        onClick={() => toggleStream('drone')}
                    >
                        <span className="indicator"></span>
                        DRONE
                    </button>
                </div>
            </div>

            {/* 2. AREA VIDEO (FLEX ROW) */}
            <div className="video-row">
                
                {/* Stream DOCK */}
                {visibleStreams.dock && (
                    <div className="video-col">
                        <StreamFrame title="DOCK SYSTEM" type="dock" />
                    </div>
                )}

                {/* Stream DRONE */}
                {visibleStreams.drone && (
                    <div className="video-col">
                        <StreamFrame 
                            title="M30T AIRCRAFT" 
                            type="drone" 
                            activeSource={activeSource}
                            headerContent={DroneControls} // Passiamo il toggle qui
                        />
                    </div>
                )}

                {/* Messaggio se tutto è spento */}
                {!visibleStreams.dock && !visibleStreams.drone && (
                    <div className="no-streams-message">
                        <Monitor size={48} strokeWidth={1} style={{marginBottom: 10, opacity: 0.5}} />
                        <div>SIGNAL LOST</div>
                    </div>
                )}
            </div>
        </div>
    );
}