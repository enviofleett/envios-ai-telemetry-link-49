
import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin } from 'lucide-react';

interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
  color?: string;
}

interface MapDisplayProps {
  markers?: MapMarker[];
  height?: string;
  initialViewport?: {
    latitude: number;
    longitude: number;
    zoom: number;
  };
  onMarkerClick?: (marker: MapMarker) => void;
  mapStyle?: string;
  className?: string;
}

const MapDisplay: React.FC<MapDisplayProps> = ({
  markers = [],
  height = '400px',
  initialViewport = {
    latitude: 6.5244, // Lagos, Nigeria
    longitude: 3.3792,
    zoom: 10
  },
  onMarkerClick,
  mapStyle,
  className = ''
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: maplibregl.Marker }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // MapTiler API key - using demo key for now, should be replaced with environment variable
  const MAPTILER_API_KEY = process.env.REACT_APP_MAPTILER_API_KEY || 'demo';
  
  const defaultMapStyle = mapStyle || `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_API_KEY}`;

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: defaultMapStyle,
        center: [initialViewport.longitude, initialViewport.latitude],
        zoom: initialViewport.zoom,
        attributionControl: false
      });

      map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
      map.current.addControl(new maplibregl.ScaleControl(), 'bottom-left');

      map.current.on('load', () => {
        setIsLoading(false);
        setError(null);
      });

      map.current.on('error', (e) => {
        console.error('Map loading error:', e);
        setError('Failed to load map. Please check your connection and try again.');
        setIsLoading(false);
      });

    } catch (error) {
      console.error('Map initialization error:', error);
      setError('Failed to initialize map.');
      setIsLoading(false);
    }

    return () => {
      // Clean up markers
      Object.values(markersRef.current).forEach(marker => marker.remove());
      markersRef.current = {};
      
      // Clean up map
      map.current?.remove();
    };
  }, [defaultMapStyle, initialViewport]);

  // Update markers
  useEffect(() => {
    if (!map.current || isLoading) return;

    // Remove existing markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    // Add new markers
    markers.forEach((markerData) => {
      const markerElement = document.createElement('div');
      markerElement.className = 'cursor-pointer transform hover:scale-110 transition-transform';
      markerElement.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${markerData.color || '#ef4444'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      `;
      markerElement.title = markerData.title || `Marker ${markerData.id}`;

      const marker = new maplibregl.Marker({ element: markerElement })
        .setLngLat([markerData.longitude, markerData.latitude])
        .addTo(map.current!);

      // Add click handler
      markerElement.addEventListener('click', () => {
        if (onMarkerClick) {
          onMarkerClick(markerData);
        }
        // Center map on clicked marker
        map.current?.flyTo({
          center: [markerData.longitude, markerData.latitude],
          zoom: Math.max(map.current.getZoom(), 14),
          duration: 1000
        });
      });

      markersRef.current[markerData.id] = marker;
    });
  }, [markers, isLoading, onMarkerClick]);

  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}
        style={{ height }}
      >
        <div className="text-center p-4">
          <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`} style={{ height }}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
      
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};

export default MapDisplay;
