
import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { mapTilerService } from '@/services/mapTiler/mapTilerService';
import type { Vehicle } from '@/services/unifiedVehicleData';

interface ThemeAwareMapProps {
  vehicles: Vehicle[];
  onVehicleSelect?: (vehicle: Vehicle) => void;
  selectedVehicle?: Vehicle | null;
  height?: string;
  className?: string;
}

const ThemeAwareMap: React.FC<ThemeAwareMapProps> = ({
  vehicles,
  onVehicleSelect,
  selectedVehicle,
  height = '400px',
  className = ''
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<Map<string, maplibregl.Marker>>(new Map());
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Get map style (always light theme)
  const getMapStyle = () => {
    return `https://api.maptiler.com/maps/dataviz/style.json?key=${mapTilerService.getApiKey()}`;
  };

  // Get vehicle status
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
      case 'online': 
        return '#22c55e';
      case 'idle': 
        return '#eab308';
      default: 
        return '#6b7280';
    }
  };

  // Create marker element
  const createMarkerElement = (vehicle: Vehicle) => {
    const status = getVehicleStatus(vehicle);
    const element = document.createElement('div');
    element.className = 'vehicle-marker';
    
    const isSelected = selectedVehicle?.deviceid === vehicle.deviceid;
    const borderColor = '#ffffff';
    const selectedBorder = '#3b82f6';
    
    element.innerHTML = `
      <div class="relative cursor-pointer transition-all duration-200 hover:scale-110 ${isSelected ? 'scale-125' : ''}">
        <div class="w-6 h-6 rounded-full border-2 shadow-lg"
             style="background-color: ${getStatusColor(status)}; border-color: ${borderColor}">
        </div>
        ${isSelected ? `<div class="absolute -inset-2 rounded-full border-2 animate-pulse" style="border-color: ${selectedBorder}"></div>` : ''}
      </div>
    `;

    element.addEventListener('click', () => {
      onVehicleSelect?.(vehicle);
    });

    return element;
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    mapTilerService.initialize();

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: getMapStyle(),
      center: [0, 0],
      zoom: 12,
      attributionControl: false
    });

    // Add controls
    const navControl = new maplibregl.NavigationControl({
      visualizePitch: true
    });
    map.current.addControl(navControl, 'top-right');

    map.current.on('load', () => {
      setIsMapLoaded(true);
    });

    return () => {
      markers.current.forEach(marker => marker.remove());
      map.current?.remove();
    };
  }, []);

  // Update markers when vehicles change
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current.clear();

    const validVehicles = vehicles.filter(v => 
      v.lastPosition?.lat && 
      v.lastPosition?.lon &&
      !isNaN(v.lastPosition.lat) &&
      !isNaN(v.lastPosition.lon)
    );

    if (validVehicles.length === 0) return;

    // Add markers
    validVehicles.forEach(vehicle => {
      const element = createMarkerElement(vehicle);
      
      const marker = new maplibregl.Marker(element)
        .setLngLat([vehicle.lastPosition!.lon, vehicle.lastPosition!.lat])
        .addTo(map.current!);

      markers.current.set(vehicle.deviceid, marker);
    });

    // Fit bounds to show all vehicles
    if (validVehicles.length === 1) {
      const vehicle = validVehicles[0];
      map.current.flyTo({
        center: [vehicle.lastPosition!.lon, vehicle.lastPosition!.lat],
        zoom: 16
      });
    } else if (validVehicles.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      validVehicles.forEach(vehicle => {
        bounds.extend([vehicle.lastPosition!.lon, vehicle.lastPosition!.lat]);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [vehicles, isMapLoaded, selectedVehicle]);

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapContainer} 
        className="w-full rounded-lg overflow-hidden border border-border"
        style={{ height }}
      />
      {!isMapLoaded && (
        <div className="absolute inset-0 bg-background rounded-lg flex items-center justify-center border border-border">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-2 animate-pulse bg-primary/20 rounded-full" />
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeAwareMap;
