
import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

interface MapControlsProps {
  map: maplibregl.Map | null;
  showControls: boolean;
}

const MapControls: React.FC<MapControlsProps> = ({ map, showControls }) => {
  const navigationControlRef = useRef<maplibregl.NavigationControl | null>(null);

  useEffect(() => {
    if (!map || !showControls) {
      return;
    }

    // Create and add navigation control
    const navigationControl = new maplibregl.NavigationControl();
    navigationControlRef.current = navigationControl;
    
    try {
      map.addControl(navigationControl, 'top-right');
    } catch (error) {
      console.warn('Failed to add navigation control:', error);
      navigationControlRef.current = null;
    }

    return () => {
      // Clean up navigation control
      if (navigationControlRef.current && map && !map._removed) {
        try {
          map.removeControl(navigationControlRef.current);
        } catch (error) {
          console.warn('Failed to remove navigation control:', error);
        }
      }
      navigationControlRef.current = null;
    };
  }, [map, showControls]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (navigationControlRef.current && map && !map._removed) {
        try {
          map.removeControl(navigationControlRef.current);
        } catch (error) {
          console.warn('Failed to remove navigation control on unmount:', error);
        }
      }
      navigationControlRef.current = null;
    };
  }, []);

  return null; // This component doesn't render anything visible
};

export default MapControls;
