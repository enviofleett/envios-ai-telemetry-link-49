
import React, { useEffect } from 'react';
import maplibregl from 'maplibre-gl';

interface MapControlsProps {
  map: maplibregl.Map | null;
  showControls: boolean;
}

const MapControls: React.FC<MapControlsProps> = ({ map, showControls }) => {
  useEffect(() => {
    if (!map || !showControls) return;

    const navigationControl = new maplibregl.NavigationControl();
    map.addControl(navigationControl, 'top-right');

    return () => {
      map.removeControl(navigationControl);
    };
  }, [map, showControls]);

  return null; // This component doesn't render anything visible
};

export default MapControls;
