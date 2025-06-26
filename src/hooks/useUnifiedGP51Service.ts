
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { unifiedGP51Service } from '@/services/gp51/UnifiedGP51Service';
import { gp51DataService } from '@/services/gp51/GP51DataService';
import type { 
  GP51HealthStatus, 
  GP51DeviceData, 
  GP51Position, 
  GP51Group,
  GP51PerformanceMetrics 
} from '@/types/gp51-unified';

export const useUnifiedGP51Service = () => {
  const [session, setSession] = useState<any>(null);
  const [devices, setDevices] = useState<GP51DeviceData[]>([]);
  const [positions, setPositions] = useState<GP51Position[]>([]);
  const [groups, setGroups] = useState<GP51Group[]>([]);
  const [healthStatus, setHealthStatus] = useState<GP51HealthStatus | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<GP51PerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load existing session on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const sessionLoaded = await unifiedGP51Service.loadExistingSession();
        if (sessionLoaded) {
          setSession(unifiedGP51Service.session);
          console.log('✅ Loaded existing GP51 session');
        }
      } catch (err) {
        console.log('ℹ️ No existing GP51 session found');
      }
    };

    loadSession();
  }, []);

  // Auto-refresh data when session is available
  useEffect(() => {
    if (session) {
      refreshAllData();
      
      // Set up periodic refresh every 30 seconds
      const interval = setInterval(() => {
        refreshAllData();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [session]);

  const refreshAllData = useCallback(async () => {
    if (!session) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Refreshing all GP51 data...');
      
      // Fetch all data in parallel
      const [devicesResult, positionsResult, healthResult, metricsResult] = await Promise.all([
        gp51DataService.queryMonitorList(),
        gp51DataService.getPositions(),
        gp51DataService.testConnection(),
        gp51DataService.getPerformanceMetrics()
      ]);

      // Update devices
      if (devicesResult.success && devicesResult.data) {
        setDevices(devicesResult.data);
        console.log(`✅ Updated ${devicesResult.data.length} devices`);
      }

      // Update positions with enhanced filtering
      if (positionsResult.length > 0) {
        // Filter out invalid positions and ensure all required properties
        const validPositions = positionsResult.filter(pos => 
          pos.latitude !== 0 && 
          pos.longitude !== 0 && 
          pos.deviceId
        ).map(pos => ({
          ...pos,
          isOnline: pos.isOnline !== undefined ? pos.isOnline : isPositionRecent(pos.timestamp),
          isMoving: pos.isMoving !== undefined ? pos.isMoving : pos.speed > 5
        }));
        
        setPositions(validPositions);
        console.log(`✅ Updated ${validPositions.length} positions`);
      }

      // Update health status
      setHealthStatus(healthResult);
      
      // Update performance metrics
      setPerformanceMetrics(metricsResult);

      // Update groups if available
      if (devicesResult.groups) {
        setGroups(Object.values(devicesResult.groups));
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh data';
      setError(errorMessage);
      console.error('❌ Error refreshing GP51 data:', err);
      
      toast({
        title: "Data Refresh Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, toast]);

  // Helper function to determine if position is recent
  const isPositionRecent = (timestamp: number | string): boolean => {
    let positionTime: Date;
    
    if (typeof timestamp === 'string') {
      positionTime = new Date(timestamp);
    } else {
      positionTime = new Date(timestamp * 1000);
    }
    
    const now = new Date();
    const diffMinutes = (now.getTime() - positionTime.getTime()) / (1000 * 60);
    return diffMinutes <= 10;
  };

  // Add missing methods
  const fetchDevices = useCallback(async () => {
    try {
      const result = await gp51DataService.queryMonitorList();
      if (result.success && result.data) {
        setDevices(result.data);
      }
    } catch (err) {
      console.error('Error fetching devices:', err);
    }
  }, []);

  const connect = useCallback(async () => {
    try {
      const connected = await unifiedGP51Service.connect();
      if (connected) {
        setSession(unifiedGP51Service.session);
        await refreshAllData();
      }
    } catch (err) {
      console.error('Error connecting:', err);
    }
  }, [refreshAllData]);

  const queryMonitorList = useCallback(async () => {
    return gp51DataService.queryMonitorList();
  }, []);

  const getLastPositions = useCallback(async (deviceIds?: string[]) => {
    const allPositions = await gp51DataService.getPositions();
    return deviceIds ? allPositions.filter(pos => deviceIds.includes(pos.deviceId)) : allPositions;
  }, []);

  const getConnectionHealth = useCallback(async () => {
    return gp51DataService.testConnection();
  }, []);

  const testConnection = useCallback(async () => {
    try {
      const health = await gp51DataService.testConnection();
      return {
        success: health.isHealthy,
        message: health.isHealthy ? 'Connection successful' : health.errorMessage || 'Connection failed'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }, []);

  const authenticate = useCallback(async (username: string, password: string) => {
    try {
      const result = await unifiedGP51Service.authenticate(username, password);
      if (result.success) {
        setSession(unifiedGP51Service.session);
      }
      return result;
    } catch (error) {
      return {
        success: false,
        status: 'error',
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }, []);

  const disconnect = useCallback(async () => {
    await unifiedGP51Service.disconnect();
    setSession(null);
    setDevices([]);
    setPositions([]);
    setGroups([]);
    setHealthStatus(null);
    setPerformanceMetrics(null);
  }, []);

  return {
    // State
    session,
    devices,
    positions,
    groups,
    healthStatus,
    performanceMetrics,
    isLoading,
    error,
    
    // Computed properties
    isAuthenticated: !!session,
    isConnected: healthStatus?.isConnected || false,
    
    // Methods - including the missing ones
    fetchDevices,
    connect,
    authenticate,
    disconnect,
    queryMonitorList,
    getLastPositions,
    getConnectionHealth,
    testConnection,
    refreshAllData
  };
};
