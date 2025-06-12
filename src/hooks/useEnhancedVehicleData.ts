
import { useState, useEffect } from 'react';
import { enhancedVehicleDataService } from '@/services/enhancedVehicleDataService';
import type { VehicleData, VehicleDataMetrics } from '@/types/vehicle';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  useEffect(() => {
    // Subscribe to vehicle data updates
    const unsubscribe = enhancedVehicleDataService.subscribe(() => {
      const newVehicles = enhancedVehicleDataService.getVehicles();
      const newMetrics = enhancedVehicleDataService.getMetrics();
      
      setVehicles(newVehicles);
      setMetrics(newMetrics);
      setIsLoading(false);

      // Show error toast if sync failed
      if (newMetrics.syncStatus === 'error' && newMetrics.errorMessage) {
        toast({
          title: "Vehicle Data Sync Failed",
          description: newMetrics.errorMessage,
          variant: "destructive"
        });
      }
    });

    // Initial data load
    setVehicles(enhancedVehicleDataService.getVehicles());
    setMetrics(enhancedVehicleDataService.getMetrics());
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
