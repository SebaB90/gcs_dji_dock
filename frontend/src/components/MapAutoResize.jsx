import { useEffect } from "react";
import { useMap } from "react-leaflet";

export default function MapAutoResize() {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const container = map.getContainer();
    if (!container) return;

    const handleResize = () => {
      map.invalidateSize(true);
    };

    // osserva cambiamenti nel contenitore
    const observer = new ResizeObserver(() => handleResize());
    observer.observe(container);

    // 3 invalidazioni progressivi (garantite)
    setTimeout(handleResize, 300);
    setTimeout(handleResize, 1000);
    setTimeout(handleResize, 2000);

    return () => observer.disconnect();
  }, [map]);

  return null;
}
