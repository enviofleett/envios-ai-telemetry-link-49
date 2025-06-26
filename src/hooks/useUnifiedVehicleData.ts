
import { useState, useEffect } from 'react';
import { enhancedVehicleDataService, type EnhancedVehicleData } from '@/services/EnhancedVehicleDataService';

export const useUnifiedVehicleData = () => {
  const [data, setData] = useState<EnhancedVehicleData>({
    vehicles: [],
    isLoading: true,
    error: null,
    lastUpdate: new Date(),
    refetch: async () => {},
    syncStatus: {
      isConnected: false,
      lastSync: new Date(),
      isSync: false
    },
    forceSync: async () => {},
    events: [],
    acknowledgeEvent: async () => {}
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
