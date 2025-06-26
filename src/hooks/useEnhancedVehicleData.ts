
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
        const syncMetrics = await enhancedVehicleDataService.getLastSyncMetrics();
        
        // Convert service metrics to the full VehicleDataMetrics interface
        const expandedMetrics: VehicleDataMetrics = {
          total: serviceMetrics?.total || 0,
          online: serviceMetrics?.online || 0,
          offline: serviceMetrics?.offline || 0,
          idle: serviceMetrics?.idle || 0,
          alerts: serviceMetrics?.alerts || 0,
          totalVehicles: serviceMetrics?.totalVehicles || 0,
          onlineVehicles: serviceMetrics?.onlineVehicles || 0,
          offlineVehicles: serviceMetrics?.offlineVehicles || 0,
          recentlyActiveVehicles: serviceMetrics?.recentlyActiveVehicles || 0,
          lastSyncTime: serviceMetrics?.lastSyncTime || new Date(),
          positionsUpdated: syncMetrics?.positionsUpdated || 0,
          errors: syncMetrics?.errors || 0,
          syncStatus: syncMetrics?.syncStatus as 'success' | 'error' | 'syncing' || 'success',
          errorMessage: syncMetrics?.errorMessage
        };
        
        setMetrics(expandedMetrics);
        setIsLoading(false);

        // Show error toast if sync failed
        if (syncMetrics?.syncStatus === 'error' && syncMetrics?.errorMessage) {
          toast({
            title: "Vehicle Data Sync Failed",
            description: syncMetrics.errorMessage,
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
    const subscriberId = `enhanced-vehicle-data-${Date.now()}`;
    enhancedVehicleDataService.subscribe(subscriberId, (enhancedData) => {
      setVehicles(enhancedData.vehicles);
      setIsLoading(enhancedData.isLoading);
      
      // Update metrics based on enhanced data
      const newMetrics: VehicleDataMetrics = {
        total: enhancedData.vehicles.length,
        online: enhancedData.vehicles.filter(v => v.isOnline).length,
        offline: enhancedData.vehicles.filter(v => !v.isOnline).length,
        idle: enhancedData.vehicles.filter(v => v.isOnline && !v.isMoving).length,
        alerts: enhancedData.events.filter(e => !e.acknowledged).length,
        totalVehicles: enhancedData.vehicles.length,
        onlineVehicles: enhancedData.vehicles.filter(v => v.isOnline).length,
        offlineVehicles: enhancedData.vehicles.filter(v => !v.isOnline).length,
        recentlyActiveVehicles: enhancedData.vehicles.filter(v => 
          Date.now() - enhancedData.lastUpdate.getTime() < 30 * 60 * 1000
        ).length,
        lastSyncTime: enhancedData.lastUpdate,
        positionsUpdated: enhancedData.vehicles.length,
        errors: enhancedData.error ? 1 : 0,
        syncStatus: enhancedData.syncStatus.isSync ? 'syncing' : 
                   enhancedData.error ? 'error' : 'success',
        errorMessage: enhancedData.error?.message
      };
      
      setMetrics(newMetrics);
    });

    unsubscribeRef.current = () => enhancedVehicleDataService.unsubscribe(subscriberId);

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
    return vehicles.filter(v => v.isOnline);
  };

  const getOfflineVehicles = () => {
    return vehicles.filter(v => !v.isOnline);
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
