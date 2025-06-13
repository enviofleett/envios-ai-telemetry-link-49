
import { useState, useEffect, useCallback } from 'react';
import { getEnhancedVehicles, getVehicleDataMetrics } from '@/services/enhancedVehicleDataService';
import type { VehicleData, VehicleDataMetrics } from '@/types/vehicle';

interface FilterOptions {
  search?: string;
  status?: 'all' | 'online' | 'offline' | 'alerts';
  user?: string;
}

interface UseUnifiedVehicleDataResult {
  vehicles: VehicleData[];
  metrics: VehicleDataMetrics;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  forceRefresh: () => Promise<void>;
  loadMore: () => void;
  hasMore: boolean;
  currentPage: number;
  getVehiclesByStatus: () => {
    online: VehicleData[];
    offline: VehicleData[];
    alerts: VehicleData[];
  };
  getVehicleById: (deviceId: string) => VehicleData | undefined;
  getOnlineVehicles: () => VehicleData[];
  getOfflineVehicles: () => VehicleData[];
  getMovingVehicles: () => VehicleData[];
  getIdleVehicles: () => VehicleData[];
}

export const useUnifiedVehicleData = (filters?: FilterOptions): UseUnifiedVehicleDataResult => {
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
    syncStatus: 'pending'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchData = useCallback(async (pageToLoad: number, shouldAppend = false) => {
    if (!hasMore && pageToLoad > 0) return;

    if (pageToLoad === 0) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      const limit = 100;
      const { data, error: serviceError, hasMore: moreAvailable } = await getEnhancedVehicles({
        page: pageToLoad,
        limit
      });

      if (serviceError) {
        throw new Error(serviceError);
      }

      // Apply filters to the fetched data
      let filteredData = data;
      if (filters) {
        filteredData = data.filter(vehicle => {
          // Search filter
          if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            const matchesSearch = 
              vehicle.deviceName.toLowerCase().includes(searchTerm) ||
              vehicle.deviceId.toLowerCase().includes(searchTerm) ||
              (vehicle.vehicleName?.toLowerCase().includes(searchTerm) || false);
            if (!matchesSearch) return false;
          }

          // Status filter
          if (filters.status && filters.status !== 'all') {
            switch (filters.status) {
              case 'online':
                if (!vehicle.isOnline) return false;
                break;
              case 'offline':
                if (vehicle.isOnline) return false;
                break;
              case 'alerts':
                if (vehicle.alerts.length === 0) return false;
                break;
            }
          }

          // User filter
          if (filters.user && filters.user !== 'all') {
            if (vehicle.envio_user_id !== filters.user) return false;
          }

          return true;
        });
      }

      if (shouldAppend) {
        setVehicles(prev => [...prev, ...filteredData]);
      } else {
        setVehicles(filteredData);
      }

      // Create expanded metrics that include sync data
      const baseMetrics = getVehicleDataMetrics(filteredData);
      const expandedMetrics: VehicleDataMetrics = {
        // Dashboard-compatible properties
        total: baseMetrics.total,
        online: baseMetrics.online,
        offline: baseMetrics.offline,
        alerts: baseMetrics.alerts,
        // Legacy properties
        totalVehicles: baseMetrics.totalVehicles,
        onlineVehicles: baseMetrics.onlineVehicles,
        offlineVehicles: baseMetrics.offlineVehicles,
        recentlyActiveVehicles: baseMetrics.recentlyActiveVehicles,
        // Sync properties
        lastSyncTime: new Date(),
        positionsUpdated: filteredData.length,
        errors: 0,
        syncStatus: 'success'
      };
      
      setMetrics(expandedMetrics);
      setHasMore(moreAvailable);
      setCurrentPage(pageToLoad);

    } catch (err: any) {
      console.error("Error in useUnifiedVehicleData:", err);
      setError(err.message || "Failed to fetch vehicle data.");
      if (!shouldAppend) {
        setVehicles([]);
        setMetrics({
          total: 0,
          online: 0,
          offline: 0,
          alerts: 0,
          totalVehicles: 0,
          onlineVehicles: 0,
          offlineVehicles: 0,
          recentlyActiveVehicles: 0,
          lastSyncTime: new Date(),
          positionsUpdated: 0,
          errors: 1,
          syncStatus: 'error'
        });
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [hasMore, filters]);

  useEffect(() => {
    fetchData(0, false); // Load initial page on mount

    // Set up periodic refresh of first page
    const interval = setInterval(() => {
      fetchData(0, false);
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [fetchData]);

  const forceRefresh = useCallback(async () => {
    setCurrentPage(0);
    setHasMore(true);
    await fetchData(0, false);
  }, [fetchData]);

  const loadMore = useCallback(() => {
    if (!isLoading && !isRefreshing && hasMore) {
      fetchData(currentPage + 1, true);
    }
  }, [isLoading, isRefreshing, hasMore, currentPage, fetchData]);

  const getVehiclesByStatus = useCallback(() => {
    return {
      online: vehicles.filter(v => v.isOnline),
      offline: vehicles.filter(v => !v.isOnline),
      alerts: vehicles.filter(v => v.alerts.length > 0)
    };
  }, [vehicles]);

  const getVehicleById = useCallback((deviceId: string) => {
    return vehicles.find(v => v.deviceId === deviceId);
  }, [vehicles]);

  const getOnlineVehicles = useCallback(() => {
    return vehicles.filter(v => v.isOnline);
  }, [vehicles]);

  const getOfflineVehicles = useCallback(() => {
    return vehicles.filter(v => !v.isOnline);
  }, [vehicles]);

  const getMovingVehicles = useCallback(() => {
    return vehicles.filter(v => v.isMoving);
  }, [vehicles]);

  const getIdleVehicles = useCallback(() => {
    return vehicles.filter(v => v.isOnline && !v.isMoving);
  }, [vehicles]);

  return {
    vehicles,
    metrics,
    isLoading,
    isRefreshing,
    error,
    forceRefresh,
    loadMore,
    hasMore,
    currentPage,
    getVehiclesByStatus,
    getVehicleById,
    getOnlineVehicles,
    getOfflineVehicles,
    getMovingVehicles,
    getIdleVehicles
  };
};
