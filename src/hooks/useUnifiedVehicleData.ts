
import { useState, useEffect } from 'react';
import { enhancedVehicleDataService, type EnhancedVehicleData } from '@/services/EnhancedVehicleDataService';

export const useUnifiedVehicleData = () => {
  const [data, setData] = useState<EnhancedVehicleData>({
    vehicles: [],
    allVehicles: [],
    filteredVehicles: [],
    userOptions: [],
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
      recentlyActiveVehicles: 0,
      lastSyncTime: new Date(),
      averageSpeed: 0,
      totalDistance: 0,
      syncStatus: 'pending',
      errors: [],
      total: 0,
      online: 0,
      offline: 0,
      idle: 0,
      alerts: 0
    },
    isConnected: false
  });

  useEffect(() => {
    const subscriberId = `unified-vehicle-data-${Date.now()}`;
    
    const unsubscribe = enhancedVehicleDataService.subscribe(subscriberId, (enhancedData) => {
      setData(enhancedData);
    });

    enhancedVehicleDataService.getVehicleData();

    return unsubscribe;
  }, []);

  return data;
};
