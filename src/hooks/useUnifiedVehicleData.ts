
import { useState, useEffect } from 'react';
import { unifiedVehicleDataService } from '@/services/unifiedVehicleData';
import type { SyncMetrics } from '@/services/vehiclePosition/types';
import type { Vehicle, VehicleMetrics } from '@/services/unifiedVehicleData';

interface FilterOptions {
  search?: string;
  status?: 'all' | 'online' | 'offline' | 'alerts';
  user?: string;
}

export const useUnifiedVehicleData = (filters?: FilterOptions) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [metrics, setMetrics] = useState<VehicleMetrics>({
    total: 0,
    online: 0,
    offline: 0,
    alerts: 0,
    lastUpdateTime: new Date()
  });
  const [syncMetrics, setSyncMetrics] = useState<SyncMetrics>({
    totalVehicles: 0,
    positionsUpdated: 0,
    errors: 0,
    lastSyncTime: new Date()
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter vehicles based on provided filters
  const filterVehicles = (allVehicles: Vehicle[]): Vehicle[] => {
    if (!filters) return allVehicles;

    return allVehicles.filter(vehicle => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesSearch = 
          vehicle.devicename.toLowerCase().includes(searchTerm) ||
          vehicle.deviceid.toLowerCase().includes(searchTerm);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status && filters.status !== 'all') {
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        const isOnline = vehicle.lastPosition?.updatetime && 
          new Date(vehicle.lastPosition.updatetime) > thirtyMinutesAgo;
        const hasAlert = vehicle.status?.toLowerCase().includes('alert') || 
          vehicle.status?.toLowerCase().includes('alarm');

        switch (filters.status) {
          case 'online':
            if (!isOnline) return false;
            break;
          case 'offline':
            if (isOnline) return false;
            break;
          case 'alerts':
            if (!hasAlert) return false;
            break;
        }
      }

      // User filter (if needed)
      if (filters.user && filters.user !== 'all') {
        if (vehicle.envio_user_id !== filters.user) return false;
      }

      return true;
    });
  };

  // Update data from service
  const updateData = () => {
    const allVehicles = unifiedVehicleDataService.getAllVehicles();
    const filteredVehicles = filterVehicles(allVehicles);
    
    setVehicles(filteredVehicles);
    setMetrics(unifiedVehicleDataService.getVehicleMetrics());
    setSyncMetrics(unifiedVehicleDataService.getSyncMetrics());
    setIsLoading(false);
  };

  // Subscribe to service updates
  useEffect(() => {
    // Initial load
    if (unifiedVehicleDataService.isReady()) {
      updateData();
    } else {
      // Wait for service to initialize
      const checkReady = setInterval(() => {
        if (unifiedVehicleDataService.isReady()) {
          updateData();
          clearInterval(checkReady);
        }
      }, 100);

      return () => clearInterval(checkReady);
    }

    // Subscribe to updates
    const unsubscribe = unifiedVehicleDataService.subscribe(updateData);
    return unsubscribe;
  }, [filters?.search, filters?.status, filters?.user]);

  const forceRefresh = async () => {
    setIsRefreshing(true);
    try {
      await unifiedVehicleDataService.forceSync();
    } catch (error) {
      console.error('Force refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getVehiclesByStatus = () => {
    const allVehicles = unifiedVehicleDataService.getAllVehicles();
    return {
      online: unifiedVehicleDataService.getOnlineVehicles(),
      offline: unifiedVehicleDataService.getOfflineVehicles(),
      alerts: unifiedVehicleDataService.getVehiclesWithAlerts()
    };
  };

  return {
    vehicles,
    metrics,
    syncMetrics,
    isLoading,
    isRefreshing,
    forceRefresh,
    getVehiclesByStatus,
    getVehicleById: unifiedVehicleDataService.getVehicleById.bind(unifiedVehicleDataService)
  };
};
