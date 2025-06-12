
import React, { useState, useCallback } from 'react';
import Map, { Marker, NavigationControl, ScaleControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
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
  const [viewState, setViewState] = useState(initialViewport);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // MapTiler API key - using demo key for now, should be replaced with environment variable
  const MAPTILER_API_KEY = process.env.REACT_APP_MAPTILER_API_KEY || 'demo';
  
  const defaultMapStyle = mapStyle || `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_API_KEY}`;

  const handleMapLoad = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  const handleMapError = useCallback((error: any) => {
    console.error('Map loading error:', error);
    setError('Failed to load map. Please check your connection and try again.');
    setIsLoading(false);
  }, []);

  const handleMarkerClick = useCallback((marker: MapMarker) => {
    if (onMarkerClick) {
      onMarkerClick(marker);
    }
    // Center map on clicked marker
    setViewState(prev => ({
      ...prev,
      latitude: marker.latitude,
      longitude: marker.longitude,
      zoom: Math.max(prev.zoom, 14)
    }));
  }, [onMarkerClick]);

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
      
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onLoad={handleMapLoad}
        onError={handleMapError}
        mapStyle={defaultMapStyle}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      >
        {/* Navigation Controls */}
        <NavigationControl position="top-right" />
        <ScaleControl position="bottom-left" />
        
        {/* Markers */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            latitude={marker.latitude}
            longitude={marker.longitude}
            onClick={() => handleMarkerClick(marker)}
          >
            <div 
              className="cursor-pointer transform hover:scale-110 transition-transform"
              title={marker.title || `Marker ${marker.id}`}
            >
              <MapPin 
                className="h-6 w-6" 
                style={{ color: marker.color || '#ef4444' }}
                fill="currentColor"
              />
            </div>
          </Marker>
        ))}
      </Map>
    </div>
  );
};

export default MapDisplay;
