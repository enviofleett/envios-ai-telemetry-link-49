
import { useState, useEffect } from 'react';
import { enhancedVehicleDataService } from '@/services/enhancedVehicleDataService';
import type { VehicleData, VehicleDataMetrics } from '@/types/vehicle';
import { useToast } from '@/hooks/use-toast';

export const useEnhancedVehicleData = () => {
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [metrics, setMetrics] = useState<VehicleDataMetrics>({
    // Dashboard-compatible properties
    total: 0,
    online: 0,
    offline: 0,
    alerts: 0,
    // Legacy properties
    totalVehicles: 0,
    onlineVehicles: 0,
    offlineVehicles: 0,
    recentlyActiveVehicles: 0,
    // Sync properties
    lastSyncTime: new Date(),
    positionsUpdated: 0,
    errors: 0,
    syncStatus: 'success'
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Subscribe to vehicle data updates
    const unsubscribe = enhancedVehicleDataService.subscribe(() => {
      const newVehicles = enhancedVehicleDataService.getVehicles();
      const serviceMetrics = enhancedVehicleDataService.getMetrics();
      
      setVehicles(newVehicles);
      
      // Convert service metrics to the full VehicleDataMetrics interface
      const expandedMetrics: VehicleDataMetrics = {
        // Dashboard-compatible properties
        total: serviceMetrics.total,
        online: serviceMetrics.online,
        offline: serviceMetrics.offline,
        alerts: serviceMetrics.alerts,
        // Legacy properties
        totalVehicles: serviceMetrics.totalVehicles,
        onlineVehicles: serviceMetrics.onlineVehicles,
        offlineVehicles: serviceMetrics.offlineVehicles,
        recentlyActiveVehicles: serviceMetrics.recentlyActiveVehicles,
        // Sync properties
        lastSyncTime: serviceMetrics.lastSyncTime,
        positionsUpdated: newVehicles.length,
        errors: serviceMetrics.syncStatus === 'error' ? 1 : 0,
        syncStatus: serviceMetrics.syncStatus,
        errorMessage: serviceMetrics.errorMessage
      };
      
      setMetrics(expandedMetrics);
      setIsLoading(false);

      // Show error toast if sync failed
      if (serviceMetrics.syncStatus === 'error' && serviceMetrics.errorMessage) {
        toast({
          title: "Vehicle Data Sync Failed",
          description: serviceMetrics.errorMessage,
          variant: "destructive"
        });
      }
    });

    // Initial data load
    setVehicles(enhancedVehicleDataService.getVehicles());
    const initialMetrics = enhancedVehicleDataService.getMetrics();
    setMetrics({
      total: initialMetrics.total,
      online: initialMetrics.online,
      offline: initialMetrics.offline,
      alerts: initialMetrics.alerts,
      totalVehicles: initialMetrics.totalVehicles,
      onlineVehicles: initialMetrics.onlineVehicles,
      offlineVehicles: initialMetrics.offlineVehicles,
      recentlyActiveVehicles: initialMetrics.recentlyActiveVehicles,
      lastSyncTime: initialMetrics.lastSyncTime,
      positionsUpdated: 0,
      errors: 0,
      syncStatus: initialMetrics.syncStatus
    });
    setIsLoading(false);

    return unsubscribe;
  }, [toast]);

  const forceSync = async () => {
    setIsLoading(true);
    try {
      await enhancedVehicleDataService.forceSync();
      toast({
        title: "Data Sync Completed",
        description: "Vehicle data has been refreshed from GP51"
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getVehicleById = (deviceId: string) => {
    return enhancedVehicleDataService.getVehicleById(deviceId);
  };

  const getOnlineVehicles = () => {
    return vehicles.filter(v => v.status === 'online');
  };

  const getOfflineVehicles = () => {
    return vehicles.filter(v => v.status === 'offline');
  };

  const getRecentlyActiveVehicles = () => {
    const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
    return vehicles.filter(v => v.lastUpdate.getTime() > thirtyMinutesAgo);
  };

  return {
    vehicles,
    metrics,
    isLoading,
    forceSync,
    getVehicleById,
    getOnlineVehicles,
    getOfflineVehicles,
    getRecentlyActiveVehicles
  };
};
