import { useState, useEffect } from 'react';
import { unifiedGP51Service } from '@/services/gp51/UnifiedGP51Service';
import type { GP51DeviceData, GP51Position, GP51Group } from '@/types/gp51-unified';

export const useUnifiedGP51Service = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [devices, setDevices] = useState<GP51DeviceData[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);

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
        
        // Auto-load devices after successful authentication
        console.log('🚀 Auto-loading devices after authentication...');
        await queryMonitorList();
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

  const queryMonitorList = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const result = await unifiedGP51Service.queryMonitorList();
      
      if (result.success && result.data) {
        setDevices(result.data);
        setGroups(result.groups || []);
      } else {
        throw new Error(result.error || 'Failed to query devices');
      }
      
      return result;
      
    } catch (error) {
      console.error('Query monitor list error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage, data: [], groups: [] };
    } finally {
      setIsLoading(false);
    }
  };

  const getLastPositions = async (deviceIds?: string[]) => {
    try {
      setIsLoading(true);
      setError('');
      
      const session = JSON.parse(localStorage.getItem('gp51_session') || '{}');
      
      if (!session.token) {
        throw new Error('No valid session found');
      }

      console.log('📍 Fetching last positions...');

      const response = await fetch('/functions/v1/gp51-last-positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: session.token,
          deviceIds: deviceIds || [],
          lastQueryTime: localStorage.getItem('gp51_last_query_time') || 0
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Position query failed');
      }

      // Store last query time
      if (data.lastQueryTime) {
        localStorage.setItem('gp51_last_query_time', data.lastQueryTime.toString());
      }
      
      setPositions(data.data || []);
      
      return data.data || [];

    } catch (error) {
      console.error('Position query error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      setUsers([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDevices = async () => {
    return await queryMonitorList();
  };

  const getDevices = async (deviceIds?: string[]) => {
    return await unifiedGP51Service.getDevices(deviceIds);
  };

  const getPositions = async (deviceIds?: string[]) => {
    try {
      setIsLoading(true);
      
      const session = JSON.parse(localStorage.getItem('gp51_session') || '{}');
      
      if (!session.token) {
        throw new Error('No valid session found');
      }

      console.log('📍 Fetching positions for devices:', deviceIds?.length || 'all');

      const response = await fetch('/functions/v1/gp51-last-positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: session.token,
          deviceIds: deviceIds || [],
          lastQueryTime: localStorage.getItem('gp51_last_query_time') || 0
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Position query failed');
      }

      console.log('✅ Positions loaded:', data.summary);
      
      setPositions(data.data || []);
      
      return {
        success: true,
        data: data.data,
        summary: data.summary
      };

    } catch (error) {
      console.error('Position query error:', error);
      setError(error instanceof Error ? error.message : 'Position query failed');
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Position query failed'
      };
    } finally {
      setIsLoading(false);
    }
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

  // Auto-load devices when session is available
  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('gp51_session') || '{}');
    if (session.token && session.username && devices.length === 0) {
      console.log('🚀 Auto-loading devices from existing session...');
      queryMonitorList();
    }
  }, []);

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
    positions,
    
    // Methods
    queryMonitorList,
    getLastPositions,
    
    // Computed values
    deviceCount: devices.length,
    groupCount: groups.length,
    activeDevices: devices.filter(d => d.isActive).length,
    onlineDevices: positions.filter(p => p.isOnline).length
  };
};
