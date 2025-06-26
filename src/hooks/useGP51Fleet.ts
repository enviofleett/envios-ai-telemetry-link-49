
import { useState, useCallback, useEffect } from 'react';
import { gp51UnifiedDataService } from '@/services/gp51/GP51UnifiedDataService';

export const useGP51Fleet = (options: {
  autoRefresh?: boolean;
  refreshInterval?: number;
  includePositions?: boolean;
} = {}) => {
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
      const result = await gp51UnifiedDataService.getCompleteFleetData({
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
  }, [isAuthenticated, options.includePositions]);

  const authenticate = useCallback(async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await gp51UnifiedDataService.authenticate(username, password);
      if (result.status === 0) {
        setIsAuthenticated(true);
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
  }, [fetchFleetData]);

  const logout = useCallback(async () => {
    await gp51UnifiedDataService.logout();
    setIsAuthenticated(false);
    setFleetData(null);
    setError(null);
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    if (options.autoRefresh && fleetData && isAuthenticated) {
      const interval = setInterval(() => {
        fetchFleetData();
      }, options.refreshInterval || 30000);
      
      return () => clearInterval(interval);
    }
  }, [options.autoRefresh, options.refreshInterval, fleetData, isAuthenticated, fetchFleetData]);

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
