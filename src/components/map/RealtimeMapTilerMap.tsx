
import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useRealTimePositions } from '@/hooks/useRealTimePositions';

interface RealtimeMapTilerMapProps {
  deviceIds: string[];
  center?: [number, number];
  zoom?: number;
  className?: string;
  height?: string;
  autoFitBounds?: boolean;
  selectedVehicle?: any;
  onVehicleSelect?: (vehicle: any) => void;
}

const RealtimeMapTilerMap: React.FC<RealtimeMapTilerMapProps> = ({
  deviceIds,
  center = [-74.006, 40.7128],
  zoom = 10,
  className = "w-full h-96",
  height = "400px",
  autoFitBounds = false,
  selectedVehicle,
  onVehicleSelect
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<Map<string, maplibregl.Marker>>(new Map());
  
  const { positions, subscribe, unsubscribe } = useRealTimePositions();

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://api.maptiler.com/maps/streets/style.json?key=demo',
      center: center,
      zoom: zoom
    });

    map.current = mapInstance;

    mapInstance.addControl(new maplibregl.NavigationControl(), 'top-right');

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [center, zoom]);

  useEffect(() => {
    if (deviceIds.length > 0) {
      subscribe(deviceIds);
    }

    return () => {
      unsubscribe();
    };
  }, [deviceIds, subscribe, unsubscribe]);

  // Update markers when positions change
  useEffect(() => {
    if (!map.current) return;

    positions.forEach((positionUpdate, deviceId) => {
      const { position } = positionUpdate;
      const lngLat: [number, number] = [position.longitude, position.latitude];

      let marker = markers.current.get(deviceId);
      
      if (!marker) {
        marker = new maplibregl.Marker({
          color: selectedVehicle?.device_id === deviceId ? '#ff0000' : '#3b82f6'
        })
          .setLngLat(lngLat)
          .addTo(map.current!);
        
        if (onVehicleSelect) {
          marker.getElement().addEventListener('click', () => {
            onVehicleSelect({ device_id: deviceId, ...position });
          });
        }
        
        markers.current.set(deviceId, marker);
      } else {
        marker.setLngLat(lngLat);
      }
    });

    // Auto-fit bounds if requested
    if (autoFitBounds && positions.size > 0) {
      const bounds = new maplibregl.LngLatBounds();
      positions.forEach((positionUpdate) => {
        bounds.extend([
          positionUpdate.position.longitude,
          positionUpdate.position.latitude
        ]);
      });
      
      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, { padding: 50 });
      }
    }
  }, [positions, selectedVehicle, onVehicleSelect, autoFitBounds]);

  return (
    <div 
      ref={mapContainer} 
      className={className}
      style={{ height }}
    />
  );
};

export default RealtimeMapTilerMap;
