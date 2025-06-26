
import { useState, useEffect } from 'react';
import { enhancedVehicleDataService } from '@/services/EnhancedVehicleDataService';
import type { VehicleMetrics, SyncMetrics } from '@/services/EnhancedVehicleDataService';

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
    syncStatus: 'success',
    errors: [],
    errorMessage: undefined
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = enhancedVehicleDataService.subscribe('metrics-hook', async (data) => {
      try {
        const serviceMetrics = enhancedVehicleDataService.getMetrics();
        const syncMetrics = enhancedVehicleDataService.getLastSyncMetrics();
        
        if (serviceMetrics) {
          setMetrics(serviceMetrics);
        }
        
        setError(null);
        setIsLoading(false);
      } catch (err) {
        console.error('Error updating vehicle metrics:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        setIsLoading(false);
      }
    });

    // Initial load
    const loadInitialData = async () => {
      try {
        await enhancedVehicleDataService.getVehicleData();
        const serviceMetrics = enhancedVehicleDataService.getMetrics();
        
        if (serviceMetrics) {
          setMetrics(serviceMetrics);
        }
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading initial vehicle metrics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load initial data');
        setIsLoading(false);
      }
    };

    loadInitialData();

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
    setIsLoading(true);
    setError(null);
    try {
      await enhancedVehicleDataService.forceSync();
    } catch (err) {
      console.error('Error forcing sync:', err);
      setError(err instanceof Error ? err.message : 'Failed to force sync');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    metrics,
    isLoading,
    error,
    refreshMetrics,
    forceSync
  };
};
