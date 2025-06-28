import { useState, useEffect } from 'react';
import type {
  GP51HealthStatus,
  GP51Device as GP51DeviceData,
  GP51Position,
  GP51PerformanceMetrics,
  GP51ConnectionTestResult,
  GP51Group,
  GP51AuthResponse
} from '@/types/gp51-unified';
import { GP51PropertyMapper } from '@/types/gp51-unified';
import { unifiedGP51Service } from '@/services/gp51/UnifiedGP51Service';

export const useUnifiedGP51Service = () => {
  const [healthStatus, setHealthStatus] = useState<GP51HealthStatus | null>(null);
  const [devices, setDevices] = useState<GP51DeviceData[]>([]);
  const [positions, setPositions] = useState<GP51Position[]>([]);
  const [metrics, setMetrics] = useState<GP51PerformanceMetrics | null>(null);
  const [groups, setGroups] = useState<GP51Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<GP51PerformanceMetrics | null>(null);

  const processPositions = (rawPositions: GP51Position[]) => {
    return rawPositions.map(pos => {
      const enhanced = GP51PropertyMapper.enhancePosition(pos);
      console.log(`Processing position for device: ${enhanced.deviceId}`);
      return enhanced;
    });
  };

  const authenticate = async (username: string, password: string) => {
    setLoading(true);
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await unifiedGP51Service.authenticate(username, password);
      if (result.status === 0) {
        setIsAuthenticated(true);
        setSession({ username, token: result.token });
        return { success: true };
      } else {
        setError(result.cause);
        return { success: false, error: result.cause, cause: result.cause };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  };

  const testConnection = async (): Promise<GP51ConnectionTestResult> => {
    try {
      const health = await unifiedGP51Service.getConnectionHealth();
      return {
        success: health.isConnected,
        message: health.isConnected ? 'Connection successful' : 'Connection failed',
        data: health,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Connection test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  };

  const disconnect = async () => {
    await unifiedGP51Service.disconnect();
    setIsAuthenticated(false);
    setSession(null);
    setDevices([]);
    setGroups([]);
    setPositions([]);
    setError(null);
  };

  const getConnectionHealth = async () => {
    try {
      const health = await unifiedGP51Service.getConnectionHealth();
      setHealthStatus(health);
      return health;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Health check failed';
      setError(errorMessage);
      throw error;
    }
  };

  const fetchDevices = async () => {
    setDevicesLoading(true);
    setError(null);
    
    try {
      const result = await unifiedGP51Service.queryMonitorList();
      if (result.success && result.data) {
        setDevices(result.data);
        if (result.groups) {
          setGroups(result.groups);
        }
      } else {
        setError(result.error || 'Failed to fetch devices');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch devices';
      setError(errorMessage);
    } finally {
      setDevicesLoading(false);
    }
  };

  const connect = async () => {
    return await unifiedGP51Service.connect();
  };

  const refreshAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchDevices(),
        getConnectionHealth()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isConnected = isAuthenticated && session;

  return {
    healthStatus,
    devices,
    positions,
    metrics,
    groups,
    loading,
    isLoading,
    devicesLoading,
    error,
    isAuthenticated,
    session,
    performanceMetrics,
    isConnected,
    processPositions,
    authenticate,
    testConnection,
    disconnect,
    getConnectionHealth,
    fetchDevices,
    connect,
    refreshAllData
  };
};
