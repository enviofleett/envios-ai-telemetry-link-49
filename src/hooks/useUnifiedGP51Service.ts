
import { useState, useCallback, useEffect } from 'react';
import { 
  UnifiedGP51Service, 
  unifiedGP51Service, 
  GP51User, 
  GP51Device, 
  GP51HealthStatus,
  GP51Session,
  GP51AuthResponse,
  GP51MonitorListResponse,
  GP51ServiceResult
} from '@/services/gp51/UnifiedGP51Service';

export interface UseUnifiedGP51ServiceReturn {
  // Authentication
  authenticate: (credentials: { username: string; password: string; apiUrl?: string }) => Promise<boolean>;
  authenticateAdmin: (username: string, password: string) => Promise<GP51AuthResponse>;
  logout: () => Promise<void>;
  disconnect: () => Promise<void>;
  
  // Connection monitoring
  getConnectionHealth: () => Promise<GP51HealthStatus>;
  testConnection: () => Promise<GP51ServiceResult>;
  
  // Session and connection state
  session: GP51Session | null;
  isConnected: boolean;
  isAuthenticated: boolean;
  currentUser: GP51User | null;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  
  // Data
  users: GP51User[];
  devices: GP51Device[];
  
  // Data fetching
  fetchUsers: () => Promise<void>;
  fetchDevices: () => Promise<void>;
  
  // User management
  addUser: (userData: any) => Promise<GP51AuthResponse>;
  queryUserDetail: (username: string) => Promise<any>;
  editUser: (username: string, profileData: any) => Promise<GP51AuthResponse>;
  deleteUser: (username: string) => Promise<GP51AuthResponse>;
  
  // Device management
  queryMonitorList: (username?: string) => Promise<GP51MonitorListResponse>;
  addDevice: (deviceData: any) => Promise<GP51AuthResponse>;
  editDevice: (deviceid: string, updates: any) => Promise<GP51AuthResponse>;
  deleteDevice: (deviceid: string) => Promise<GP51AuthResponse>;
  
  // Position tracking
  getLastPosition: (deviceids: string[]) => Promise<any[]>;
  queryTracks: (deviceid: string, startTime: string, endTime: string) => Promise<any>;
  
  // Vehicle commands
  sendCommand: (deviceid: string, command: string, params: any[]) => Promise<any>;
  disableEngine: (deviceid: string) => Promise<any>;
  enableEngine: (deviceid: string) => Promise<any>;
  setSpeedLimit: (deviceid: string, speedLimit: number, duration?: number) => Promise<any>;
}

export function useUnifiedGP51Service(): UseUnifiedGP51ServiceReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<GP51User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<GP51User[]>([]);
  const [devices, setDevices] = useState<GP51Device[]>([]);
  const [session, setSession] = useState<GP51Session | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    setSession(unifiedGP51Service.session);
    setIsConnected(unifiedGP51Service.isConnected);
    setIsAuthenticated(unifiedGP51Service.isConnected && unifiedGP51Service.session !== null);
  }, []);

  const authenticate = useCallback(async (credentials: { username: string; password: string; apiUrl?: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const success = await unifiedGP51Service.authenticate(credentials);
      if (success) {
        setIsAuthenticated(true);
        setIsConnected(true);
        setSession(unifiedGP51Service.session);
        setCurrentUser({ username: credentials.username, usertype: 11, showname: credentials.username });
      } else {
        setError('Authentication failed');
      }
      return success;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMsg);
      setIsAuthenticated(false);
      setIsConnected(false);
      setSession(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const authenticateAdmin = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await unifiedGP51Service.authenticateAdmin(username, password);
      if (result.status === 0) {
        setIsAuthenticated(true);
        setIsConnected(true);
        setSession(unifiedGP51Service.session);
        setCurrentUser({ username, usertype: 3, showname: username });
      } else {
        setError(result.cause || 'Admin authentication failed');
      }
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Admin authentication failed';
      setError(errorMsg);
      setIsAuthenticated(false);
      setIsConnected(false);
      setSession(null);
      return { status: 1, cause: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    unifiedGP51Service.clearError();
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await unifiedGP51Service.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsAuthenticated(false);
      setIsConnected(false);
      setCurrentUser(null);
      setSession(null);
      setUsers([]);
      setDevices([]);
      setError(null);
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    setIsLoading(true);
    try {
      await unifiedGP51Service.disconnect();
    } catch (err) {
      console.error('Disconnect error:', err);
    } finally {
      setIsAuthenticated(false);
      setIsConnected(false);
      setCurrentUser(null);
      setSession(null);
      setUsers([]);
      setDevices([]);
      setError(null);
      setIsLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    try {
      const usersList = await unifiedGP51Service.getUsers();
      setUsers(usersList);
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch users';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const fetchDevices = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    try {
      const devicesList = await unifiedGP51Service.getDevices();
      setDevices(devicesList);
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch devices';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const getConnectionHealth = useCallback(async () => {
    try {
      const health = await unifiedGP51Service.getConnectionHealth();
      setIsConnected(health.isConnected);
      if (!health.isConnected && health.errorMessage) {
        setError(health.errorMessage);
      }
      return health;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Health check failed';
      setError(errorMsg);
      setIsConnected(false);
      throw err;
    }
  }, []);

  const testConnection = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await unifiedGP51Service.testConnection();
      if (!result.success && result.error) {
        setError(result.error);
      }
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Connection test failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // Authentication
    authenticate,
    authenticateAdmin,
    logout,
    disconnect,
    
    // Connection monitoring
    getConnectionHealth,
    testConnection,
    
    // State
    session,
    isConnected,
    isAuthenticated,
    currentUser,
    isLoading,
    error,
    clearError,
    users,
    devices,
    
    // Data fetching
    fetchUsers,
    fetchDevices,
    
    // Service methods
    addUser: unifiedGP51Service.addUser.bind(unifiedGP51Service),
    queryUserDetail: unifiedGP51Service.queryUserDetail.bind(unifiedGP51Service),
    editUser: unifiedGP51Service.editUser.bind(unifiedGP51Service),
    deleteUser: unifiedGP51Service.deleteUser.bind(unifiedGP51Service),
    queryMonitorList: unifiedGP51Service.queryMonitorList.bind(unifiedGP51Service),
    addDevice: unifiedGP51Service.addDevice.bind(unifiedGP51Service),
    editDevice: unifiedGP51Service.editDevice.bind(unifiedGP51Service),
    deleteDevice: unifiedGP51Service.deleteDevice.bind(unifiedGP51Service),
    getLastPosition: unifiedGP51Service.getLastPosition.bind(unifiedGP51Service),
    queryTracks: unifiedGP51Service.queryTracks.bind(unifiedGP51Service),
    sendCommand: unifiedGP51Service.sendCommand.bind(unifiedGP51Service),
    disableEngine: unifiedGP51Service.disableEngine.bind(unifiedGP51Service),
    enableEngine: unifiedGP51Service.enableEngine.bind(unifiedGP51Service),
    setSpeedLimit: unifiedGP51Service.setSpeedLimit.bind(unifiedGP51Service),
  };
}
