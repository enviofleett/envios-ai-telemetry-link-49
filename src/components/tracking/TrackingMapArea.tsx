
import React from 'react';
import MapTilerMap from '@/components/map/MapTilerMap';
import { useStableVehicleData } from '@/hooks/useStableVehicleData';
import type { VehicleData } from '@/types/vehicle';

interface TrackingMapAreaProps {
  selectedVehicle: VehicleData | null;
  onVehicleSelect: (vehicle: VehicleData) => void;
  searchTerm: string;
  statusFilter: string;
}

const TrackingMapArea: React.FC<TrackingMapAreaProps> = ({
  selectedVehicle,
  onVehicleSelect,
  searchTerm,
  statusFilter
}) => {
  const { vehicles } = useStableVehicleData({ search: searchTerm });

  const filteredVehicles = vehicles.filter(vehicle => {
    if (statusFilter === 'all') return true;
    return vehicle.status === statusFilter;
  });

  return (
    <div className="h-full w-full">
      <MapTilerMap
        vehicles={filteredVehicles}
        selectedVehicle={selectedVehicle}
        onVehicleSelect={onVehicleSelect}
        height="100%"
        defaultZoom={10}
        showControls={true}
        className="rounded-none"
      />
    </div>
  );
};

export default TrackingMapArea;
