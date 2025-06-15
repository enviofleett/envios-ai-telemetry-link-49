
import React from 'react';
import MapTilerMap from '@/components/map/MapTilerMap';
import type { VehicleData } from '@/types/vehicle';

interface DeliveryTrackingMapProps {
  vehicles: VehicleData[];
  selectedVehicle: VehicleData | null;
  onVehicleSelect: (vehicle: VehicleData | null) => void;
}

const DeliveryTrackingMap: React.FC<DeliveryTrackingMapProps> = ({ vehicles, selectedVehicle, onVehicleSelect }) => {
  return (
    <MapTilerMap
      vehicles={vehicles}
      selectedVehicle={selectedVehicle}
      onVehicleSelect={onVehicleSelect}
      height="100%"
      defaultZoom={12}
    />
  );
};

export default DeliveryTrackingMap;
