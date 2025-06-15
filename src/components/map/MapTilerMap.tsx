
import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useMapMarkers } from './hooks/useMapMarkers';
import type { VehicleData } from '@/types/vehicle';
import { mapTilerService } from '@/services/mapTiler/mapTilerService';
import { supabase, SUPABASE_URL } from '@/integrations/supabase/client';

interface MapTilerMapProps {
  vehicles: VehicleData[];
  height?: string;
  onVehicleSelect?: (vehicle: VehicleData) => void;
  selectedVehicle?: VehicleData | null;
  defaultZoom?: number;
  showControls?: boolean;
}

const MapTilerMap: React.FC<MapTilerMapProps> = ({
  vehicles,
  height = '400px',
  onVehicleSelect,
  selectedVehicle,
  defaultZoom = 10,
  showControls = true
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

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
        // Only transform requests going to our own Supabase proxy.
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
        // For all other URLs (e.g., the fallback demo style), do not modify the request.
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

  // Use markers hook
  const markersRef = useMapMarkers(
    map.current,
    isMapLoaded,
    validVehicles,
    selectedVehicle,
    onVehicleSelect
  );

  return (
    <div className="relative w-full" style={{ height }}>
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
      
      {/* Vehicle count overlay */}
      {validVehicles.length > 0 && (
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
          <div className="text-sm font-medium text-gray-900">
            {validVehicles.length} vehicle{validVehicles.length !== 1 ? 's' : ''} shown
          </div>
        </div>
      )}

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

export default MapTilerMap;
