
import React from 'react';
import FleetMetricsDisplay from './FleetMetricsDisplay';
import VehicleStatusDistribution from './VehicleStatusDistribution';
import FleetQuickStats from './FleetQuickStats';
import type { VehicleMetrics, Vehicle } from '@/services/unifiedVehicleData';
import type { SyncMetrics } from '@/services/vehiclePosition/types';

interface FleetOverviewTabProps {
  metrics: VehicleMetrics;
  syncMetrics: SyncMetrics;
  vehicles: Vehicle[];
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  getVehiclesByStatus: () => {
    online: Vehicle[];
    offline: Vehicle[];
    alerts: Vehicle[];
  };
}

const FleetOverviewTab: React.FC<FleetOverviewTabProps> = ({
  metrics,
  syncMetrics,
  vehicles,
  isLoading,
  isRefreshing,
  onRefresh,
  getVehiclesByStatus
}) => {
  const vehiclesByStatus = getVehiclesByStatus();

  return (
    <div className="space-y-6">
      <FleetMetricsDisplay 
        metrics={metrics} 
        syncMetrics={syncMetrics}
        isLoading={isLoading} 
        isRefreshing={isRefreshing}
        onRefresh={onRefresh}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VehicleStatusDistribution 
          metrics={metrics}
          vehiclesByStatus={vehiclesByStatus}
          isLoading={isLoading}
        />

        <FleetQuickStats 
          metrics={metrics}
          vehicles={vehicles}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default FleetOverviewTab;
