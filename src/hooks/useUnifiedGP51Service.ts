
import { useState, useCallback, useEffect } from 'react';
import { unifiedGP51Service } from '@/services/gp51/UnifiedGP51Service';
import type {
  GP51AuthResponse,
  GP51MonitorListResponse,
  GP51HealthStatus,
  GP51Session,
  GP51User,
  GP51Position
} from '@/types/gp51';

export interface UseUnifiedGP51ServiceReturn {
  // Authentication
  authenticate: (username: string, password: string) => Promise<GP51AuthResponse>;
  authenticateAdmin: (username: string, password: string) => Promise<GP51AuthResponse>;
  logout: () => Promise<void>;
  disconnect: () => Promise<void>;

  // State
  isAuthenticated: boolean;
  currentUser: GP51User | null;
  session: GP51Session | null;
  isLoading: boolean;
  error: string | null;

  // Data
  users: GP51User[];
  devices: any[];
  groups: any[];
  summary: any;

  // Health
  healthStatus: GP51HealthStatus | null;
  getConnectionHealth: () => Promise<GP51HealthStatus>;

  // Data operations
  fetchData: () => Promise<void>;
  getPositions: (deviceIds?: string[]) => Promise<GP51Position[]>;
  sendCommand: (deviceid: string, command: string, params: any[]) => Promise<any>;
  queryMonitorList: (username?: string) => Promise<GP51MonitorListResponse>;
  addUser: (userData: any) => Promise<GP51AuthResponse>;
  addDevice: (deviceData: any) => Promise<GP51AuthResponse>;
  testConnection: () => Promise<{ success: boolean; error?: string; data?: any }>;
}

export function useUnifiedGP51Service(): UseUnifiedGP51ServiceReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<GP51User | null>(null);
  const [session, setSession] = useState<GP51Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<GP51User[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [healthStatus, setHealthStatus] = useState<GP51HealthStatus | null>(null);

  // Sync with service state
  useEffect(() => {
    setIsAuthenticated(unifiedGP51Service.isAuthenticated);
    setSession(unifiedGP51Service.session);
  }, []);

  const authenticate = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await unifiedGP51Service.authenticate(username, password);
      
      if (result.success || result.status === 0) {
        setIsAuthenticated(true);
        setSession(unifiedGP51Service.session);
        setCurrentUser({ username, usertype: 11, showname: username });
      } else {
        setError(result.error || result.cause || 'Authentication failed');
      }
      
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const authenticateAdmin = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await unifiedGP51Service.authenticateAdmin(username, password);
      
      if (result.success || result.status === 0) {
        setIsAuthenticated(true);
        setSession(unifiedGP51Service.session);
        setCurrentUser({ username, usertype: 3, showname: username });
      } else {
        setError(result.error || result.cause || 'Admin authentication failed');
      }
      
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Admin authentication failed';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await unifiedGP51Service.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setSession(null);
    setUsers([]);
    setDevices([]);
    setGroups([]);
    setSummary(null);
    setError(null);
  }, []);

  const disconnect = useCallback(async () => {
    await unifiedGP51Service.disconnect();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setSession(null);
    setError(null);
  }, []);

  const getConnectionHealth = useCallback(async () => {
    try {
      const health = await unifiedGP51Service.getConnectionHealth();
      setHealthStatus(health);
      return health;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Health check failed';
      setError(errorMsg);
      throw err;
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!unifiedGP51Service.isAuthenticated) {
      setError('Not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await unifiedGP51Service.queryMonitorList();
      
      if (result.success || result.status === 0) {
        const data = result.data || {};
        setUsers(data.users || []);
        setDevices(data.devices || []);
        setGroups(data.groups || result.groups || []);
        setSummary(data.summary || null);
      } else {
        setError(result.error || result.cause || 'Failed to fetch data');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getPositions = useCallback(async (deviceIds?: string[]) => {
    try {
      return await unifiedGP51Service.getLastPositions(deviceIds);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get positions';
      setError(errorMsg);
      return [];
    }
  }, []);

  const sendCommand = useCallback(async (deviceid: string, command: string, params: any[]) => {
    return await unifiedGP51Service.sendCommand(deviceid, command, params);
  }, []);

  const queryMonitorList = useCallback(async (username?: string) => {
    return await unifiedGP51Service.queryMonitorList(username);
  }, []);

  const addUser = useCallback(async (userData: any) => {
    return await unifiedGP51Service.addUser(userData);
  }, []);

  const addDevice = useCallback(async (deviceData: any) => {
    return await unifiedGP51Service.addDevice(deviceData);
  }, []);

  const testConnection = useCallback(async () => {
    try {
      const health = await unifiedGP51Service.getConnectionHealth();
      return {
        success: health.isConnected,
        data: {
          sessionValid: health.sessionValid,
          activeDevices: health.activeDevices,
          responseTime: health.responseTime
        },
        error: health.isConnected ? undefined : health.errorMessage,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
      };
    }
  }, []);

  return {
    authenticate,
    authenticateAdmin,
    logout,
    disconnect,
    isAuthenticated,
    currentUser,
    session,
    isLoading,
    error,
    users,
    devices,
    groups,
    summary,
    healthStatus,
    getConnectionHealth,
    fetchData,
    getPositions,
    sendCommand,
    queryMonitorList,
    addUser,
    addDevice,
    testConnection
  };
}
