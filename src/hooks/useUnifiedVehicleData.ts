import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { enhancedVehicleDataService } from '@/services/enhancedVehicleDataService';
import type { VehicleData, VehicleDataMetrics } from '@/types/vehicle';

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

const useUnifiedVehicleData = (): UseUnifiedVehicleDataResult => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const ITEMS_PER_PAGE = 50;

  const {
    data: vehicles = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['unified-vehicle-data', currentPage],
    queryFn: async () => {
      const data = await enhancedVehicleDataService.getEnhancedVehicles();
      return data;
    },
    refetchInterval: 30000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Get sync metrics from the service
  const { 
    data: syncData, 
    isLoading: syncLoading, 
    error: syncError 
  } = useQuery({
    queryKey: ['vehicle-sync-metrics'],
    queryFn: async () => {
      return enhancedVehicleDataService.getLastSyncMetrics();
    },
    refetchInterval: 10000,
  });

  // Combine metrics
  const metrics: VehicleDataMetrics = useMemo(() => {
    const online = vehicles.filter(v => v.isOnline || v.status === 'online').length;
    const offline = vehicles.filter(v => !v.isOnline && v.status === 'offline').length;
    const idle = vehicles.filter(v => v.status === 'idle').length;
    const alerts = vehicles.filter(v => v.alerts && v.alerts.length > 0).length;

    const baseMetrics = {
      total: vehicles.length,
      online,
      offline,
      idle,
      alerts,
      totalVehicles: vehicles.length,
      onlineVehicles: online,
      offlineVehicles: offline,
      recentlyActiveVehicles: vehicles.filter(v => v.is_active).length,
    };

    if (syncData) {
      return {
        ...baseMetrics,
        lastSyncTime: syncData.lastSyncTime,
        positionsUpdated: syncData.positionsUpdated,
        errors: syncData.errors,
        syncStatus: syncData.syncStatus === 'pending' ? 'loading' : syncData.syncStatus, // Fix status mapping
        errorMessage: syncData.errorMessage,
      };
    }

    return {
      ...baseMetrics,
      lastSyncTime: new Date(),
      positionsUpdated: 0,
      errors: 0,
      syncStatus: isLoading || syncLoading ? 'loading' : 'success', // Use valid status values
      errorMessage: error?.message || syncError?.message,
    };
  }, [vehicles, syncData, isLoading, syncLoading, error, syncError]);

  const forceRefresh = async () => {
    setIsRefreshing(true);
    try {
      await enhancedVehicleDataService.forceSync();
      setCurrentPage(1); // Reset to first page after refresh
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadMore = () => {
    setCurrentPage(prevPage => prevPage + 1);
  };

  const hasMore = useMemo(() => {
    return vehicles.length < metrics.total;
  }, [vehicles.length, metrics.total]);

  const getVehiclesByStatus = () => {
    const online = vehicles.filter(v => v.isOnline);
    const offline = vehicles.filter(v => !v.isOnline);
    const alerts = vehicles.filter(v => v.alerts && v.alerts.length > 0);
    return { online, offline, alerts };
  };

  const getVehicleById = (deviceId: string) => {
    return vehicles.find(v => v.device_id === deviceId);
  };

  const getOnlineVehicles = () => {
    return vehicles.filter(v => v.isOnline);
  };

  const getOfflineVehicles = () => {
    return vehicles.filter(v => !v.isOnline);
  };

  const getMovingVehicles = () => {
    return vehicles.filter(v => v.isMoving);
  };

  const getIdleVehicles = () => {
    return vehicles.filter(v => v.status === 'idle');
  };

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
    getIdleVehicles,
  };
};

export default useUnifiedVehicleData;
