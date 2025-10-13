import { useEffect } from "react";
import { useMap } from "react-leaflet";

export default function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    // funzione per ridisegnare la mappa
    const resize = () => {
      if (map) {
        map.invalidateSize();
      }
    };

    // ⚡ invalidate subito dopo il mount
    const timeout1 = setTimeout(resize, 100);
    const timeout2 = setTimeout(resize, 500); // doppia chiamata per sicurezza

    // anche su ogni resize della finestra
    window.addEventListener("resize", resize);

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      window.removeEventListener("resize", resize);
    };
  }, [map]);

  return null;
}
