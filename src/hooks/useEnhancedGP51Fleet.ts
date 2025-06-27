
import { useState, useCallback, useEffect } from 'react';
import { GP51EnhancedDataService } from '@/services/gp51/GP51EnhancedDataService';

export const useEnhancedGP51Fleet = () => {
  const [service] = useState(() => new GP51EnhancedDataService());
  const [fleetData, setFleetData] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRealTimeActive, setIsRealTimeActive] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const startRealTime = useCallback(() => {
    if (!isRealTimeActive) {
      service.startRealTimeUpdates();
      setIsRealTimeActive(true);

      // Subscribe to position updates
      service.subscribe('position_update', (positions) => {
        setFleetData((prev: any) => {
          if (!prev) return prev;
          
          // Update positions in fleet data
          const positionMap = new Map(positions.map((p: any) => [p.deviceid, p]));
          
          const updatedGroups = prev.groups.map((group: any) => ({
            ...group,
            devices: group.devices.map((device: any) => {
              const newPosition = positionMap.get(device.deviceid);
              return newPosition ? {
                ...device,
                position: {
                  latitude: newPosition.callat,
                  longitude: newPosition.callon,
                  speed: newPosition.speed,
                  heading: newPosition.course
                },
                lastSeen: new Date(newPosition.updatetime)
              } : device;
            })
          }));
          
          return {
            ...prev,
            groups: updatedGroups,
            lastUpdate: new Date()
          };
        });
      });

      // Subscribe to alerts
      service.subscribe('alerts', (newAlerts) => {
        setAlerts(prev => [...newAlerts, ...prev].slice(0, 100)); // Keep last 100 alerts
      });
    }
  }, [service, isRealTimeActive]);

  const stopRealTime = useCallback(() => {
    service.stopRealTimeUpdates();
    setIsRealTimeActive(false);
  }, [service]);

  const authenticate = useCallback(async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const authResult = await service.authenticate(username, password);
      
      if (authResult.status === 0) {
        setIsAuthenticated(true);
        const fleetResult = await service.getCompleteFleetData({ includePositions: true });
        
        if (fleetResult.success) {
          setFleetData(fleetResult.data);
          startRealTime();
          return { success: true };
        } else {
          setError(fleetResult.error || 'Failed to fetch fleet data');
          return { success: false, error: fleetResult.error };
        }
      } else {
        setError(authResult.cause);
        return { success: false, error: authResult.cause };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [service, startRealTime]);

  const generateReport = useCallback(async (options: any) => {
    setLoading(true);
    try {
      const report = await service.generateFleetReport(options);
      return report;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Report generation failed');
      return { success: false, error: 'Report generation failed' };
    } finally {
      setLoading(false);
    }
  }, [service]);

  const getVehicleHistory = useCallback(async (deviceId: string, startDate: Date, endDate: Date) => {
    setLoading(true);
    try {
      const history = await service.getVehicleHistory(deviceId, startDate, endDate);
      return history;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch vehicle history');
      return { success: false, error: 'Failed to fetch vehicle history' };
    } finally {
      setLoading(false);
    }
  }, [service]);

  const getGeofences = useCallback(async () => {
    setLoading(true);
    try {
      const geofences = await service.getGeofences();
      return geofences;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch geofences');
      return { success: false, error: 'Failed to fetch geofences' };
    } finally {
      setLoading(false);
    }
  }, [service]);

  const refresh = useCallback(async (forceRefresh = false) => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const fleetResult = await service.getCompleteFleetData({ 
        includePositions: true, 
        forceRefresh 
      });
      
      if (fleetResult.success) {
        setFleetData(fleetResult.data);
      } else {
        setError(fleetResult.error || 'Failed to refresh fleet data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refresh failed');
    } finally {
      setLoading(false);
    }
  }, [service, isAuthenticated]);

  const logout = useCallback(async () => {
    stopRealTime();
    await service.logout();
    setIsAuthenticated(false);
    setFleetData(null);
    setAlerts([]);
    setError(null);
  }, [stopRealTime, service]);

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
    generateReport,
    getVehicleHistory,
    getGeofences
  };
};
