
import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { mapTilerService } from '@/services/mapTiler/mapTilerService';
import type { Vehicle } from '@/services/unifiedVehicleData';

interface MapTilerMapProps {
  vehicles: Vehicle[];
  height?: string;
  onVehicleSelect?: (vehicle: Vehicle) => void;
  defaultZoom?: number;
  showControls?: boolean;
  className?: string;
}

interface VehicleMarker {
  vehicle: Vehicle;
  marker: maplibregl.Marker;
  element: HTMLElement;
}

const MapTilerMap: React.FC<MapTilerMapProps> = ({
  vehicles,
  height = '400px',
  onVehicleSelect,
  defaultZoom = 12,
  showControls = true,
  className = ''
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<VehicleMarker[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const getVehicleStatus = (vehicle: Vehicle) => {
    if (!vehicle.lastPosition?.updatetime) return 'offline';
    
    const lastUpdate = new Date(vehicle.lastPosition.updatetime);
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    
    if (minutesSinceUpdate <= 5) return 'online';
    if (minutesSinceUpdate <= 30) return 'idle';
    return 'offline';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#22c55e';
      case 'idle': return '#eab308';
      default: return '#6b7280';
    }
  };

  const createMarkerElement = (vehicle: Vehicle) => {
    const status = getVehicleStatus(vehicle);
    const color = getStatusColor(status);
    
    const el = document.createElement('div');
    el.className = 'vehicle-marker';
    el.style.cssText = `
      background-color: ${color};
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      cursor: pointer;
      position: relative;
    `;
    
    // Add tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'vehicle-tooltip';
    tooltip.style.cssText = `
      position: absolute;
      bottom: 25px;
      left: 50%;
      transform: translateX(-50%);
      background: black;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s;
      z-index: 1000;
    `;
    tooltip.textContent = vehicle.devicename;
    el.appendChild(tooltip);
    
    // Show/hide tooltip on hover
    el.addEventListener('mouseenter', () => {
      tooltip.style.opacity = '1';
    });
    
    el.addEventListener('mouseleave', () => {
      tooltip.style.opacity = '0';
    });
    
    // Click handler
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      onVehicleSelect?.(vehicle);
    });
    
    return el;
  };

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

    if (showControls) {
      map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    }

    map.current.on('load', () => {
      setIsMapLoaded(true);
    });

    return () => {
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current = [];
      map.current?.remove();
    };
  }, [defaultZoom, showControls]);

  // Update markers when vehicles change
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(({ marker }) => marker.remove());
    markersRef.current = [];

    // Filter vehicles with valid positions
    const validVehicles = vehicles.filter(v => 
      v.lastPosition?.lat && 
      v.lastPosition?.lon &&
      !isNaN(v.lastPosition.lat) &&
      !isNaN(v.lastPosition.lon)
    );

    if (validVehicles.length === 0) {
      // Center on a default location if no vehicles
      map.current.setCenter([0, 0]);
      map.current.setZoom(2);
      return;
    }

    // Add new markers
    const newMarkers: VehicleMarker[] = validVehicles.map(vehicle => {
      const element = createMarkerElement(vehicle);
      const marker = new maplibregl.Marker(element)
        .setLngLat([vehicle.lastPosition!.lon, vehicle.lastPosition!.lat])
        .addTo(map.current!);

      return { vehicle, marker, element };
    });

    markersRef.current = newMarkers;

    // Fit bounds to show all vehicles
    if (validVehicles.length === 1) {
      const vehicle = validVehicles[0];
      map.current.setCenter([vehicle.lastPosition!.lon, vehicle.lastPosition!.lat]);
      map.current.setZoom(16);
    } else if (validVehicles.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      validVehicles.forEach(vehicle => {
        bounds.extend([vehicle.lastPosition!.lon, vehicle.lastPosition!.lat]);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [vehicles, isMapLoaded]);

  return (
    <div 
      ref={mapContainer} 
      className={`w-full ${className}`}
      style={{ height }}
    />
  );
};

export default MapTilerMap;
