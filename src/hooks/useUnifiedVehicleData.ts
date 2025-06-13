
import { useState, useEffect, useCallback } from 'react';
import type { VehicleData, VehicleDataMetrics } from '@/types/vehicle';

export const useUnifiedVehicleData = () => {
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [metrics, setMetrics] = useState<VehicleDataMetrics>({
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
    errors: 0,
    syncStatus: 'success'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mockVehicles: VehicleData[] = [
    {
      id: '1',
      device_id: 'DEV001',
      device_name: 'Fleet Vehicle 001',
      is_active: true,
      last_position: {
        lat: 40.7128,
        lng: -74.0060,
        speed: 45,
        course: 180,
        timestamp: new Date().toISOString()
      },
      alerts: []
    },
    {
      id: '2',
      device_id: 'DEV002',
      device_name: 'Fleet Vehicle 002', 
      is_active: true,
      last_position: {
        lat: 34.0522,
        lng: -118.2437,
        speed: 0,
        course: 90,
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString()
      },
      alerts: []
    }
  ];

  const loadVehicleData = useCallback(async () => {
    try {
      setError(null);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setVehicles(mockVehicles);
      
      const onlineCount = mockVehicles.filter(v => {
        if (!v.last_position?.timestamp) return false;
        const lastUpdate = new Date(v.last_position.timestamp);
        const minutesSince = (Date.now() - lastUpdate.getTime()) / (1000 * 60);
        return minutesSince <= 5;
      }).length;

      setMetrics({
        total: mockVehicles.length,
        online: onlineCount,
        offline: mockVehicles.length - onlineCount,
        alerts: 0,
        totalVehicles: mockVehicles.length,
        onlineVehicles: onlineCount,
        offlineVehicles: mockVehicles.length - onlineCount,
        recentlyActiveVehicles: onlineCount,
        lastSyncTime: new Date(),
        positionsUpdated: mockVehicles.length,
        errors: 0,
        syncStatus: 'success'
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    loadVehicleData().finally(() => setIsLoading(false));
  }, [loadVehicleData]);

  const forceRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadVehicleData();
    setIsRefreshing(false);
  }, [loadVehicleData]);

  const getVehiclesByStatus = useCallback(() => {
    const online = vehicles.filter(v => {
      if (!v.last_position?.timestamp) return false;
      const lastUpdate = new Date(v.last_position.timestamp);
      const minutesSince = (Date.now() - lastUpdate.getTime()) / (1000 * 60);
      return minutesSince <= 5;
    });
    
    const offline = vehicles.filter(v => !online.includes(v));
    
    return {
      online,
      offline,
      alerts: vehicles.filter(v => v.alerts && v.alerts.length > 0)
    };
  }, [vehicles]);

  const getVehicleById = useCallback((deviceId: string) => {
    return vehicles.find(v => v.device_id === deviceId);
  }, [vehicles]);

  return {
    vehicles,
    metrics,
    isLoading,
    isRefreshing,
    error,
    forceRefresh,
    loadMore: () => {},
    hasMore: false,
    currentPage: 1,
    getVehiclesByStatus,
    getVehicleById,
    getOnlineVehicles: () => getVehiclesByStatus().online,
    getOfflineVehicles: () => getVehiclesByStatus().offline,
    getMovingVehicles: () => vehicles.filter(v => v.last_position?.speed && v.last_position.speed > 0),
    getIdleVehicles: () => vehicles.filter(v => v.last_position?.speed === 0),
  };
};

export default useUnifiedVehicleData;
