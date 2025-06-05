
import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapTilerApi } from '@/hooks/useMapTilerApi';
import { Card, CardContent } from '@/components/ui/card';
import LoadingSpinner from '@/components/LoadingSpinner';
import { AlertTriangle } from 'lucide-react';

interface MapTilerMapProps {
  vehicles?: Array<{
    deviceid: string;
    devicename: string;
    lastPosition?: {
      lat: number;
      lon: number;
      speed?: number;
      course?: number;
      updatetime: string;
      statusText?: string;
    };
    status?: string;
  }>;
  onVehicleSelect?: (vehicle: any) => void;
  center?: [number, number];
  zoom?: number;
  height?: string;
  className?: string;
}

const MapTilerMap: React.FC<MapTilerMapProps> = ({
  vehicles = [],
  onVehicleSelect,
  center = [0, 0],
  zoom = 2,
  height = '500px',
  className = ''
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const { apiKey, isLoading, error } = useMapTilerApi();
  const [mapError, setMapError] = useState<string | null>(null);

  const getVehicleStatus = (vehicle: any) => {
    if (!vehicle.lastPosition?.updatetime) return 'offline';
    
    const lastUpdate = new Date(vehicle.lastPosition.updatetime);
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    
    if (minutesSinceUpdate <= 5) return 'online';
    if (minutesSinceUpdate <= 30) return 'idle';
    return 'offline';
  };

  const getMarkerColor = (vehicle: any) => {
    const status = getVehicleStatus(vehicle);
    switch (status) {
      case 'online': return '#10B981'; // green
      case 'idle': return '#F59E0B'; // yellow
      default: return '#6B7280'; // gray
    }
  };

  const getStatusIcon = (vehicle: any) => {
    const status = getVehicleStatus(vehicle);
    const speed = vehicle.lastPosition?.speed || 0;
    
    if (status === 'online' && speed > 0) {
      return '🚗'; // Moving vehicle
    } else if (status === 'online') {
      return '🟢'; // Stopped but online
    } else if (status === 'idle') {
      return '🟡'; // Idle
    } else {
      return '⚫'; // Offline
    }
  };

  // Initialize map when API key is available
  useEffect(() => {
    if (!apiKey || !mapContainer.current || map.current) return;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${apiKey}`,
        center: center,
        zoom: zoom,
        attributionControl: true
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

      map.current.on('error', (e) => {
        console.error('MapTiler error:', e);
        setMapError('Failed to load map');
      });

      map.current.on('load', () => {
        console.log('MapTiler map loaded successfully');
      });

    } catch (err) {
      console.error('Error initializing map:', err);
      setMapError('Failed to initialize map');
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [apiKey, center, zoom]);

  // Update vehicle markers
  useEffect(() => {
    if (!map.current || !vehicles.length) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add new markers for vehicles with positions
    vehicles.forEach(vehicle => {
      if (!vehicle.lastPosition?.lat || !vehicle.lastPosition?.lon) return;

      const status = getVehicleStatus(vehicle);
      const markerColor = getMarkerColor(vehicle);
      const statusIcon = getStatusIcon(vehicle);

      // Create custom marker element with enhanced styling
      const markerElement = document.createElement('div');
      markerElement.className = 'custom-vehicle-marker';
      markerElement.style.cssText = `
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background-color: ${markerColor};
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        color: white;
        position: relative;
        transition: all 0.2s ease;
      `;

      // Add status indicator text
      markerElement.textContent = vehicle.devicename.substring(0, 2).toUpperCase();

      // Add hover effects
      markerElement.addEventListener('mouseenter', () => {
        markerElement.style.transform = 'scale(1.2)';
        markerElement.style.zIndex = '1000';
      });

      markerElement.addEventListener('mouseleave', () => {
        markerElement.style.transform = 'scale(1)';
        markerElement.style.zIndex = 'auto';
      });

      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([vehicle.lastPosition.lon, vehicle.lastPosition.lat])
        .addTo(map.current!);

      // Create enhanced popup with more details
      const lastUpdate = new Date(vehicle.lastPosition.updatetime);
      const timeDiff = Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 60));
      const timeAgo = timeDiff < 1 ? 'Just now' : 
                     timeDiff < 60 ? `${timeDiff}m ago` : 
                     timeDiff < 1440 ? `${Math.floor(timeDiff / 60)}h ago` : 
                     lastUpdate.toLocaleDateString();

      const popup = new mapboxgl.Popup({ 
        offset: 25,
        closeButton: true,
        closeOnClick: false
      }).setHTML(`
        <div class="p-3 min-w-[250px]">
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-semibold text-base text-gray-900">${vehicle.devicename}</h3>
            <div class="flex items-center gap-1">
              <div class="w-2 h-2 rounded-full" style="background-color: ${markerColor}"></div>
              <span class="text-xs font-medium capitalize">${status}</span>
            </div>
          </div>
          
          <div class="space-y-1 text-sm text-gray-600">
            <div><strong>ID:</strong> ${vehicle.deviceid}</div>
            <div><strong>Speed:</strong> ${vehicle.lastPosition.speed || 0} km/h</div>
            ${vehicle.lastPosition.course ? `<div><strong>Direction:</strong> ${vehicle.lastPosition.course}°</div>` : ''}
            <div><strong>Location:</strong> ${vehicle.lastPosition.lat.toFixed(4)}, ${vehicle.lastPosition.lon.toFixed(4)}</div>
            <div><strong>Last Update:</strong> ${timeAgo}</div>
            ${vehicle.lastPosition.statusText ? `<div><strong>Status:</strong> ${vehicle.lastPosition.statusText}</div>` : ''}
          </div>

          ${onVehicleSelect ? `
            <button 
              onclick="window.selectVehicle('${vehicle.deviceid}')"
              class="mt-3 w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
            >
              View Details
            </button>
          ` : ''}
        </div>
      `);

      marker.setPopup(popup);

      // Add click handler for vehicle selection
      markerElement.addEventListener('click', () => {
        if (onVehicleSelect) {
          onVehicleSelect(vehicle);
        }
      });

      markers.current.push(marker);
    });

    // Set up global vehicle selection function for popup buttons
    if (onVehicleSelect) {
      (window as any).selectVehicle = (deviceId: string) => {
        const vehicle = vehicles.find(v => v.deviceid === deviceId);
        if (vehicle) {
          onVehicleSelect(vehicle);
        }
      };
    }

    // Fit map to show all markers if we have vehicles
    if (vehicles.length > 0 && markers.current.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      markers.current.forEach(marker => {
        bounds.extend(marker.getLngLat());
      });
      
      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, { 
          padding: 50, 
          maxZoom: 15,
          duration: 1000
        });
      }
    }
  }, [vehicles, onVehicleSelect]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="flex items-center justify-center" style={{ height }}>
            <div className="text-center">
              <LoadingSpinner />
              <p className="text-sm text-gray-600 mt-2">Loading map...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || mapError) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="flex items-center justify-center" style={{ height }}>
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-red-600">{error || mapError}</p>
              <p className="text-xs text-gray-500 mt-1">
                Please check your MapTiler configuration in Admin Settings
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-0">
        <div 
          ref={mapContainer} 
          className="w-full rounded-lg" 
          style={{ height }}
        />
      </CardContent>
    </Card>
  );
};

export default MapTilerMap;
