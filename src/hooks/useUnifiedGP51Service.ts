
import { useState, useCallback, useEffect } from 'react';
import { 
  unifiedGP51Service, 
  type GP51User, 
  type GP51Device, 
  type GP51HealthStatus,
  type GP51AuthResponse,
  type GP51MonitorListResponse,
  type GP51ServiceResult,
  type GP51Position
} from '@/services/gp51/UnifiedGP51Service';
import { useToast } from '@/hooks/use-toast';

export interface UseUnifiedGP51ServiceReturn {
  // Authentication
  authenticate: (username: string, password: string) => Promise<GP51AuthResponse>;
  authenticateAdmin: (username: string, password: string) => Promise<GP51AuthResponse>;
  logout: () => Promise<void>;
  
  // Connection monitoring
  getConnectionHealth: () => Promise<GP51HealthStatus>;
  testConnection: () => Promise<GP51ServiceResult>;
  
  // State
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
  getLastPosition: (deviceids: string[]) => Promise<GP51ServiceResult<GP51Position[]>>;
  queryTracks: (deviceid: string, startTime: string, endTime: string) => Promise<any>;
  
  // Vehicle commands
  sendCommand: (deviceid: string, command: string, params: any[]) => Promise<any>;
  disableEngine: (deviceid: string) => Promise<any>;
  enableEngine: (deviceid: string) => Promise<any>;
  setSpeedLimit: (deviceid: string, speedLimit: number, duration?: number) => Promise<any>;
  
  // Utility
  clearError: () => void;
}

export function useUnifiedGP51Service(): UseUnifiedGP51ServiceReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<GP51User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<GP51User[]>([]);
  const [devices, setDevices] = useState<GP51Device[]>([]);
  const { toast } = useToast();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const authenticate = useCallback(async (username: string, password: string): Promise<GP51AuthResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await unifiedGP51Service.authenticate(username, password);
      if (result.status === 0) {
        setIsAuthenticated(true);
        setCurrentUser({ username, usertype: 11, showname: username });
        toast({
          title: "Authentication Successful",
          description: `Connected to GP51 as ${username}`,
        });
      } else {
        setError(result.cause || 'Authentication failed');
        toast({
          title: "Authentication Failed",
          description: result.cause || 'Authentication failed',
          variant: "destructive",
        });
      }
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMsg);
      toast({
        title: "Authentication Error",
        description: errorMsg,
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const authenticateAdmin = useCallback(async (username: string, password: string): Promise<GP51AuthResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await unifiedGP51Service.authenticateAdmin(username, password);
      if (result.status === 0) {
        setIsAuthenticated(true);
        setCurrentUser({ username, usertype: 3, showname: username });
        toast({
          title: "Admin Authentication Successful",
          description: `Connected to GP51 as admin: ${username}`,
        });
      } else {
        setError(result.cause || 'Admin authentication failed');
        toast({
          title: "Admin Authentication Failed",
          description: result.cause || 'Admin authentication failed',
          variant: "destructive",
        });
      }
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Admin authentication failed';
      setError(errorMsg);
      toast({
        title: "Admin Authentication Error",
        description: errorMsg,
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const usersList = await unifiedGP51Service.getUsers();
      setUsers(usersList);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch users';
      setError(errorMsg);
      toast({
        title: "Failed to fetch users",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchDevices = useCallback(async () => {
    setIsLoading(true);
    try {
      const devicesList = await unifiedGP51Service.getDevices();
      setDevices(devicesList);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch devices';
      setError(errorMsg);
      toast({
        title: "Failed to fetch devices",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const logout = useCallback(async () => {
    await unifiedGP51Service.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUsers([]);
    setDevices([]);
    setError(null);
    toast({
      title: "Logged Out",
      description: "Successfully disconnected from GP51",
    });
  }, [toast]);

  const getConnectionHealth = useCallback(async (): Promise<GP51HealthStatus> => {
    return await unifiedGP51Service.getConnectionHealth();
  }, []);

  const testConnection = useCallback(async (): Promise<GP51ServiceResult> => {
    return await unifiedGP51Service.testConnection();
  }, []);

  const queryMonitorList = useCallback(async (username?: string): Promise<GP51MonitorListResponse> => {
    return await unifiedGP51Service.queryMonitorList(username);
  }, []);

  const getLastPosition = useCallback(async (deviceids: string[]): Promise<GP51ServiceResult<GP51Position[]>> => {
    return await unifiedGP51Service.getLastPosition(deviceids);
  }, []);

  return {
    // Authentication
    authenticate,
    authenticateAdmin,
    logout,
    
    // Connection monitoring
    getConnectionHealth,
    testConnection,
    
    // State
    isAuthenticated,
    currentUser,
    isLoading,
    error,
    users,
    devices,
    
    // Data fetching
    fetchUsers,
    fetchDevices,
    
    // All service methods
    addUser: unifiedGP51Service.addUser.bind(unifiedGP51Service),
    queryUserDetail: unifiedGP51Service.queryUserDetail.bind(unifiedGP51Service),
    editUser: unifiedGP51Service.editUser.bind(unifiedGP51Service),
    deleteUser: unifiedGP51Service.deleteUser.bind(unifiedGP51Service),
    queryMonitorList,
    addDevice: unifiedGP51Service.addDevice.bind(unifiedGP51Service),
    editDevice: unifiedGP51Service.editDevice.bind(unifiedGP51Service),
    deleteDevice: unifiedGP51Service.deleteDevice.bind(unifiedGP51Service),
    getLastPosition,
    queryTracks: unifiedGP51Service.queryTracks.bind(unifiedGP51Service),
    sendCommand: unifiedGP51Service.sendCommand.bind(unifiedGP51Service),
    disableEngine: unifiedGP51Service.disableEngine.bind(unifiedGP51Service),
    enableEngine: unifiedGP51Service.enableEngine.bind(unifiedGP51Service),
    setSpeedLimit: unifiedGP51Service.setSpeedLimit.bind(unifiedGP51Service),
    
    // Utility
    clearError,
  };
}
