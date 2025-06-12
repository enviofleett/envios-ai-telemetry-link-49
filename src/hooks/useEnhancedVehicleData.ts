
import { useState, useEffect } from 'react';
import { enhancedVehicleDataService } from '@/services/enhancedVehicleDataService';
import { VehicleData, VehicleDataMetrics } from '@/services/vehicleData/types';

export const useEnhancedVehicleData = () => {
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [metrics, setMetrics] = useState<VehicleDataMetrics>({
    totalVehicles: 0,
    onlineVehicles: 0,
    offlineVehicles: 0,
    recentlyActiveVehicles: 0,
    lastSyncTime: new Date(),
    syncStatus: 'success'
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Subscribe to enhanced vehicle data service
    const unsubscribe = enhancedVehicleDataService.subscribe(() => {
      const currentVehicles = enhancedVehicleDataService.getVehicles();
      const currentMetrics = enhancedVehicleDataService.getMetrics();
      
      setVehicles(currentVehicles);
      setMetrics(currentMetrics);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const forceSync = async () => {
    setIsLoading(true);
    try {
      await enhancedVehicleDataService.forceSync();
    } finally {
      // Loading state will be updated via subscription
    }
  };

  return {
    vehicles,
    metrics,
    isLoading,
    forceSync
  };
};
