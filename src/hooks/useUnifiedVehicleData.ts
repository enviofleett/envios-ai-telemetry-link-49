
import { useState, useEffect } from 'react';
import { enhancedVehicleDataService, type EnhancedVehicleData } from '@/services/EnhancedVehicleDataService';

export const useUnifiedVehicleData = () => {
  const [data, setData] = useState<EnhancedVehicleData>({
    vehicles: [],
    isLoading: true,
    isRefreshing: false,
    error: null,
    lastUpdate: new Date(),
    refetch: async () => {},
    syncStatus: {
      isConnected: false,
      lastSync: new Date(),
      isSync: false
    },
    forceSync: async () => {},
    forceRefresh: async () => {},
    events: [],
    acknowledgeEvent: async () => {},
    metrics: {
      totalVehicles: 0,
      onlineVehicles: 0,
      movingVehicles: 0,
      idleVehicles: 0,
      offlineVehicles: 0,
      lastSyncTime: new Date(),
      averageSpeed: 0,
      totalDistance: 0,
      total: 0,
      online: 0,
      offline: 0,
      idle: 0,
      alerts: 0
    }
  });

  useEffect(() => {
    const subscriberId = `unified-vehicle-data-${Date.now()}`;
    
    // Subscribe to service updates
    enhancedVehicleDataService.subscribe(subscriberId, (enhancedData) => {
      setData(enhancedData);
    });

    // Initial load
    enhancedVehicleDataService.getVehicleData();

    // Cleanup
    return () => {
      enhancedVehicleDataService.unsubscribe(subscriberId);
    };
  }, []);

  return data;
};
