
import { useState, useEffect, useMemo, useRef } from 'react';
import { unifiedVehicleDataService } from '@/services/unifiedVehicleData';
import type { VehicleData, VehicleMetrics } from '@/types/vehicle';

interface FilterOptions {
  search?: string;
  status?: 'all' | 'online' | 'offline' | 'alerts';
  user?: string;
}

// Vehicle comparison for stable references
const vehiclesEqual = (a: VehicleData[], b: VehicleData[]): boolean => {
  if (a.length !== b.length) return false;
  
  return a.every((vehicleA, index) => {
    const vehicleB = b[index];
    if (!vehicleB) return false;
    
    return (
      vehicleA.deviceId === vehicleB.deviceId &&
      vehicleA.deviceName === vehicleB.deviceName &&
      vehicleA.lastPosition?.lat === vehicleB.lastPosition?.lat &&
      vehicleA.lastPosition?.lon === vehicleB.lastPosition?.lon &&
      vehicleA.lastPosition?.timestamp?.getTime() === vehicleB.lastPosition?.timestamp?.getTime()
    );
  });
};

export const useStableVehicleData = (filters?: FilterOptions) => {
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [metrics, setMetrics] = useState<VehicleMetrics>({
    total: 0,
    online: 0,
    offline: 0,
    alerts: 0,
    lastUpdateTime: new Date()
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const previousVehicles = useRef<VehicleData[]>([]);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  // Memoized filter function
  const filterVehicles = useMemo(() => {
    return (allVehicles: VehicleData[]): VehicleData[] => {
      if (!filters) return allVehicles;

      return allVehicles.filter(vehicle => {
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          const matchesSearch = 
            vehicle.deviceName.toLowerCase().includes(searchTerm) ||
            vehicle.deviceId.toLowerCase().includes(searchTerm);
          if (!matchesSearch) return false;
        }

        if (filters.status && filters.status !== 'all') {
          const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
          const isOnline = vehicle.lastPosition?.timestamp && 
            vehicle.lastPosition.timestamp > thirtyMinutesAgo;
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

        if (filters.user && filters.user !== 'all') {
          if (vehicle.envio_user_id !== filters.user) return false;
        }

        return true;
      });
    };
  }, [filters?.search, filters?.status, filters?.user]);

  // Stable vehicle update with debouncing
  const updateVehicleData = useMemo(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      updateTimeoutRef.current = setTimeout(() => {
        const allVehicles = unifiedVehicleDataService.getAllVehicles();
        const filteredVehicles = filterVehicles(allVehicles);
        
        // Only update if vehicles actually changed
        if (!vehiclesEqual(filteredVehicles, previousVehicles.current)) {
          setVehicles(filteredVehicles);
          previousVehicles.current = filteredVehicles;
        }
        
        setMetrics(unifiedVehicleDataService.getVehicleMetrics());
        setIsLoading(false);
      }, 100); // 100ms debounce
    };
  }, [filterVehicles]);

  // Memoized vehicles with positions only
  const vehiclesWithPosition = useMemo(() => {
    return vehicles.filter(v => v.lastPosition?.lat && v.lastPosition?.lon);
  }, [vehicles]);

  useEffect(() => {
    if (unifiedVehicleDataService.isReady()) {
      updateVehicleData();
    } else {
      const checkReady = setInterval(() => {
        if (unifiedVehicleDataService.isReady()) {
          updateVehicleData();
          clearInterval(checkReady);
        }
      }, 100);

      return () => clearInterval(checkReady);
    }

    const unsubscribe = unifiedVehicleDataService.subscribe(updateVehicleData);
    
    return () => {
      unsubscribe();
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [updateVehicleData]);

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

  return {
    vehicles: vehiclesWithPosition,
    allVehicles: vehicles,
    metrics,
    isLoading,
    isRefreshing,
    forceRefresh,
    getVehicleById: unifiedVehicleDataService.getVehicleById.bind(unifiedVehicleDataService)
  };
};
