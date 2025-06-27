
import { useState, useCallback, useEffect } from 'react';
import { GP51EnhancedDataService } from '@/services/gp51/GP51EnhancedDataService';

export const useGP51Fleet = (options: {
  autoRefresh?: boolean;
  refreshInterval?: number;
  includePositions?: boolean;
} = {}) => {
  const [dataService] = useState(() => new GP51EnhancedDataService());
  const [fleetData, setFleetData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchFleetData = useCallback(async (forceRefresh = false) => {
    if (!isAuthenticated) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await dataService.getCompleteFleetData({
        includePositions: options.includePositions ?? true,
        forceRefresh
      });
      
      if (result.success) {
        setFleetData(result.data);
      } else {
        setError(result.error || 'Failed to fetch fleet data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [dataService, isAuthenticated, options.includePositions]);

  const authenticate = useCallback(async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await dataService.authenticate(username, password);
      if (result.status === 0) {
        setIsAuthenticated(true);
        
        // Start real-time updates if auto-refresh is enabled
        if (options.autoRefresh) {
          dataService.startRealTimeUpdates(options.refreshInterval || 30000);
        }
        
        await fetchFleetData();
        return { success: true };
      } else {
        setError(result.cause);
        return { success: false, error: result.cause };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [dataService, fetchFleetData, options.autoRefresh, options.refreshInterval]);

  const logout = useCallback(async () => {
    dataService.stopRealTimeUpdates();
    await dataService.logout();
    setIsAuthenticated(false);
    setFleetData(null);
    setError(null);
  }, [dataService]);

  // Auto-refresh functionality with enhanced service
  useEffect(() => {
    if (options.autoRefresh && fleetData && isAuthenticated && !dataService.startRealTimeUpdates) {
      const interval = setInterval(() => {
        fetchFleetData();
      }, options.refreshInterval || 30000);
      
      return () => clearInterval(interval);
    }
  }, [options.autoRefresh, options.refreshInterval, fleetData, isAuthenticated, fetchFleetData, dataService]);

  return {
    fleetData,
    loading,
    error,
    isAuthenticated,
    authenticate,
    refresh: () => fetchFleetData(true),
    logout
  };
};
