import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { mapTilerService } from '@/services/mapTiler/mapTilerService';
import type { VehicleData } from '@/types/vehicle';
import MapControls from './components/MapControls';
import { useMapMarkers } from './hooks/useMapMarkers';

interface MapTilerMapProps {
  vehicles: VehicleData[];
  height?: string;
  onVehicleSelect?: (vehicle: VehicleData) => void;
  selectedVehicle?: VehicleData | null;
  defaultZoom?: number;
  showControls?: boolean;
  className?: string;
}

const MapTilerMap: React.FC<MapTilerMapProps> = ({
  vehicles,
  height = '400px',
  onVehicleSelect,
  selectedVehicle,
  defaultZoom = 12,
  showControls = true,
  className = ''
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Use the custom hook for managing markers
  const markersRef = useMapMarkers(
    map.current,
    isMapLoaded,
    vehicles,
    selectedVehicle,
    onVehicleSelect
  );

  // Focus on selected vehicle
  useEffect(() => {
    if (selectedVehicle && map.current && isMapLoaded) {
      if (selectedVehicle.lastPosition?.lat && selectedVehicle.lastPosition?.lon) {
        map.current.flyTo({
          center: [selectedVehicle.lastPosition.lon, selectedVehicle.lastPosition.lat],
          zoom: 16,
          duration: 1000
        });
      }
    }
  }, [selectedVehicle, isMapLoaded]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    mapTilerService.initialize();

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: mapTilerService.getMapStyle(),
      center: [0, 0],
      zoom: defaultZoom,
      attributionControl: false
    });

    map.current.on('load', () => {
      setIsMapLoaded(true);
    });

    return () => {
      markersRef.current?.forEach(({ marker }) => marker.remove());
      map.current?.remove();
    };
  }, [defaultZoom]);

  return (
    <div 
      ref={mapContainer} 
      className={`w-full ${className}`}
      style={{ height }}
    >
      <MapControls map={map.current} showControls={showControls} />
    </div>
  );
};

export default MapTilerMap;
