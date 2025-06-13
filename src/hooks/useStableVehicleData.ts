
import { useState, useEffect, useCallback } from 'react';
import type { VehicleData, VehicleDataMetrics } from '@/types/vehicle';

export const useStableVehicleData = () => {
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [allVehicles, setAllVehicles] = useState<VehicleData[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<VehicleData[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all'
  });
  const [metrics, setMetrics] = useState<VehicleDataMetrics>({
    total: 0,
    online: 0,
    offline: 0,
    alerts: 0,
    idle: 0,
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
  const [error, setError] = useState<string | null>(null);

  const mockVehicles: VehicleData[] = [
    {
      id: '1',
      device_id: 'DEV001',
      device_name: 'Vehicle Alpha',
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
      device_name: 'Vehicle Beta',
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

  const applyFilters = useCallback((vehicleList: VehicleData[]) => {
    let filtered = vehicleList;

    if (filters.search) {
      filtered = filtered.filter(vehicle => 
        vehicle.device_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        vehicle.device_id.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(vehicle => {
        if (!vehicle.last_position?.timestamp) return filters.status === 'offline';
        
        const lastUpdate = new Date(vehicle.last_position.timestamp);
        const minutesSince = (Date.now() - lastUpdate.getTime()) / (1000 * 60);
        
        switch (filters.status) {
          case 'online':
            return minutesSince <= 5;
          case 'offline':
            return minutesSince > 5;
          case 'moving':
            return minutesSince <= 5 && vehicle.last_position.speed > 0;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [filters]);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    setTimeout(() => {
      try {
        setAllVehicles(mockVehicles);
        const filtered = applyFilters(mockVehicles);
        setFilteredVehicles(filtered);
        setVehicles(filtered);
        
        const onlineCount = mockVehicles.filter(v => {
          if (!v.last_position?.timestamp) return false;
          const lastUpdate = new Date(v.last_position.timestamp);
          const minutesSince = (Date.now() - lastUpdate.getTime()) / (1000 * 60);
          return minutesSince <= 5;
        }).length;

        const idleCount = mockVehicles.filter(v => {
          if (!v.last_position?.timestamp) return false;
          const lastUpdate = new Date(v.last_position.timestamp);
          const minutesSince = (Date.now() - lastUpdate.getTime()) / (1000 * 60);
          return minutesSince <= 5 && v.last_position.speed === 0;
        }).length;

        setMetrics({
          total: mockVehicles.length,
          online: onlineCount,
          offline: mockVehicles.length - onlineCount,
          alerts: 0,
          idle: idleCount,
          totalVehicles: mockVehicles.length,
          onlineVehicles: onlineCount,
          offlineVehicles: mockVehicles.length - onlineCount,
          recentlyActiveVehicles: onlineCount,
          lastSyncTime: new Date(),
          positionsUpdated: mockVehicles.length,
          errors: 0,
          syncStatus: 'success'
        });
        
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsLoading(false);
      }
    }, 1000);
  }, [applyFilters]);

  const getVehicleById = useCallback((deviceId: string) => {
    return vehicles.find(v => v.device_id === deviceId);
  }, [vehicles]);

  const forceRefresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate refresh
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setAllVehicles(mockVehicles);
      const filtered = applyFilters(mockVehicles);
      setFilteredVehicles(filtered);
      setVehicles(filtered);
      
      const onlineCount = mockVehicles.filter(v => {
        if (!v.last_position?.timestamp) return false;
        const lastUpdate = new Date(v.last_position.timestamp);
        const minutesSince = (Date.now() - lastUpdate.getTime()) / (1000 * 60);
        return minutesSince <= 5;
      }).length;

      const idleCount = mockVehicles.filter(v => {
        if (!v.last_position?.timestamp) return false;
        const lastUpdate = new Date(v.last_position.timestamp);
        const minutesSince = (Date.now() - lastUpdate.getTime()) / (1000 * 60);
        return minutesSince <= 5 && v.last_position.speed === 0;
      }).length;

      setMetrics({
        total: mockVehicles.length,
        online: onlineCount,
        offline: mockVehicles.length - onlineCount,
        alerts: 0,
        idle: idleCount,
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
    } finally {
      setIsLoading(false);
    }
  }, [applyFilters]);

  const refetch = useCallback(async () => {
    await forceRefresh();
  }, [forceRefresh]);

  return {
    vehicles,
    allVehicles,
    filteredVehicles,
    metrics,
    isLoading,
    error,
    forceRefresh,
    refetch,
    getVehicleById,
    filters,
    setFilters
  };
};

export default useStableVehicleData;
