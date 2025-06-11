
import { useState, useEffect } from 'react';
import { simplifiedVehicleService, type SimpleVehicle, type VehicleMetrics } from '@/services/simplifiedVehicleService';

export const useSimpleVehicleData = () => {
  const [vehicles, setVehicles] = useState<SimpleVehicle[]>([]);
  const [metrics, setMetrics] = useState<VehicleMetrics>({ total: 0, active: 0, online: 0, offline: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      console.log('🔄 useSimpleVehicleData: Starting data fetch...');
      const result = await simplifiedVehicleService.getVehicles();
      
      console.log('📦 useSimpleVehicleData: Received result:', {
        vehicleCount: result.vehicles.length,
        loading: result.loading,
        hasError: !!result.error
      });

      setVehicles(result.vehicles);
      setMetrics(simplifiedVehicleService.getMetrics());
      setError(result.error);
      
      // Always set loading to false after we get a response
      setLoading(false);
      
      console.log('✅ useSimpleVehicleData: State updated, loading set to false');
    } catch (err) {
      console.error('❌ useSimpleVehicleData: Error in fetchData:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch vehicle data');
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🚀 useSimpleVehicleData: Initial effect triggered');
    fetchData();
    
    // Set up periodic refresh every 30 seconds
    const interval = setInterval(() => {
      console.log('⏰ useSimpleVehicleData: Periodic refresh triggered');
      fetchData();
    }, 30000);
    
    return () => {
      console.log('🛑 useSimpleVehicleData: Cleaning up interval');
      clearInterval(interval);
    };
  }, []);

  const forceRefresh = () => {
    console.log('🔄 useSimpleVehicleData: Force refresh requested');
    setLoading(true);
    simplifiedVehicleService.forceRefresh();
    fetchData();
  };

  console.log('📊 useSimpleVehicleData: Current state:', {
    vehicleCount: vehicles.length,
    loading,
    hasError: !!error
  });

  return {
    vehicles,
    metrics,
    loading,
    error,
    forceRefresh
  };
};
