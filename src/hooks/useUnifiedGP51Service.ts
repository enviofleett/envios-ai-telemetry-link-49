
import { useState, useCallback, useEffect } from 'react';
import { 
  unifiedGP51Service, 
  GP51User, 
  GP51Session,
  GP51AuthResponse,
  GP51MonitorListResponse,
  GP51HealthStatus
} from '@/services/gp51/UnifiedGP51Service';

export interface UseUnifiedGP51ServiceReturn {
  authenticate: (username: string, password: string) => Promise<GP51AuthResponse>;
  authenticateAdmin: (username: string, password: string) => Promise<GP51AuthResponse>;
  logout: () => Promise<void>;
  disconnect: () => Promise<void>;
  getConnectionHealth: () => Promise<GP51HealthStatus>;
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
}

export function useUnifiedGP51Service(): UseUnifiedGP51ServiceReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<GP51User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<GP51Session | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [health, setHealth] = useState<GP51HealthStatus | null>(null);

  useEffect(() => {
    setSession(unifiedGP51Service.session);
    setIsConnected(unifiedGP51Service.isConnected);
    setIsAuthenticated(unifiedGP51Service.isConnected && unifiedGP51Service.session !== null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const authenticate = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await unifiedGP51Service.authenticate(username, password);
      if (result.status === 0) {
        setIsAuthenticated(true);
        setIsConnected(true);
        setSession(unifiedGP51Service.session);
        setCurrentUser({ username, usertype: 11, showname: username });
      } else {
        setError(result.cause || 'Authentication failed');
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
      throw err;
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

  const queryMonitorList = useCallback(async (username?: string) => {
    return await unifiedGP51Service.queryMonitorList(username);
  }, []);

  const addUser = useCallback(async (userData: any) => {
    return await unifiedGP51Service.addUser(userData);
  }, []);

  const addDevice = useCallback(async (deviceData: any) => {
    return await unifiedGP51Service.addDevice(deviceData);
  }, []);

  const sendCommand = useCallback(async (deviceid: string, command: string, params: any[]) => {
    return await unifiedGP51Service.sendCommand(deviceid, command, params);
  }, []);

  return {
    authenticate,
    authenticateAdmin,
    logout,
    disconnect,
    getConnectionHealth,
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
    health
  };
}
