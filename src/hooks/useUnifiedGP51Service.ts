
import { useState, useEffect, useCallback } from 'react';
import { 
  unifiedGP51Service, 
  type GP51User, 
  type GP51Device, 
  type GP51Session, 
  type GP51HealthStatus, 
  type UnifiedGP51Response 
} from '@/services/gp51';
import { useToast } from '@/hooks/use-toast';

export interface UseUnifiedGP51ServiceReturn {
  // Connection state
  session: GP51Session | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Authentication methods
  authenticate: (username: string, password: string) => Promise<boolean>;
  authenticateAdmin: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  
  // Data fetching methods
  fetchMonitorList: () => Promise<{ users: GP51User[]; devices: GP51Device[] } | null>;
  fetchPositions: (deviceIds?: string[]) => Promise<any[] | null>;
  
  // Health monitoring
  checkHealth: () => Promise<GP51HealthStatus | null>;
  
  // Device commands
  sendCommand: (deviceId: string, command: string, parameters?: any[]) => Promise<boolean>;
  
  // Utility methods
  clearError: () => void;
}

export const useUnifiedGP51Service = (): UseUnifiedGP51ServiceReturn => {
  const [session, setSession] = useState<GP51Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Update session state when service session changes
  useEffect(() => {
    const updateSession = () => {
      const currentSession = unifiedGP51Service.session;
      setSession(currentSession);
    };

    // Check initial session
    updateSession();

    // Set up periodic session check
    const interval = setInterval(updateSession, 5000);
    return () => clearInterval(interval);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const authenticate = useCallback(async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await unifiedGP51Service.authenticate(username, password);
      
      if (result.success) {
        setSession(unifiedGP51Service.session);
        toast({
          title: "Authentication Successful",
          description: `Connected as ${username}`,
        });
        return true;
      } else {
        const errorMessage = result.error || 'Authentication failed';
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

  const authenticateAdmin = useCallback(async (username: string, password: string): Promise<boolean> => {
    return await authenticate(username, password);
  }, [authenticate]);

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      await unifiedGP51Service.disconnect();
      setSession(null);
      toast({
        title: "Logged Out",
        description: "Disconnected from GP51",
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

  const checkHealth = useCallback(async (): Promise<GP51HealthStatus | null> => {
    try {
      const health = await unifiedGP51Service.getConnectionHealth();
      return health;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Health check failed');
      return null;
    }
  }, []);

  const fetchMonitorList = useCallback(async (): Promise<{ users: GP51User[]; devices: GP51Device[] } | null> => {
    setIsLoading(true);
    
    try {
      const result = await unifiedGP51Service.queryMonitorList();
      
      if (result.success && result.data) {
        return result.data;
      } else {
        setError(result.error || 'Failed to fetch monitor list');
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Fetch error';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPositions = useCallback(async (deviceIds?: string[]): Promise<any[] | null> => {
    setIsLoading(true);
    
    try {
      const result = await unifiedGP51Service.getLastPositions(deviceIds);
      
      if (result.success && result.data) {
        return result.data.records;
      } else {
        setError(result.error || 'Failed to fetch positions');
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Fetch error';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendCommand = useCallback(async (deviceId: string, command: string, parameters: any[] = []): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const result = await unifiedGP51Service.sendCommand(deviceId, command, parameters);
      
      if (result.success) {
        toast({
          title: "Command Sent",
          description: `Command '${command}' sent to device ${deviceId}`,
        });
        return true;
      } else {
        setError(result.error || 'Command failed');
        toast({
          title: "Command Failed",
          description: result.error || 'Command execution failed',
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Command error';
      setError(errorMessage);
      toast({
        title: "Command Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    session,
    isConnected: unifiedGP51Service.isConnected && session !== null,
    isLoading,
    error,
    authenticate,
    authenticateAdmin,
    logout,
    fetchMonitorList,
    fetchPositions,
    checkHealth,
    sendCommand,
    clearError,
  };
};
