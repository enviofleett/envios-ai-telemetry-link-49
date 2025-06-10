
import { useState, useEffect } from 'react';
import { enhancedVehicleDataService, VehicleData, VehicleDataMetrics } from '@/services/enhancedVehicleDataService';
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
      
      // Set loading to false once we have data or the service is ready
      if (newVehicles.length > 0 || enhancedVehicleDataService.isReady()) {
        setIsLoading(false);
      }

      // Only show error toast for critical errors (database failures)
      if (newMetrics.syncStatus === 'error' && newMetrics.errorMessage?.includes('Database')) {
        toast({
          title: "Database Error",
          description: newMetrics.errorMessage,
          variant: "destructive"
        });
      }
    });

    // Initial data load - check if service is ready and has data
    const initialVehicles = enhancedVehicleDataService.getVehicles();
    const initialMetrics = enhancedVehicleDataService.getMetrics();
    
    setVehicles(initialVehicles);
    setMetrics(initialMetrics);
    
    // Set loading to false if we have data or service is ready
    if (initialVehicles.length > 0 || enhancedVehicleDataService.isReady()) {
      setIsLoading(false);
    }

    // Fallback: ensure loading stops after reasonable time
    const fallbackTimer = setTimeout(() => {
      if (isLoading) {
        console.log('Setting loading to false after timeout');
        setIsLoading(false);
      }
    }, 3000); // 3 second fallback

    return () => {
      unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, [toast]);

  const forceSync = async () => {
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
