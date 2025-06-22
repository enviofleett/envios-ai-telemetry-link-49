
import { useState, useEffect } from 'react';

// Define comprehensive interfaces for the hook return type
export interface VehicleMetrics {
  total: number;
  online: number;
  offline: number;
  idle: number;
  alerts: number;
  totalVehicles: number;
  onlineVehicles: number;
  offlineVehicles: number;
  recentlyActiveVehicles: number;
  lastSyncTime: Date;
  positionsUpdated: number;
  errors: number;
  syncStatus: 'success' | 'error' | 'syncing' | 'idle';
}

export interface UseUnifiedVehicleDataReturn {
  isLoading: boolean;
  vehicles: any[];
  metrics: VehicleMetrics;
  isRefreshing: boolean;
  error: Error | null;
  forceRefresh: () => Promise<void>;
}

export const useUnifiedVehicleData = (): UseUnifiedVehicleDataReturn => {
  const [isLoading, setIsLoading] = useState(true);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize default metrics
  const [metrics, setMetrics] = useState<VehicleMetrics>({
    total: 0,
    online: 0,
    offline: 0,
    idle: 0,
    alerts: 0,
    totalVehicles: 0,
    onlineVehicles: 0,
    offlineVehicles: 0,
    recentlyActiveVehicles: 0,
    lastSyncTime: new Date(),
    positionsUpdated: 0,
    errors: 0,
    syncStatus: 'idle'
  });

  // Calculate metrics from vehicles data
  const calculateMetrics = (vehicleData: any[]): VehicleMetrics => {
    const total = vehicleData.length;
    const online = vehicleData.filter(v => v.status === 'online').length;
    const offline = total - online;
    const idle = vehicleData.filter(v => v.status === 'idle').length;
    const alerts = vehicleData.reduce((sum, v) => sum + (v.alerts?.length || 0), 0);

    return {
      total,
      online,
      offline,
      idle,
      alerts,
      totalVehicles: total,
      onlineVehicles: online,
      offlineVehicles: offline,
      recentlyActiveVehicles: online + idle,
      lastSyncTime: new Date(),
      positionsUpdated: total,
      errors: 0,
      syncStatus: 'success'
    };
  };

  // Force refresh function
  const forceRefresh = async (): Promise<void> => {
    setIsRefreshing(true);
    setError(null);
    
    try {
      // Simulate data loading - replace with actual data fetching logic
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For now, return empty array - this should be replaced with actual vehicle data fetching
      const vehicleData: any[] = [];
      
      setVehicles(vehicleData);
      setMetrics(calculateMetrics(vehicleData));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to refresh vehicle data'));
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        await forceRefresh();
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  return {
    isLoading,
    vehicles,
    metrics,
    isRefreshing,
    error,
    forceRefresh
  };
};
