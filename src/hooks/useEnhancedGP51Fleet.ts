
import { useState, useCallback, useEffect } from 'react';
import { GP51EnhancedDataService } from '@/services/gp51/GP51EnhancedDataService';
import type { GP51FleetData, GP51FleetDataOptions } from '@/types/gp51-unified';
import { createDefaultFleetData } from '@/types/gp51-unified';

export const useEnhancedGP51Fleet = (options: {
  autoRefresh?: boolean;
  refreshInterval?: number;
  includePositions?: boolean;
} = {}) => {
  const [dataService] = useState(() => new GP51EnhancedDataService());
  const [fleetData, setFleetData] = useState<GP51FleetData>(createDefaultFleetData());
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRealTimeActive, setIsRealTimeActive] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const startRealTime = useCallback(() => {
    if (!isRealTimeActive) {
      dataService.startRealTimeUpdates();
      setIsRealTimeActive(true);

      // Subscribe to updates with proper typing - only callback parameter
      const unsubscribe = dataService.subscribe((fleetData: GP51FleetData) => {
        setFleetData(fleetData);
      });

      return unsubscribe;
    }
  }, [dataService, isRealTimeActive]);

  const stopRealTime = useCallback(() => {
    dataService.stopRealTimeUpdates();
    setIsRealTimeActive(false);
  }, [dataService]);

  const authenticate = useCallback(async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const authResult = await dataService.authenticate(username, password);
      
      if (authResult.success) {
        setIsAuthenticated(true);
        const fleetResult = await dataService.getCompleteFleetData({ includePositions: true });
        setFleetData(fleetResult);
        startRealTime();
        return { success: true };
      } else {
        setError(authResult.error || 'Authentication failed');
        return { success: false, error: authResult.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [dataService, startRealTime]);

  const generateReport = useCallback(async (options: any) => {
    setLoading(true);
    try {
      const report = await dataService.generateFleetReport();
      return report;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Report generation failed');
      return { success: false, error: 'Report generation failed' };
    } finally {
      setLoading(false);
    }
  }, [dataService]);

  const getVehicleHistory = useCallback(async (deviceId: string, startDate: Date, endDate: Date) => {
    setLoading(true);
    try {
      const timeRange = {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        hours: Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60))
      };
      const history = await dataService.getVehicleHistory(deviceId, timeRange);
      return history;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch vehicle history');
      return { success: false, error: 'Failed to fetch vehicle history' };
    } finally {
      setLoading(false);
    }
  }, [dataService]);

  const getGeofences = useCallback(async () => {
    setLoading(true);
    try {
      const geofences = await dataService.getGeofences();
      return geofences;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch geofences');
      return { success: false, error: 'Failed to fetch geofences' };
    } finally {
      setLoading(false);
    }
  }, [dataService]);

  const refresh = useCallback(async (forceRefresh = false) => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const fleetResult = await dataService.getCompleteFleetData({ 
        includePositions: true
      });
      
      setFleetData(fleetResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refresh failed');
    } finally {
      setLoading(false);
    }
  }, [dataService, isAuthenticated]);

  const logout = useCallback(async () => {
    stopRealTime();
    await dataService.logout();
    setIsAuthenticated(false);
    setFleetData(createDefaultFleetData());
    setAlerts([]);
    setError(null);
  }, [stopRealTime, dataService]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRealTime();
    };
  }, [stopRealTime]);

  return {
    fleetData,
    alerts,
    loading,
    error,
    isAuthenticated,
    isRealTimeActive,
    authenticate,
    refresh,
    logout,
    startRealTime,
    stopRealTime,
    generateReport: generateReport,
    getVehicleHistory,
    getGeofences
  };
};
