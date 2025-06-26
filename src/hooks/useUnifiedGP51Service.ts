
import { useState, useEffect, useCallback } from 'react';
import { unifiedGP51Service, type GP51Session, type GP51HealthStatus, type GP51User, type GP51Device } from '@/services/gp51';
import { useToast } from '@/hooks/use-toast';

export interface UseUnifiedGP51ServiceReturn {
  session: GP51Session | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  health: GP51HealthStatus | null;
  
  // Auth methods
  authenticate: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  disconnect: () => Promise<void>;
  
  // Health and connection
  refreshHealth: () => Promise<void>;
  getConnectionHealth: () => Promise<GP51HealthStatus>;
  testConnection: () => Promise<{ success: boolean; data?: any; error?: string }>;
  
  // User management
  isAuthenticated: boolean;
  currentUser: GP51User | null;
  users: GP51User[];
  devices: GP51Device[];
  fetchUsers: () => Promise<void>;
  fetchDevices: () => Promise<void>;
  
  // Utility
  clearError: () => void;
}

export const useUnifiedGP51Service = (): UseUnifiedGP51ServiceReturn => {
  const [session, setSession] = useState<GP51Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<GP51HealthStatus | null>(null);
  const [users, setUsers] = useState<GP51User[]>([]);
  const [devices, setDevices] = useState<GP51Device[]>([]);
  const [currentUser, setCurrentUser] = useState<GP51User | null>(null);
  const { toast } = useToast();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const authenticate = useCallback(async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await unifiedGP51Service.authenticate(username, password);
      
      if (result.status === 0) {
        setSession(unifiedGP51Service.session);
        setCurrentUser({ username, usertype: 1, showname: username });
        toast({
          title: "Authentication Successful",
          description: `Connected to GP51 as ${username}`,
        });
        return true;
      } else {
        const errorMessage = result.cause || 'Authentication failed';
        setError(errorMessage);
        toast({
          title: "Authentication Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication error';
      setError(errorMessage);
      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      await unifiedGP51Service.logout();
      setSession(null);
      setCurrentUser(null);
      setHealth(null);
      setUsers([]);
      setDevices([]);
      toast({
        title: "Logged Out",
        description: "Successfully logged out from GP51",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout error';
      setError(errorMessage);
      toast({
        title: "Logout Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const disconnect = useCallback(async (): Promise<void> => {
    try {
      await unifiedGP51Service.disconnect();
      setSession(null);
      setCurrentUser(null);
      setHealth(null);
      setUsers([]);
      setDevices([]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Disconnect error';
      setError(errorMessage);
    }
  }, []);

  const refreshHealth = useCallback(async (): Promise<void> => {
    try {
      const healthStatus = await unifiedGP51Service.getConnectionHealth();
      setHealth(healthStatus);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Health check failed';
      setError(errorMessage);
    }
  }, []);

  const getConnectionHealth = useCallback((): GP51HealthStatus => {
    return health || {
      isConnected: false,
      lastPingTime: new Date(),
      responseTime: -1,
      tokenValid: false,
      sessionValid: false,
      activeDevices: 0,
      errors: [],
      lastCheck: new Date()
    };
  }, [health]);

  const testConnection = useCallback(async (): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const healthStatus = await unifiedGP51Service.getConnectionHealth();
      return {
        success: healthStatus.isConnected,
        data: healthStatus,
        error: healthStatus.isConnected ? undefined : 'Connection test failed'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }, []);

  const fetchUsers = useCallback(async (): Promise<void> => {
    try {
      const userList = await unifiedGP51Service.getUsers();
      setUsers(userList);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch users';
      setError(errorMessage);
    }
  }, []);

  const fetchDevices = useCallback(async (): Promise<void> => {
    try {
      const deviceList = await unifiedGP51Service.getDevices();
      setDevices(deviceList);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch devices';
      setError(errorMessage);
    }
  }, []);

  useEffect(() => {
    setSession(unifiedGP51Service.session);
    if (unifiedGP51Service.isConnected) {
      refreshHealth();
    }
  }, [refreshHealth]);

  return {
    session,
    isConnected: unifiedGP51Service.isConnected,
    isLoading,
    error,
    health,
    
    // Auth methods
    authenticate,
    logout,
    disconnect,
    
    // Health and connection
    refreshHealth,
    getConnectionHealth,
    testConnection,
    
    // User management
    isAuthenticated: session !== null,
    currentUser,
    users,
    devices,
    fetchUsers,
    fetchDevices,
    
    // Utility
    clearError,
  };
};
