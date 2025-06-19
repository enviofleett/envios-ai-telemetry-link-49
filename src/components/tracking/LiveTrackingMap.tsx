
import React from 'react';
import type { VehicleData } from '@/types/vehicle';

interface LiveTrackingMapProps {
  vehicles: VehicleData[];
  selectedVehicle: VehicleData | null;
  onVehicleSelect: (vehicle: VehicleData) => void;
  showTrails: boolean;
  vehicleTrails: Map<string, any[]>;
  getVehicleTrail: (deviceId: string) => any[];
}

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  vehicles,
  selectedVehicle,
  onVehicleSelect,
  showTrails,
  vehicleTrails,
  getVehicleTrail
}) => {
  return (
    <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center text-gray-500">
        <div className="text-lg font-medium">Live Map Component</div>
        <div className="text-sm mt-2">
          {vehicles.length} vehicles • {showTrails ? 'Trails enabled' : 'Trails disabled'}
        </div>
        {selectedVehicle && (
          <div className="text-sm mt-1">
            Selected: {selectedVehicle.device_name}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTrackingMap;
