
import React from 'react';
import SyncStatusCard from './VehiclePositionMonitor/SyncStatusCard';
import VehiclePositionList from './VehiclePositionMonitor/VehiclePositionList';
import { useVehiclePositions } from './VehiclePositionMonitor/useVehiclePositions';
import { isVehicleOnline } from './VehiclePositionMonitor/utils';

const VehiclePositionMonitor: React.FC = () => {
  const {
    vehicles,
    isLoading,
    isRefreshing,
    syncMetrics,
    handleForceSync
  } = useVehiclePositions();

  const onlineVehicles = vehicles.filter(isVehicleOnline);

  return (
    <div className="space-y-6">
      <SyncStatusCard
        syncMetrics={syncMetrics}
        onlineVehiclesCount={onlineVehicles.length}
        isRefreshing={isRefreshing}
        onForceSync={handleForceSync}
      />

      <VehiclePositionList
        vehicles={vehicles}
        isLoading={isLoading}
      />
    </div>
  );
};

export default VehiclePositionMonitor;
