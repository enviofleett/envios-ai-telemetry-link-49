
import { useState, useCallback, useEffect } from 'react';
import { 
  unifiedGP51Service, 
  type GP51User, 
  type GP51Device, 
  type GP51HealthStatus,
  type GP51Session,
  type GP51AuthResponse,
  type GP51MonitorListResponse
} from '@/services/gp51';

export interface UseUnifiedGP51ServiceReturn {
  // Authentication
  authenticate: (credentials: { username: string; password: string; apiUrl?: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  disconnect: () => Promise<void>;
  clearError: () => void;
  
  // Connection monitoring
  getConnectionHealth: () => Promise<GP51HealthStatus>;
  testConnection: () => Promise<{ success: boolean; error?: string; data?: any }>;
  
  // Session and connection state
  session: GP51Session | null;
  isConnected: boolean;
  isAuthenticated: boolean;
  currentUser: GP51User | null;
  isLoading: boolean;
  error: string | null;
  
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
  // State management
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<GP51User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<GP51User[]>([]);
  const [devices, setDevices] = useState<GP51Device[]>([]);
  const [session, setSession] = useState<GP51Session | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Sync state with service
  useEffect(() => {
    setSession(unifiedGP51Service.session);
    setIsConnected(unifiedGP51Service.isConnected);
    setIsAuthenticated(unifiedGP51Service.isConnected && unifiedGP51Service.session !== null);
  }, []);

  // Authentication methods
  const authenticate = useCallback(async (credentials: { username: string; password: string; apiUrl?: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await unifiedGP51Service.authenticate(credentials.username, credentials.password);
      if (result.status === 0) {
        setIsAuthenticated(true);
        setIsConnected(true);
        setSession(unifiedGP51Service.session);
        setCurrentUser({ username: credentials.username, usertype: 11, showname: credentials.username });
        return true;
      } else {
        setError(result.cause || 'Authentication failed');
        return false;
      }
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

  // Test connection method
  const testConnection = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const health = await unifiedGP51Service.getConnectionHealth();
      if (health.isConnected && health.sessionValid) {
        return { success: true, data: health };
      } else {
        setError(health.errorMessage || 'Connection test failed');
        return { success: false, error: health.errorMessage || 'Connection test failed' };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Connection test failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Data fetching methods
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
      console.error('Fetch users error:', err);
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
      console.error('Fetch devices error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Connection health monitoring
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

  // Wrapped service methods with error handling
  const addUser = useCallback(async (userData: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await unifiedGP51Service.addUser(userData);
      if (result.status === 0) {
        await fetchUsers();
      } else {
        setError(result.cause || 'Failed to add user');
      }
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add user';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchUsers]);

  const queryMonitorList = useCallback(async (username?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await unifiedGP51Service.queryMonitorList(username);
      if (result.status !== 0) {
        setError(result.cause || 'Failed to query monitor list');
      }
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to query monitor list';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addDevice = useCallback(async (deviceData: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await unifiedGP51Service.addDevice(deviceData);
      if (result.status === 0) {
        await fetchDevices();
      } else {
        setError(result.cause || 'Failed to add device');
      }
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add device';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchDevices]);

  // Return all methods and state
  return {
    // Authentication
    authenticate,
    logout,
    disconnect,
    clearError,
    
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
    users,
    devices,
    
    // Data fetching
    fetchUsers,
    fetchDevices,
    
    // User management
    addUser,
    queryUserDetail: async (username: string) => {
      setError(null);
      try {
        return await unifiedGP51Service.queryUserDetail(username);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to query user detail';
        setError(errorMsg);
        throw err;
      }
    },
    editUser: async (username: string, profileData: any) => {
      setError(null);
      try {
        const result = await unifiedGP51Service.editUser(username, profileData);
        if (result.status === 0) {
          await fetchUsers();
        } else {
          setError(result.cause || 'Failed to edit user');
        }
        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to edit user';
        setError(errorMsg);
        throw err;
      }
    },
    deleteUser: async (username: string) => {
      setError(null);
      try {
        const result = await unifiedGP51Service.deleteUser(username);
        if (result.status === 0) {
          await fetchUsers();
        } else {
          setError(result.cause || 'Failed to delete user');
        }
        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to delete user';
        setError(errorMsg);
        throw err;
      }
    },
    
    // Device management
    queryMonitorList,
    addDevice,
    editDevice: async (deviceid: string, updates: any) => {
      setError(null);
      try {
        const result = await unifiedGP51Service.editDevice(deviceid, updates);
        if (result.status === 0) {
          await fetchDevices();
        } else {
          setError(result.cause || 'Failed to edit device');
        }
        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to edit device';
        setError(errorMsg);
        throw err;
      }
    },
    deleteDevice: async (deviceid: string) => {
      setError(null);
      try {
        const result = await unifiedGP51Service.deleteDevice(deviceid);
        if (result.status === 0) {
          await fetchDevices();
        } else {
          setError(result.cause || 'Failed to delete device');
        }
        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to delete device';
        setError(errorMsg);
        throw err;
      }
    },
    
    // Position tracking
    getLastPosition: async (deviceids: string[]) => {
      setError(null);
      try {
        return await unifiedGP51Service.getLastPosition(deviceids);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to get last position';
        setError(errorMsg);
        throw err;
      }
    },
    queryTracks: async (deviceid: string, startTime: string, endTime: string) => {
      setError(null);
      try {
        return await unifiedGP51Service.queryTracks(deviceid, startTime, endTime);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to query tracks';
        setError(errorMsg);
        throw err;
      }
    },
    
    // Vehicle commands
    sendCommand: async (deviceid: string, command: string, params: any[]) => {
      setError(null);
      try {
        return await unifiedGP51Service.sendCommand(deviceid, command, params);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to send command';
        setError(errorMsg);
        throw err;
      }
    },
    disableEngine: async (deviceid: string) => {
      setError(null);
      try {
        return await unifiedGP51Service.disableEngine(deviceid);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to disable engine';
        setError(errorMsg);
        throw err;
      }
    },
    enableEngine: async (deviceid: string) => {
      setError(null);
      try {
        return await unifiedGP51Service.enableEngine(deviceid);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to enable engine';
        setError(errorMsg);
        throw err;
      }
    },
    setSpeedLimit: async (deviceid: string, speedLimit: number, duration?: number) => {
      setError(null);
      try {
        return await unifiedGP51Service.setSpeedLimit(deviceid, speedLimit, duration);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to set speed limit';
        setError(errorMsg);
        throw err;
      }
    }
  };
}
