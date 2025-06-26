import { useState, useEffect } from 'react';
import { GP51DeviceData, GP51AuthResponse } from '@/types/gp51-unified';

export const useUnifiedGP51Service = () => {
  // State management
  const [isConnected, setIsConnected] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [devices, setDevices] = useState<GP51DeviceData[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Check for existing session on load
  useEffect(() => {
    const savedSession = localStorage.getItem('gp51_session');
    if (savedSession) {
      try {
        const parsedSession = JSON.parse(savedSession);
        setSession(parsedSession);
        setIsAuthenticated(true);
        setIsConnected(true);
        setCurrentUser(parsedSession.username);
        
        // Auto-load data if session exists
        queryMonitorList();
      } catch (error) {
        console.error('Failed to parse saved session:', error);
        localStorage.removeItem('gp51_session');
      }
    }
  }, []);

  // Authentication methods
  const authenticate = async (username: string, password: string): Promise<GP51AuthResponse> => {
    try {
      setIsLoading(true);
      setError('');

      console.log('🔐 Authenticating user:', username);

      const response = await fetch('/functions/v1/gp51-hybrid-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.success) {
        const sessionData = {
          token: data.token,
          username: data.username,
          expiresAt: data.expiresAt
        };

        setSession(sessionData);
        setIsAuthenticated(true);
        setIsConnected(true);
        setCurrentUser(data.username);

        // Persist session
        localStorage.setItem('gp51_session', JSON.stringify(sessionData));

        // Auto-load data after successful authentication
        await queryMonitorList();

        console.log('✅ Authentication successful');
        return {
          success: true,
          status: 'authenticated',
          token: data.token,
          username: data.username
        };
      } else {
        setError(data.error || 'Authentication failed');
        return {
          success: false,
          status: 'error',
          error: data.error || 'Authentication failed'
        };
      }
    } catch (error: any) {
      const errorMsg = `Authentication error: ${error.message}`;
      setError(errorMsg);
      console.error('❌ Authentication error:', error);
      return {
        success: false,
        status: 'error',
        error: errorMsg
      };
    } finally {
      setIsLoading(false);
    }
  };

  const connect = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Try to restore existing session
      const savedSession = localStorage.getItem('gp51_session');
      if (savedSession) {
        const sessionData = JSON.parse(savedSession);
        
        // Check if session is still valid (simple expiry check)
        if (sessionData.expiresAt && new Date(sessionData.expiresAt) > new Date()) {
          setSession(sessionData);
          setIsConnected(true);
          setIsAuthenticated(true);
          setCurrentUser(sessionData.username);
          await queryMonitorList();
          return true;
        }
      }
      
      // If no valid session, connection requires authentication
      setError('No valid session found. Please authenticate.');
      return false;
    } catch (error: any) {
      console.error('Connection error:', error);
      setError(`Connection failed: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async (): Promise<void> => {
    try {
      console.log('🔌 Disconnecting from GP51...');
      
      setSession(null);
      setIsAuthenticated(false);
      setIsConnected(false);
      setCurrentUser(null);
      setDevices([]);
      setGroups([]);
      setPositions([]);
      setError('');

      // Clear stored session
      localStorage.removeItem('gp51_session');
      localStorage.removeItem('gp51_last_query_time');

      console.log('✅ Disconnected successfully');
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  const testConnection = async (): Promise<{ success: boolean; message?: string; error?: string; data?: any }> => {
    try {
      setIsLoading(true);
      
      const session = JSON.parse(localStorage.getItem('gp51_session') || '{}');
      
      if (!session.token) {
        return {
          success: false,
          error: 'No active session found'
        };
      }

      // Test with a simple device query
      const response = await fetch('/functions/v1/gp51-query-devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: session.token,
          username: session.username
        })
      });

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          message: `Connection healthy. Found ${data.summary?.totalDevices || 0} devices.`,
          data: {
            sessionValid: true,
            activeDevices: data.summary?.totalDevices || 0,
            responseTime: Date.now()
          }
        };
      } else {
        return {
          success: false,
          error: data.error || 'Connection test failed'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: `Connection test error: ${error.message}`
      };
    } finally {
      setIsLoading(false);
    }
  };

  const getConnectionHealth = async (): Promise<GP51HealthStatus> => {
    try {
      const testResult = await testConnection();
      
      return {
        status: testResult.success ? 'healthy' : 'failed' as 'healthy' | 'degraded' | 'failed',
        lastCheck: new Date(),
        responseTime: 0,
        errors: testResult.success ? [] : [testResult.message],
        isConnected: testResult.success,
        lastPingTime: new Date(),
        tokenValid: testResult.success,
        sessionValid: testResult.success,
        activeDevices: devices.length,
        errorMessage: testResult.success ? undefined : testResult.message
      };
    } catch (error) {
      return {
        status: 'failed' as 'healthy' | 'degraded' | 'failed',
        lastCheck: new Date(),
        responseTime: 0,
        errors: [error.message],
        isConnected: false,
        lastPingTime: new Date(),
        tokenValid: false,
        sessionValid: false,
        activeDevices: 0,
        errorMessage: error.message
      };
    }
  };

  // Data fetching methods
  const queryMonitorList = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const session = JSON.parse(localStorage.getItem('gp51_session') || '{}');
      
      if (!session.token || !session.username) {
        throw new Error('No valid session found');
      }

      console.log('🔍 Fetching devices for user:', session.username);

      const response = await fetch('/functions/v1/gp51-query-devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: session.token,
          username: session.username
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Device query failed');
      }

      console.log('✅ Devices loaded:', data.summary);
      
      setDevices(data.data || []);
      setGroups(data.groups || []);
      
      return {
        success: true,
        data: data.data,
        groups: data.groups,
        summary: data.summary
      };

    } catch (error: any) {
      console.error('Device query error:', error);
      setError(error.message);
      return {
        success: false,
        data: [],
        groups: [],
        error: error.message
      };
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDevices = async () => {
    // Alias for queryMonitorList
    return await queryMonitorList();
  };

  const getLastPositions = async (deviceIds?: string[]) => {
    try {
      setIsLoading(true);
      
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

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Position query failed');
      }

      // Store last query time
      if (data.lastQueryTime) {
        localStorage.setItem('gp51_last_query_time', data.lastQueryTime.toString());
      }
      
      setPositions(data.data || []);
      
      return {
        success: true,
        data: data.data || [],
        summary: data.summary
      };

    } catch (error: any) {
      console.error('Position query error:', error);
      setError(error.message);
      return {
        success: false,
        data: [],
        error: error.message
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Computed values
  const deviceCount = devices.length;
  const groupCount = groups.length;
  const activeDevices = devices.filter(d => d.isActive).length;
  const inactiveDevices = devices.filter(d => !d.isActive).length;
  const onlineDevices = positions.filter(p => p.isOnline).length;
  const offlineDevices = positions.filter(p => !p.isOnline).length;

  return {
    // State
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

    // Methods that components expect
    authenticate,
    connect,
    disconnect,
    testConnection,
    getConnectionHealth,
    queryMonitorList,
    fetchDevices,
    getLastPositions,

    // Computed values
    deviceCount,
    groupCount,
    activeDevices,
    inactiveDevices,
    onlineDevices,
    offlineDevices
  };
};
