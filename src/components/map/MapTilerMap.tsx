
import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapTilerMapProps {
  center?: [number, number];
  zoom?: number;
  className?: string;
  onMapLoad?: (map: maplibregl.Map) => void;
}

const MapTilerMap: React.FC<MapTilerMapProps> = ({
  center = [-74.006, 40.7128],
  zoom = 10,
  className = "w-full h-96",
  onMapLoad
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://api.maptiler.com/maps/streets/style.json?key=demo',
      center: center,
      zoom: zoom
    });

    map.current = mapInstance;

    mapInstance.on('load', () => {
      if (onMapLoad) {
        onMapLoad(mapInstance);
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [center, zoom, onMapLoad]);

  return <div ref={mapContainer} className={className} />;
};

export default MapTilerMap;
