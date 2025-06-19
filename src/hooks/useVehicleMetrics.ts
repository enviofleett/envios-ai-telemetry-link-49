
import { useState, useEffect } from 'react';
import { enhancedVehicleDataService } from '@/services/enhancedVehicleDataService';
import type { VehicleDataMetrics } from '@/types/vehicle';

export const useVehicleMetrics = () => {
  const [metrics, setMetrics] = useState<VehicleDataMetrics>({
    total: 0,
    online: 0,
    offline: 0,
    idle: 0,
    alerts: 0,
    totalVehicles: 0,
    onlineVehicles: 0,
    offlineVehicles: 0,
    recentlyActiveVehicles: 0,
    lastSyncTime: new Date(),
    positionsUpdated: 0,
    errors: 0,
    syncStatus: 'success'
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = enhancedVehicleDataService.subscribe(() => {
      const vehicles = enhancedVehicleDataService.getEnhancedVehicles();
      const serviceMetrics = enhancedVehicleDataService.getMetrics();
      const syncMetrics = enhancedVehicleDataService.getLastSyncMetrics();
      
      const expandedMetrics: VehicleDataMetrics = {
        total: serviceMetrics.total,
        online: serviceMetrics.online,
        offline: serviceMetrics.offline,
        idle: serviceMetrics.idle,
        alerts: serviceMetrics.alerts,
        totalVehicles: serviceMetrics.totalVehicles,
        onlineVehicles: serviceMetrics.onlineVehicles,
        offlineVehicles: serviceMetrics.offlineVehicles,
        recentlyActiveVehicles: serviceMetrics.recentlyActiveVehicles,
        lastSyncTime: serviceMetrics.lastSyncTime,
        positionsUpdated: syncMetrics.positionsUpdated,
        errors: syncMetrics.errors,
        syncStatus: syncMetrics.syncStatus,
        errorMessage: syncMetrics.errorMessage
      };
      
      setMetrics(expandedMetrics);
      setIsLoading(false);
    });

    // Initial load
    const vehicles = enhancedVehicleDataService.getEnhancedVehicles();
    const serviceMetrics = enhancedVehicleDataService.getMetrics();
    const syncMetrics = enhancedVehicleDataService.getLastSyncMetrics();
    
    setMetrics({
      total: serviceMetrics.total,
      online: serviceMetrics.online,
      offline: serviceMetrics.offline,
      idle: serviceMetrics.idle,
      alerts: serviceMetrics.alerts,
      totalVehicles: serviceMetrics.totalVehicles,
      onlineVehicles: serviceMetrics.onlineVehicles,
      offlineVehicles: serviceMetrics.offlineVehicles,
      recentlyActiveVehicles: serviceMetrics.recentlyActiveVehicles,
      lastSyncTime: serviceMetrics.lastSyncTime,
      positionsUpdated: syncMetrics.positionsUpdated,
      errors: syncMetrics.errors,
      syncStatus: syncMetrics.syncStatus,
      errorMessage: syncMetrics.errorMessage
    });
    setIsLoading(false);

    return unsubscribe;
  }, []);

  return {
    metrics,
    isLoading
  };
};
