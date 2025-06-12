
import { useState, useEffect } from 'react';
import { simplifiedVehicleService, type SimpleVehicle, type VehicleMetrics } from '@/services/simplifiedVehicleService';

export const useSimpleVehicleData = () => {
  const [vehicles, setVehicles] = useState<SimpleVehicle[]>([]);
  const [metrics, setMetrics] = useState<VehicleMetrics>({ total: 0, active: 0, online: 0, offline: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const result = await simplifiedVehicleService.getVehicles();
      setVehicles(result.vehicles);
      setMetrics(simplifiedVehicleService.getMetrics());
      // Fix: Don't set loading from result.loading, manage it locally
      setLoading(false);
      setError(result.error);
    } catch (err) {
      console.error('Error fetching vehicle data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch vehicle data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Set up periodic refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const forceRefresh = () => {
    setLoading(true);
    simplifiedVehicleService.forceRefresh();
    fetchData();
  };

  return {
    vehicles,
    metrics,
    loading,
    error,
    forceRefresh
  };
};
