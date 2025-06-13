
import { useState, useEffect } from 'react';
import type { VehicleData, VehicleDataMetrics } from '@/types/vehicle';

export const useStableEnhancedVehicleData = () => {
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

  useEffect(() => {
    const mockVehicles: VehicleData[] = [
      {
        id: '1',
        device_id: 'GP51_001',
        device_name: 'Vehicle Alpha Enhanced',
        is_active: true,
        last_position: {
          lat: 40.7128,
          lng: -74.0060,
          speed: 45,
          course: 180,
          timestamp: new Date().toISOString()
        },
        alerts: []
      }
    ];

    setTimeout(() => {
      setVehicles(mockVehicles);
      setMetrics({
        total: mockVehicles.length,
        online: 1,
        offline: 0,
        alerts: 0,
        totalVehicles: mockVehicles.length,
        onlineVehicles: 1,
        offlineVehicles: 0,
        recentlyActiveVehicles: 1,
        lastSyncTime: new Date(),
        positionsUpdated: mockVehicles.length,
        errors: 0,
        syncStatus: 'success'
      });
      setIsLoading(false);
    }, 800);
  }, []);

  return {
    vehicles,
    metrics,
    isLoading
  };
};

export default useStableEnhancedVehicleData;
