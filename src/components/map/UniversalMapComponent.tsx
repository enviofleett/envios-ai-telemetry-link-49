
import React from 'react';
import { MapIntegrationProps } from '@/types/mapIntegration';
import UniversalMapProvider from './UniversalMapProvider';
import type { Vehicle } from '@/services/unifiedVehicleData';

interface UniversalMapComponentProps extends MapIntegrationProps {
  vehicles?: Vehicle[];
  title?: string;
  showControls?: boolean;
}

const UniversalMapComponent: React.FC<UniversalMapComponentProps> = ({
  vehicles = [],
  showVehicles = true,
  showGeofences = false,
  showRoutes = false,
  height = '400px',
  interactive = true,
  clustered = true,
  enableLocationServices = true,
  onVehicleSelect,
  onLocationSelect,
  center,
  zoom = 10,
  className = '',
  title,
  showControls = true
}) => {
  const handleVehicleSelect = (vehicle: Vehicle) => {
    onVehicleSelect?.(vehicle);
  };

  const displayVehicles = showVehicles ? vehicles : [];

  return (
    <div className={`w-full ${className}`}>
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      )}
      
      <UniversalMapProvider
        vehicles={displayVehicles}
        onVehicleSelect={handleVehicleSelect}
        center={center}
        zoom={zoom}
        height={height}
        enableClustering={clustered}
        className="rounded-lg border"
      />
      
      {showControls && vehicles.length > 0 && (
        <div className="mt-2 text-sm text-gray-500 text-center">
          Showing {displayVehicles.length} vehicles • Multi-provider map system
        </div>
      )}
    </div>
  );
};

export default UniversalMapComponent;
