
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = enhancedVehicleDataService.subscribe(async () => {
      try {
        const vehicles = await enhancedVehicleDataService.getEnhancedVehicles();
        const serviceMetrics = enhancedVehicleDataService.getMetrics();
        const syncMetrics = await enhancedVehicleDataService.getLastSyncMetrics();
        
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
          syncStatus: syncMetrics.syncStatus as 'success' | 'error' | 'syncing',
          errorMessage: syncMetrics.errorMessage
        };
        
        setMetrics(expandedMetrics);
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
        const vehicles = await enhancedVehicleDataService.getEnhancedVehicles();
        const serviceMetrics = enhancedVehicleDataService.getMetrics();
        const syncMetrics = await enhancedVehicleDataService.getLastSyncMetrics();
        
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
          syncStatus: syncMetrics.syncStatus as 'success' | 'error' | 'syncing',
          errorMessage: syncMetrics.errorMessage
        });
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
