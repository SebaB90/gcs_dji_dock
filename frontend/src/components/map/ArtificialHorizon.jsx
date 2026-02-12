import React from 'react';

const ArtificialHorizon = ({ pitch = 0, roll = 0 }) => {
    // Fattore di conversione: quanti pixel si sposta l'orizzonte per ogni grado di pitch
    const PITCH_SENSITIVITY = 4; 
    
    // Limiti grafici per non far uscire l'orizzonte dal cerchio
    const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
    const pitchOffset = clamp(pitch * PITCH_SENSITIVITY, -60, 60);

    return (
        <div className="pfd-instrument">
            {/* Contenitore che ruota (Roll) */}
            <div 
                className="pfd-sky-ground-container"
                style={{ transform: `rotate(${-roll}deg)` }}
            >
                {/* Cielo e Terra si muovono su/giù (Pitch) */}
                <div 
                    className="pfd-horizon-translation"
                    style={{ transform: `translateY(${pitchOffset}px)` }}
                >
                    <div className="pfd-sky"></div>
                    <div className="pfd-ground"></div>
                    <div className="pfd-horizon-line"></div>
                </div>
            </div>

            {/* Simbolo del drone (Fisso al centro) */}
            <div className="pfd-aircraft-symbol">
                <div className="wing-left"></div>
                <div className="center-dot"></div>
                <div className="wing-right"></div>
            </div>

            {/* Valori numerici sovraimpressi */}
            <div className="pfd-values">
                <span>R: {roll.toFixed(1)}°</span>
                <span>P: {pitch.toFixed(1)}°</span>
            </div>
        </div>
    );
};

export default ArtificialHorizon;