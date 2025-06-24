
import { useState, useEffect, useRef } from 'react';
import { enhancedVehicleDataService } from '@/services/enhancedVehicleDataService';
import type { VehicleData, VehicleDataMetrics } from '@/types/vehicle';
import { useToast } from '@/hooks/use-toast';

export const useEnhancedVehicleData = () => {
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
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
  const { toast } = useToast();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load initial data
        const vehicleData = await enhancedVehicleDataService.getVehicleData();
        setVehicles(vehicleData);

        // Get metrics
        const serviceMetrics = enhancedVehicleDataService.getMetrics();
        
        // Convert service metrics to the full VehicleDataMetrics interface
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
          positionsUpdated: vehicleData.length,
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
      } catch (error) {
        console.error('Error loading vehicle data:', error);
        setIsLoading(false);
      }
    };

    // Clean up any existing subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    // Subscribe to vehicle data updates
    const unsubscribe = enhancedVehicleDataService.subscribe(async (newVehicles) => {
      setVehicles(newVehicles);
      
      const serviceMetrics = enhancedVehicleDataService.getMetrics();
      
      // Convert service metrics to the full VehicleDataMetrics interface
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

    unsubscribeRef.current = unsubscribe;

    // Load initial data
    loadData();

    // Cleanup function
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [toast]);

  const forceSync = async () => {
    setIsLoading(true);
    try {
      await enhancedVehicleDataService.forceSync();
      toast({
        title: "Data Sync Completed",
        description: "Vehicle data has been refreshed"
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
