import { useState, useEffect } from 'react';
import { useGP51VehicleData, type EnhancedVehicle } from '@/hooks/useGP51VehicleData';
import { useGP51Auth } from '@/hooks/useGP51Auth';
import type { SyncMetrics } from '@/services/vehiclePosition/types';
import type { Vehicle, VehicleMetrics } from '@/services/unifiedVehicleData';

interface FilterOptions {
  search?: string;
  status?: 'all' | 'online' | 'offline' | 'alerts';
  user?: string;
}

export const useUnifiedVehicleData = (filters?: FilterOptions) => {
  const { isAuthenticated } = useGP51Auth();
  
  // Use GP51 data as primary source
  const {
    vehicles: gp51Vehicles,
    metrics: gp51Metrics,
    isLoading,
    isRefreshing,
    forceRefresh,
    getOnlineVehicles,
    getOfflineVehicles,
    getMovingVehicles,
    getIdleVehicles
  } = useGP51VehicleData({
    autoRefresh: isAuthenticated,
    refreshInterval: 30000
  });

  const [vehicles, setVehicles] = useState<EnhancedVehicle[]>([]);

  // Filter vehicles based on provided filters
  useEffect(() => {
    let filteredVehicles = [...gp51Vehicles];

    if (filters) {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredVehicles = filteredVehicles.filter(vehicle => 
          (vehicle.deviceName?.toLowerCase().includes(searchTerm) || false) ||
          (vehicle.vehicle_name?.toLowerCase().includes(searchTerm) || false) ||
          vehicle.deviceId.toLowerCase().includes(searchTerm) ||
          (vehicle.license_plate?.toLowerCase().includes(searchTerm) || false)
        );
      }

      // Status filter
      if (filters.status && filters.status !== 'all') {
        switch (filters.status) {
          case 'online':
            filteredVehicles = filteredVehicles.filter(v => v.isOnline);
            break;
          case 'offline':
            filteredVehicles = filteredVehicles.filter(v => !v.isOnline);
            break;
          case 'alerts':
            // Filter vehicles with alerts (non-normal status)
            filteredVehicles = filteredVehicles.filter(v => 
              v.statusText && v.statusText.toLowerCase() !== 'normal' && v.statusText.toLowerCase() !== 'ok'
            );
            break;
        }
      }

      // User filter (if needed)
      if (filters.user && filters.user !== 'all') {
        filteredVehicles = filteredVehicles.filter(v => v.envio_user_id === filters.user);
      }
    }

    setVehicles(filteredVehicles);
  }, [gp51Vehicles, filters]);

  // Transform GP51 metrics to unified format
  const metrics = {
    total: gp51Metrics.total,
    online: gp51Metrics.online,
    offline: gp51Metrics.offline,
    alerts: vehicles.filter(v => 
      v.statusText && v.statusText.toLowerCase() !== 'normal' && v.statusText.toLowerCase() !== 'ok'
    ).length,
    lastUpdateTime: gp51Metrics.lastUpdateTime
  };

  const syncMetrics = {
    totalVehicles: gp51Metrics.total,
    positionsUpdated: gp51Metrics.online,
    errors: gp51Metrics.syncStatus === 'error' ? 1 : 0,
    lastSyncTime: gp51Metrics.lastUpdateTime
  };

  const getVehiclesByStatus = () => {
    return {
      online: getOnlineVehicles(),
      offline: getOfflineVehicles(),
      alerts: vehicles.filter(v => 
        v.statusText && v.statusText.toLowerCase() !== 'normal' && v.statusText.toLowerCase() !== 'ok'
      )
    };
  };

  const getVehicleById = (deviceId: string) => {
    return vehicles.find(v => v.deviceId === deviceId);
  };

  return {
    vehicles,
    metrics,
    syncMetrics,
    isLoading,
    isRefreshing,
    forceRefresh,
    getVehiclesByStatus,
    getVehicleById,
    getOnlineVehicles: () => vehicles.filter(v => v.isOnline),
    getOfflineVehicles: () => vehicles.filter(v => !v.isOnline),
    getMovingVehicles: () => vehicles.filter(v => v.isMoving),
    getIdleVehicles: () => vehicles.filter(v => v.isOnline && !v.isMoving)
  };
};
