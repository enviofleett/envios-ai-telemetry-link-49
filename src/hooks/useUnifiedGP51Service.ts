
import { useState, useEffect } from 'react';
import { unifiedGP51Service } from '@/services/gp51/UnifiedGP51Service';
import type { GP51AuthResponse, GP51DeviceData, GP51Position } from '@/types/gp51-unified';

export const useUnifiedGP51Service = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    setIsConnected(unifiedGP51Service.isAuthenticated);
    setSession(unifiedGP51Service.session);
  }, []);

  const connect = async (): Promise<boolean> => {
    const result = await unifiedGP51Service.connect();
    setIsConnected(result);
    return result;
  };

  const disconnect = async (): Promise<void> => {
    await unifiedGP51Service.disconnect();
    setIsConnected(false);
    setSession(null);
  };

  const getConnectionHealth = async () => {
    return await unifiedGP51Service.getConnectionHealth();
  };

  const authenticate = async (username: string, password: string): Promise<GP51AuthResponse> => {
    const result = await unifiedGP51Service.authenticate(username, password);
    if (result.success) {
      setIsConnected(true);
      setSession(unifiedGP51Service.session);
    }
    return result;
  };

  const authenticateAdmin = async (username: string, password: string): Promise<GP51AuthResponse> => {
    return await unifiedGP51Service.authenticateAdmin(username, password);
  };

  const logout = async (): Promise<void> => {
    await unifiedGP51Service.logout();
    setIsConnected(false);
    setSession(null);
  };

  const getDevices = async (deviceIds?: string[]) => {
    return await unifiedGP51Service.getDevices(deviceIds);
  };

  const getPositions = async (deviceIds?: string[]): Promise<GP51Position[]> => {
    return await unifiedGP51Service.getPositions(deviceIds);
  };

  const testConnection = async () => {
    try {
      const health = await getConnectionHealth();
      return {
        success: health.status === 'healthy',
        data: health,
        error: health.status !== 'healthy' ? 'Connection test failed' : undefined
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  };

  return {
    isConnected,
    session,
    connect,
    disconnect,
    getConnectionHealth,
    authenticate,
    authenticateAdmin,
    logout,
    getDevices,
    getPositions,
    testConnection
  };
};
