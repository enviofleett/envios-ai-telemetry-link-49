
import { useState, useEffect } from 'react';
import { unifiedGP51Service } from '@/services/gp51/UnifiedGP51Service';
import type { GP51AuthResponse, GP51DeviceData } from '@/types/gp51-unified';

export const useUnifiedGP51Service = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [devices, setDevices] = useState<GP51DeviceData[]>([]);
  const [groups, setGroups] = useState<any[]>([]);

  useEffect(() => {
    setIsConnected(unifiedGP51Service.isAuthenticated);
    setSession(unifiedGP51Service.session);
    setIsAuthenticated(unifiedGP51Service.isAuthenticated);
  }, []);

  const clearError = () => {
    setError(null);
  };

  const connect = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await unifiedGP51Service.connect();
      setIsConnected(result);
      setIsAuthenticated(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async (): Promise<void> => {
    await unifiedGP51Service.disconnect();
    setIsConnected(false);
    setIsAuthenticated(false);
    setSession(null);
    setCurrentUser(null);
  };

  const getConnectionHealth = async () => {
    return await unifiedGP51Service.getConnectionHealth();
  };

  const authenticate = async (username: string, password: string): Promise<GP51AuthResponse> => {
    setIsLoading(true);
    try {
      const result = await unifiedGP51Service.authenticate(username, password);
      if (result.success) {
        setIsConnected(true);
        setIsAuthenticated(true);
        setSession(unifiedGP51Service.session);
        setCurrentUser({ username });
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
      return { success: false, status: 'error', error: err instanceof Error ? err.message : 'Authentication failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const authenticateAdmin = async (username: string, password: string): Promise<GP51AuthResponse> => {
    return await authenticate(username, password);
  };

  const logout = async (): Promise<void> => {
    await unifiedGP51Service.logout();
    setIsConnected(false);
    setIsAuthenticated(false);
    setSession(null);
    setCurrentUser(null);
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Mock implementation - replace with actual service call
      setUsers([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDevices = async () => {
    setIsLoading(true);
    try {
      const result = await unifiedGP51Service.getDevices();
      if (result.success && result.data) {
        setDevices(result.data);
        if (result.groups) {
          setGroups(result.groups);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch devices');
    } finally {
      setIsLoading(false);
    }
  };

  const getDevices = async (deviceIds?: string[]) => {
    return await unifiedGP51Service.getDevices(deviceIds);
  };

  const getPositions = async (deviceIds?: string[]) => {
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
    isLoading,
    error,
    isAuthenticated,
    currentUser,
    users,
    devices,
    groups,
    clearError,
    connect,
    disconnect,
    getConnectionHealth,
    authenticate,
    authenticateAdmin,
    logout,
    fetchUsers,
    fetchDevices,
    getDevices,
    getPositions,
    testConnection
  };
};
