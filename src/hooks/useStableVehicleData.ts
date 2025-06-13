
import { useState, useEffect, useCallback } from 'react';
import type { VehicleData, VehicleDataMetrics } from '@/types/vehicle';

export const useStableVehicleData = () => {
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

  useEffect(() => {
    setIsLoading(true);
    
    setTimeout(() => {
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
      
      setIsLoading(false);
    }, 1000);
  }, []);

  const getVehicleById = useCallback((deviceId: string) => {
    return vehicles.find(v => v.device_id === deviceId);
  }, [vehicles]);

  return {
    vehicles,
    metrics,
    isLoading,
    getVehicleById
  };
};

export default useStableVehicleData;
