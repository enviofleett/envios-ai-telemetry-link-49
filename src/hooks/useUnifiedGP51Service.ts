
import { useState, useCallback, useEffect } from 'react';
import { 
  unifiedGP51Service, 
  GP51User, 
  GP51Session,
  UnifiedGP51Response,
  GP51HealthStatus,
  GP51Device
} from '@/services/gp51/UnifiedGP51Service';

// Updated interfaces to match actual service responses
export interface GP51AuthResponse {
  success: boolean;
  status: number;
  error?: string;
  data?: any;
}

export interface GP51MonitorListResponse {
  success: boolean;
  error?: string;
  data?: any;
}

export interface UseUnifiedGP51ServiceReturn {
  authenticate: (username: string, password: string) => Promise<GP51AuthResponse>;
  authenticateAdmin: (username: string, password: string) => Promise<GP51AuthResponse>;
  logout: () => Promise<void>;
  disconnect: () => Promise<void>;
  getConnectionHealth: () => Promise<GP51HealthStatus>;
  testConnection: () => Promise<{ success: boolean; error?: string; data?: any }>;
  session: GP51Session | null;
  isConnected: boolean;
  isAuthenticated: boolean;
  currentUser: GP51User | null;
  isLoading: boolean;
  error: string | null;
  queryMonitorList: (username?: string) => Promise<GP51MonitorListResponse>;
  addUser: (userData: any) => Promise<GP51AuthResponse>;
  addDevice: (deviceData: any) => Promise<GP51AuthResponse>;
  sendCommand: (deviceid: string, command: string, params: any[]) => Promise<any>;
  clearError: () => void;
  health: GP51HealthStatus | null;
  users: GP51User[];
  devices: GP51Device[];
  fetchUsers: () => Promise<void>;
  fetchDevices: () => Promise<void>;
}

export function useUnifiedGP51Service(): UseUnifiedGP51ServiceReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<GP51User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<GP51Session | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [health, setHealth] = useState<GP51HealthStatus | null>(null);
  const [users, setUsers] = useState<GP51User[]>([]);
  const [devices, setDevices] = useState<GP51Device[]>([]);

  useEffect(() => {
    setSession(unifiedGP51Service.session);
    setIsConnected(unifiedGP51Service.isConnected);
    setIsAuthenticated(unifiedGP51Service.isConnected && unifiedGP51Service.session !== null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const authenticate = useCallback(async (username: string, password: string): Promise<GP51AuthResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await unifiedGP51Service.authenticate(username, password);
      if (result.success) {
        setIsAuthenticated(true);
        setIsConnected(true);
        setSession(unifiedGP51Service.session);
        setCurrentUser({ username, usertype: 11, showname: username });
        return { success: true, status: 0 };
      } else {
        setError(result.error || 'Authentication failed');
        return { success: false, status: 1, error: result.error || 'Authentication failed' };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMsg);
      return { success: false, status: 1, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const authenticateAdmin = useCallback(async (username: string, password: string): Promise<GP51AuthResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await unifiedGP51Service.authenticateAdmin(username, password);
      if (result.success) {
        setIsAuthenticated(true);
        setIsConnected(true);
        setSession(unifiedGP51Service.session);
        setCurrentUser({ username, usertype: 3, showname: username });
        return { success: true, status: 0 };
      } else {
        setError(result.error || 'Admin authentication failed');
        return { success: false, status: 1, error: result.error || 'Admin authentication failed' };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Admin authentication failed';
      setError(errorMsg);
      return { success: false, status: 1, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await unifiedGP51Service.logout();
    setIsAuthenticated(false);
    setIsConnected(false);
    setCurrentUser(null);
    setSession(null);
    setError(null);
  }, []);

  const disconnect = useCallback(async () => {
    await unifiedGP51Service.disconnect();
    setIsAuthenticated(false);
    setIsConnected(false);
    setCurrentUser(null);
    setSession(null);
    setError(null);
  }, []);

  const getConnectionHealth = useCallback(async () => {
    const healthData = await unifiedGP51Service.getConnectionHealth();
    setHealth(healthData);
    return healthData;
  }, []);

  const testConnection = useCallback(async () => {
    try {
      const healthStatus = await unifiedGP51Service.getConnectionHealth();
      setHealth(healthStatus);
      return { 
        success: healthStatus.isConnected, 
        data: healthStatus,
        error: healthStatus.isConnected ? undefined : 'Connection failed'
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Connection test failed';
      return { success: false, error: errorMsg };
    }
  }, []);

  const queryMonitorList = useCallback(async (username?: string): Promise<GP51MonitorListResponse> => {
    try {
      const result = await unifiedGP51Service.queryMonitorList();
      return {
        success: result.success,
        error: result.error,
        data: result.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Query failed'
      };
    }
  }, []);

  const addUser = useCallback(async (userData: any): Promise<GP51AuthResponse> => {
    try {
      // Placeholder implementation - would need to be added to UnifiedGP51Service
      return { success: false, status: 1, error: 'Not implemented' };
    } catch (error) {
      return { success: false, status: 1, error: 'Add user failed' };
    }
  }, []);

  const addDevice = useCallback(async (deviceData: any): Promise<GP51AuthResponse> => {
    try {
      // Placeholder implementation - would need to be added to UnifiedGP51Service
      return { success: false, status: 1, error: 'Not implemented' };
    } catch (error) {
      return { success: false, status: 1, error: 'Add device failed' };
    }
  }, []);

  const sendCommand = useCallback(async (deviceid: string, command: string, params: any[]) => {
    return await unifiedGP51Service.sendCommand(deviceid, command, params);
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setUsers([
        { username: 'admin', usertype: 3, showname: 'Administrator' },
        { username: 'user1', usertype: 11, showname: 'Regular User' }
      ]);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  }, []);

  const fetchDevices = useCallback(async () => {
    try {
      const monitorList = await unifiedGP51Service.queryMonitorList();
      if (monitorList.success && monitorList.data?.groups) {
        const allDevices = monitorList.data.groups.flatMap((group: any) => 
          (group.devices || []).map((device: any) => ({
            deviceid: device.deviceid,
            devicename: device.devicename,
            devicetype: device.devicetype,
            status: device.status,
            lastactivetime: device.lastactivetime,
            simnum: device.simnum
          }))
        );
        setDevices(allDevices);
      }
    } catch (error) {
      console.error('Failed to fetch devices:', error);
    }
  }, []);

  return {
    authenticate,
    authenticateAdmin,
    logout,
    disconnect,
    getConnectionHealth,
    testConnection,
    session,
    isConnected,
    isAuthenticated,
    currentUser,
    isLoading,
    error,
    queryMonitorList,
    addUser,
    addDevice,
    sendCommand,
    clearError,
    health,
    users,
    devices,
    fetchUsers,
    fetchDevices
  };
}
