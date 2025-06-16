
import { useState, useEffect } from 'react';
import { enhancedVehicleDataService } from '@/services/enhancedVehicleDataService';

interface VehicleMetrics {
  totalVehicles: number;
  onlineVehicles: number;
  offlineVehicles: number;
  recentlyActiveVehicles: number;
  lastSyncTime: Date;
  syncStatus: 'success' | 'error' | 'syncing' | 'loading';
  errorMessage?: string;
}

export const useVehicleMetrics = () => {
  const [metrics, setMetrics] = useState<VehicleMetrics>({
    totalVehicles: 0,
    onlineVehicles: 0,
    offlineVehicles: 0,
    recentlyActiveVehicles: 0,
    lastSyncTime: new Date(),
    syncStatus: 'loading'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshMetrics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get vehicles from enhanced service
      await enhancedVehicleDataService.getEnhancedVehicles();
      
      // Get metrics from service
      const serviceMetrics = enhancedVehicleDataService.getMetrics();
      
      setMetrics({
        totalVehicles: serviceMetrics.totalVehicles,
        onlineVehicles: serviceMetrics.onlineVehicles,
        offlineVehicles: serviceMetrics.offlineVehicles,
        recentlyActiveVehicles: serviceMetrics.recentlyActiveVehicles,
        lastSyncTime: serviceMetrics.lastSyncTime,
        syncStatus: serviceMetrics.syncStatus,
        errorMessage: serviceMetrics.errorMessage
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch vehicle metrics';
      setError(errorMessage);
      setMetrics(prev => ({ ...prev, syncStatus: 'error', errorMessage }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshMetrics();
    
    // Subscribe to service updates
    const unsubscribe = enhancedVehicleDataService.subscribe(() => {
      const serviceMetrics = enhancedVehicleDataService.getMetrics();
      setMetrics({
        totalVehicles: serviceMetrics.totalVehicles,
        onlineVehicles: serviceMetrics.onlineVehicles,
        offlineVehicles: serviceMetrics.offlineVehicles,
        recentlyActiveVehicles: serviceMetrics.recentlyActiveVehicles,
        lastSyncTime: serviceMetrics.lastSyncTime,
        syncStatus: serviceMetrics.syncStatus,
        errorMessage: serviceMetrics.errorMessage
      });
    });

    return () => unsubscribe();
  }, []);

  return {
    metrics,
    isLoading,
    error,
    refreshMetrics,
    forceSync: enhancedVehicleDataService.forceSync.bind(enhancedVehicleDataService)
  };
};
