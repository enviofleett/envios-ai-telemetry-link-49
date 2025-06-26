
import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useRealTimePositions } from '@/hooks/useRealTimePositions';

interface RealtimeMapTilerMapProps {
  deviceIds: string[];
  center?: [number, number];
  zoom?: number;
  className?: string;
}

const RealtimeMapTilerMap: React.FC<RealtimeMapTilerMapProps> = ({
  deviceIds,
  center = [-74.006, 40.7128],
  zoom = 10,
  className = "w-full h-96"
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
        marker = new maplibregl.Marker()
          .setLngLat(lngLat)
          .addTo(map.current!);
        markers.current.set(deviceId, marker);
      } else {
        marker.setLngLat(lngLat);
      }
    });
  }, [positions]);

  return <div ref={mapContainer} className={className} />;
};

export default RealtimeMapTilerMap;
