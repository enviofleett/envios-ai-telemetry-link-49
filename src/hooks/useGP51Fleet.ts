
import { useState, useCallback, useEffect } from 'react';
import { GP51EnhancedDataService } from '@/services/gp51/GP51EnhancedDataService';
import type { GP51FleetData, GP51FleetDataOptions, GP51Device } from '@/types/gp51-unified';
import { createDefaultFleetData, ensureFleetDataResponse } from '@/types/gp51-unified';

export const useGP51Fleet = (options: {
  autoRefresh?: boolean;
  refreshInterval?: number;
  includePositions?: boolean;
} = {}) => {
  const [dataService] = useState(() => new GP51EnhancedDataService());
  const [fleetData, setFleetData] = useState<GP51FleetData>(createDefaultFleetData());
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
      const fetchOptions: GP51FleetDataOptions = {
        includePositions: options.includePositions ?? true,
        forceRefresh: forceRefresh // Now valid with updated interface
      };
      
      const result = await dataService.getCompleteFleetData(fetchOptions);
      
      // Ensure response properties exist
      const safeFleetData = ensureFleetDataResponse(result);
      
      // Handle both response formats
      const success = safeFleetData.success ?? true;
      const deviceData = safeFleetData.data || safeFleetData.devices || [];
      const errorMsg = safeFleetData.error;
      
      if (success && !errorMsg) {
        const updatedFleetData = {
          ...safeFleetData,
          devices: deviceData
        };
        setFleetData(updatedFleetData);
      } else {
        setError(errorMsg || 'Failed to fetch fleet data');
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
      if (result.success) {
        setIsAuthenticated(true);
        
        // Start real-time updates if auto-refresh is enabled (no arguments)
        if (options.autoRefresh) {
          dataService.startRealTimeUpdates(); // Fixed - removed invalid arguments
        }
        
        await fetchFleetData();
        return { success: true };
      } else {
        setError(result.error || 'Authentication failed');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [dataService, fetchFleetData, options.autoRefresh]);

  const logout = useCallback(async () => {
    dataService.stopRealTimeUpdates();
    await dataService.logout();
    setIsAuthenticated(false);
    setFleetData(createDefaultFleetData());
    setError(null);
  }, [dataService]);

  // Auto-refresh functionality with enhanced service
  useEffect(() => {
    if (options.autoRefresh && isAuthenticated) {
      const interval = setInterval(() => {
        fetchFleetData();
      }, options.refreshInterval || 30000);
      
      return () => clearInterval(interval);
    }
  }, [options.autoRefresh, options.refreshInterval, isAuthenticated, fetchFleetData]);

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
