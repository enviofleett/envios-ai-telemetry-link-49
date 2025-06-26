
import { useState, useEffect, useRef } from 'react';
import { enhancedVehicleDataService, type EnhancedVehicleData } from '@/services/EnhancedVehicleDataService';

export function useEnhancedVehicleData() {
  const [data, setData] = useState<EnhancedVehicleData>(enhancedVehicleDataService.getCurrentData());
  const subscriberIdRef = useRef(`enhanced_${Date.now()}_${Math.random()}`);

  useEffect(() => {
    // Subscribe to updates
    enhancedVehicleDataService.subscribe(subscriberIdRef.current, setData);

    // Initial data fetch
    enhancedVehicleDataService.getVehicleData().catch(console.error);

    // Cleanup
    return () => {
      enhancedVehicleDataService.unsubscribe(subscriberIdRef.current);
    };
  }, []);

  return data;
}
