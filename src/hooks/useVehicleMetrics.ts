
import { useState, useEffect } from 'react';
import { enhancedVehicleDataService } from '@/services/EnhancedVehicleDataService';
import type { VehicleMetrics } from '@/types/vehicle';

export const useVehicleMetrics = () => {
  const [metrics, setMetrics] = useState<VehicleMetrics>({
    totalVehicles: 0,
    onlineVehicles: 0,
    movingVehicles: 0,
    idleVehicles: 0,
    offlineVehicles: 0,
    recentlyActiveVehicles: 0,
    lastSyncTime: new Date(),
    averageSpeed: 0,
    totalDistance: 0,
    syncStatus: 'pending',
    errors: [],
    errorMessage: undefined,
    total: 0,
    online: 0,
    offline: 0,
    idle: 0,
    alerts: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = enhancedVehicleDataService.subscribe('metrics-hook', async (data) => {
      try {
        setMetrics(data.metrics);
        setError(null);
        setIsLoading(false);
      } catch (err) {
        console.error('Error updating vehicle metrics:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        setIsLoading(false);
      }
    });

    enhancedVehicleDataService.getVehicleData();

    return unsubscribe;
  }, []);

  const refreshMetrics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await enhancedVehicleDataService.forceSync();
    } catch (err) {
      console.error('Error refreshing metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh metrics');
    } finally {
      setIsLoading(false);
    }
  };

  const forceSync = async () => {
    await refreshMetrics();
  };

  return {
    metrics,
    isLoading,
    error,
    refreshMetrics,
    forceSync
  };
};
