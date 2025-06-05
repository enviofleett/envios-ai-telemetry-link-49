
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
      updatetime: string;
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

      const getMarkerColor = (status?: string) => {
        if (!status) return '#6B7280'; // gray
        if (status.toLowerCase().includes('online')) return '#10B981'; // green
        if (status.toLowerCase().includes('idle')) return '#F59E0B'; // yellow
        return '#EF4444'; // red
      };

      // Create custom marker element
      const markerElement = document.createElement('div');
      markerElement.className = 'custom-marker';
      markerElement.style.cssText = `
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background-color: ${getMarkerColor(vehicle.status)};
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        cursor: pointer;
      `;

      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([vehicle.lastPosition.lon, vehicle.lastPosition.lat])
        .addTo(map.current!);

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 15 })
        .setHTML(`
          <div class="p-2">
            <h3 class="font-semibold text-sm">${vehicle.devicename}</h3>
            <p class="text-xs text-gray-600">ID: ${vehicle.deviceid}</p>
            <p class="text-xs">Speed: ${vehicle.lastPosition.speed || 0} km/h</p>
            <p class="text-xs">Updated: ${new Date(vehicle.lastPosition.updatetime).toLocaleTimeString()}</p>
          </div>
        `);

      marker.setPopup(popup);

      // Add click handler
      markerElement.addEventListener('click', () => {
        if (onVehicleSelect) {
          onVehicleSelect(vehicle);
        }
      });

      markers.current.push(marker);
    });

    // Fit map to show all markers if we have vehicles
    if (vehicles.length > 0 && markers.current.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      markers.current.forEach(marker => {
        bounds.extend(marker.getLngLat());
      });
      
      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
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
