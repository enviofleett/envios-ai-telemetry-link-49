
import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { VehicleData } from '@/types/vehicle';
import { mapTilerService } from '@/services/mapTiler/mapTilerService';
import { supabase, SUPABASE_URL } from '@/integrations/supabase/client';
import { useRealtimeVehicleData } from '@/hooks/useRealtimeVehicleData';

interface RealtimeMapTilerMapProps {
  height?: string;
  onVehicleSelect?: (vehicle: VehicleData) => void;
  selectedVehicle?: VehicleData | null;
  defaultZoom?: number;
  showControls?: boolean;
  autoFitBounds?: boolean;
}

const RealtimeMapTilerMap: React.FC<RealtimeMapTilerMapProps> = ({
  height = '400px',
  onVehicleSelect,
  selectedVehicle,
  defaultZoom = 10,
  showControls = true,
  autoFitBounds = true
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  
  const { vehicles, isConnected } = useRealtimeVehicleData();

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    const styleUrl = mapTilerService.getMapStyle();

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: styleUrl,
      center: [0, 0],
      zoom: 2,
      transformRequest: (async (url: string, resourceType?: maplibregl.ResourceType) => {
        if (url.startsWith(SUPABASE_URL)) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            return {
              url: url,
              headers: {
                'Authorization': `Bearer ${session.access_token}`
              }
            };
          }
        }
        return { url };
      }) as unknown as maplibregl.RequestTransformFunction,
    });

    if (showControls) {
      map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
      map.current.addControl(new maplibregl.FullscreenControl(), 'top-right');
    }

    map.current.on('load', () => {
      setIsMapLoaded(true);
    });

    return () => {
      map.current?.remove();
    };
  }, [showControls]);

  // Filter vehicles with valid positions
  const validVehicles = vehicles.filter(v => 
    v.last_position?.latitude && 
    v.last_position?.longitude &&
    !isNaN(v.last_position.latitude) &&
    !isNaN(v.last_position.longitude)
  );

  // Update markers when vehicles change
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();

    // Add new markers
    validVehicles.forEach(vehicle => {
      if (!vehicle.last_position) return;

      const { latitude, longitude } = vehicle.last_position;
      
      // Create marker element
      const markerEl = document.createElement('div');
      markerEl.className = 'relative cursor-pointer';
      
      // Determine marker color based on vehicle status
      const getMarkerColor = () => {
        if (vehicle.isMoving) return '#22c55e'; // Green for moving
        if (vehicle.isOnline) return '#3b82f6'; // Blue for online/idle
        return '#ef4444'; // Red for offline
      };

      const markerColor = getMarkerColor();
      
      markerEl.innerHTML = `
        <div class="relative">
          <div class="w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center" 
               style="background-color: ${markerColor}">
            <div class="w-2 h-2 rounded-full bg-white"></div>
          </div>
          ${vehicle.isMoving ? `
            <div class="absolute -top-1 -right-1">
              <div class="w-3 h-3 rounded-full bg-yellow-400 border border-white animate-pulse"></div>
            </div>
          ` : ''}
        </div>
      `;

      // Create marker
      const marker = new maplibregl.Marker(markerEl)
        .setLngLat([longitude, latitude])
        .addTo(map.current!);

      // Create popup
      const popup = new maplibregl.Popup({
        offset: 25,
        closeButton: false,
        closeOnClick: false
      }).setHTML(`
        <div class="p-2">
          <div class="font-semibold text-sm">${vehicle.device_name}</div>
          <div class="text-xs text-gray-600 mt-1">
            <div>ID: ${vehicle.device_id}</div>
            <div>Status: <span class="font-medium ${
              vehicle.isMoving ? 'text-green-600' : 
              vehicle.isOnline ? 'text-blue-600' : 'text-red-600'
            }">
              ${vehicle.isMoving ? 'Moving' : vehicle.isOnline ? 'Online' : 'Offline'}
            </span></div>
            ${vehicle.last_position?.speed !== undefined ? 
              `<div>Speed: ${Math.round(vehicle.last_position.speed)} km/h</div>` : ''
            }
            <div class="text-xs text-gray-500 mt-1">
              Updated: ${new Date(vehicle.lastUpdate).toLocaleTimeString()}
            </div>
          </div>
        </div>
      `);

      // Add click handler
      markerEl.addEventListener('click', () => {
        onVehicleSelect?.(vehicle);
      });

      // Add hover effects
      markerEl.addEventListener('mouseenter', () => {
        popup.addTo(map.current!);
        marker.setPopup(popup);
      });

      markerEl.addEventListener('mouseleave', () => {
        popup.remove();
      });

      markersRef.current.set(vehicle.device_id, marker);
    });

    // Auto-fit bounds if enabled and we have vehicles
    if (autoFitBounds && validVehicles.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      validVehicles.forEach(vehicle => {
        if (vehicle.last_position) {
          bounds.extend([vehicle.last_position.longitude, vehicle.last_position.latitude]);
        }
      });

      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15
        });
      }
    }

  }, [validVehicles, isMapLoaded, onVehicleSelect, autoFitBounds]);

  // Highlight selected vehicle
  useEffect(() => {
    if (!selectedVehicle || !map.current || !isMapLoaded) return;

    const marker = markersRef.current.get(selectedVehicle.device_id);
    if (marker && selectedVehicle.last_position) {
      // Pan to selected vehicle
      map.current.easeTo({
        center: [selectedVehicle.last_position.longitude, selectedVehicle.last_position.latitude],
        zoom: Math.max(map.current.getZoom(), 14),
        duration: 1000
      });

      // Add highlight effect
      const markerElement = marker.getElement();
      markerElement.style.transform = 'scale(1.2)';
      markerElement.style.zIndex = '1000';

      // Remove highlight after 3 seconds
      setTimeout(() => {
        markerElement.style.transform = '';
        markerElement.style.zIndex = '';
      }, 3000);
    }
  }, [selectedVehicle, isMapLoaded]);

  return (
    <div className="relative w-full" style={{ height }}>
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
      
      {/* Connection Status Indicator */}
      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
        <div className="flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="font-medium">
            {isConnected ? 'Live' : 'Disconnected'}
          </span>
          {validVehicles.length > 0 && (
            <span className="text-muted-foreground">
              • {validVehicles.length} vehicle{validVehicles.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm">
        <div className="text-xs font-medium mb-2">Vehicle Status</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Moving</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Online</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Offline</span>
          </div>
        </div>
      </div>

      {/* No data overlay */}
      {validVehicles.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Vehicle Locations</h3>
            <p className="text-gray-500">No vehicles with valid GPS coordinates</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealtimeMapTilerMap;
