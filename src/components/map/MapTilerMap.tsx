
import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export interface VehicleData {
  device_id: string;
  device_name: string;
  last_position?: {
    latitude: number;
    longitude: number;
  };
  status?: string;
}

interface MapTilerMapProps {
  center?: [number, number];
  zoom?: number;
  className?: string;
  height?: string;
  vehicles?: VehicleData[];
  selectedVehicle?: VehicleData | null;
  onVehicleSelect?: (vehicle: VehicleData) => void;
  onMapLoad?: (map: maplibregl.Map) => void;
  defaultZoom?: number;
  showControls?: boolean;
  autoFitBounds?: boolean;
}

const MapTilerMap: React.FC<MapTilerMapProps> = ({
  center = [-74.006, 40.7128],
  zoom = 10,
  className = "w-full h-96",
  height = "400px",
  vehicles = [],
  selectedVehicle,
  onVehicleSelect,
  onMapLoad,
  defaultZoom,
  showControls = true,
  autoFitBounds = false
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<Map<string, maplibregl.Marker>>(new Map());

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://api.maptiler.com/maps/streets/style.json?key=demo',
      center: center,
      zoom: defaultZoom || zoom
    });

    map.current = mapInstance;

    if (showControls) {
      mapInstance.addControl(new maplibregl.NavigationControl(), 'top-right');
    }

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
  }, [center, zoom, onMapLoad, defaultZoom, showControls]);

  // Update markers when vehicles change
  useEffect(() => {
    if (!map.current || !vehicles) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current.clear();

    // Add new markers
    vehicles.forEach(vehicle => {
      if (vehicle.last_position) {
        const lngLat: [number, number] = [
          vehicle.last_position.longitude,
          vehicle.last_position.latitude
        ];

        const marker = new maplibregl.Marker({
          color: selectedVehicle?.device_id === vehicle.device_id ? '#ff0000' : '#3b82f6'
        })
          .setLngLat(lngLat)
          .addTo(map.current!);

        if (onVehicleSelect) {
          marker.getElement().addEventListener('click', () => {
            onVehicleSelect(vehicle);
          });
        }

        markers.current.set(vehicle.device_id, marker);
      }
    });

    // Auto-fit bounds if requested
    if (autoFitBounds && vehicles.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      vehicles.forEach(vehicle => {
        if (vehicle.last_position) {
          bounds.extend([
            vehicle.last_position.longitude,
            vehicle.last_position.latitude
          ]);
        }
      });
      
      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, { padding: 50 });
      }
    }
  }, [vehicles, selectedVehicle, onVehicleSelect, autoFitBounds]);

  return (
    <div 
      ref={mapContainer} 
      className={className}
      style={{ height }}
    />
  );
};

export default MapTilerMap;
