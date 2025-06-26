
import { useState, useEffect, useCallback } from 'react';
import { unifiedGP51Service, GP51ServiceResult } from '@/services/gp51/UnifiedGP51Service';
import { useToast } from '@/hooks/use-toast';

export interface GP51ConnectionConfig {
  username: string;
  password: string;
  apiUrl?: string;
}

export interface GP51Session {
  username: string;
  token: string;
  expiresAt: string;
  isValid: boolean;
}

export interface GP51HealthStatus {
  isConnected: boolean;
  isReallyConnected: boolean;
  sessionValid: boolean;
  apiReachable: boolean;
  dataFlowing: boolean;
  lastCheck: Date;
  deviceCount?: number;
  errorMessage?: string;
}

export interface UseUnifiedGP51ServiceReturn {
  // Session state
  session: GP51Session | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Authentication methods
  authenticate: (config: GP51ConnectionConfig) => Promise<boolean>;
  disconnect: () => Promise<void>;
  
  // Connection monitoring
  getConnectionHealth: () => Promise<GP51HealthStatus>;
  testConnection: () => Promise<GP51ServiceResult>;
  
  // User management
  addUser: (userData: any) => Promise<GP51ServiceResult>;
  queryUsers: () => Promise<GP51ServiceResult>;
  
  // Device management
  addDevice: (deviceData: any) => Promise<GP51ServiceResult>;
  queryDevices: () => Promise<GP51ServiceResult>;
  
  // Position tracking
  getLastPosition: (deviceIds: string[]) => Promise<GP51ServiceResult>;
  
  // Utility methods
  clearError: () => void;
}

export const useUnifiedGP51Service = (): UseUnifiedGP51ServiceReturn => {
  const [session, setSession] = useState<GP51Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const authenticate = useCallback(async (config: GP51ConnectionConfig): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await unifiedGP51Service.authenticate(config.username, config.password, config.apiUrl);
      
      if (result.success) {
        setSession({
          username: config.username,
          token: result.data?.token || '',
          expiresAt: result.data?.expiresAt || '',
          isValid: true
        });

        toast({
          title: "Authentication Successful",
          description: `Connected as ${config.username}`,
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

  const disconnect = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      await unifiedGP51Service.disconnect();
      setSession(null);
      setError(null);
      
      toast({
        title: "Disconnected",
        description: "Successfully disconnected from GP51",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Disconnect error';
      setError(errorMessage);
      
      toast({
        title: "Disconnect Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getConnectionHealth = useCallback(async (): Promise<GP51HealthStatus> => {
    try {
      const testResult = await unifiedGP51Service.testConnection();
      const deviceResult = await unifiedGP51Service.getDevices();
      
      const health: GP51HealthStatus = {
        isConnected: testResult.success,
        isReallyConnected: testResult.success && deviceResult.success,
        sessionValid: session?.isValid || false,
        apiReachable: testResult.success,
        dataFlowing: deviceResult.success,
        lastCheck: new Date(),
        deviceCount: deviceResult.data?.devices?.length || 0,
        errorMessage: testResult.error || deviceResult.error
      };

      return health;
    } catch (error) {
      return {
        isConnected: false,
        isReallyConnected: false,
        sessionValid: false,
        apiReachable: false,
        dataFlowing: false,
        lastCheck: new Date(),
        deviceCount: 0,
        errorMessage: error instanceof Error ? error.message : 'Health check failed'
      };
    }
  }, [session]);

  const testConnection = useCallback(async (): Promise<GP51ServiceResult> => {
    setIsLoading(true);
    
    try {
      const result = await unifiedGP51Service.testConnection();
      
      if (!result.success) {
        setError(result.error || 'Connection test failed');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection test error';
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addUser = useCallback(async (userData: any): Promise<GP51ServiceResult> => {
    setIsLoading(true);
    
    try {
      const result = await unifiedGP51Service.addUser(userData);
      
      if (result.success) {
        toast({
          title: "User Added",
          description: "User has been successfully added",
        });
      } else {
        setError(result.error || 'Failed to add user');
        toast({
          title: "Add User Failed",
          description: result.error || 'Failed to add user',
          variant: "destructive",
        });
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Add user error';
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const queryUsers = useCallback(async (): Promise<GP51ServiceResult> => {
    setIsLoading(true);
    
    try {
      const result = await unifiedGP51Service.getUsers();
      
      if (!result.success) {
        setError(result.error || 'Failed to fetch users');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Query users error';
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addDevice = useCallback(async (deviceData: any): Promise<GP51ServiceResult> => {
    setIsLoading(true);
    
    try {
      const result = await unifiedGP51Service.addDevice(deviceData);
      
      if (result.success) {
        toast({
          title: "Device Added",
          description: "Device has been successfully added",
        });
      } else {
        setError(result.error || 'Failed to add device');
        toast({
          title: "Add Device Failed",
          description: result.error || 'Failed to add device',
          variant: "destructive",
        });
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Add device error';
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const queryDevices = useCallback(async (): Promise<GP51ServiceResult> => {
    setIsLoading(true);
    
    try {
      const result = await unifiedGP51Service.getDevices();
      
      if (!result.success) {
        setError(result.error || 'Failed to fetch devices');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Query devices error';
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getLastPosition = useCallback(async (deviceIds: string[]): Promise<GP51ServiceResult> => {
    setIsLoading(true);
    
    try {
      const result = await unifiedGP51Service.getLastPosition(deviceIds);
      
      if (!result.success) {
        setError(result.error || 'Failed to get positions');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Get position error';
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const isValid = await unifiedGP51Service.validateSession();
        if (isValid.success) {
          setSession({
            username: isValid.data?.username || '',
            token: isValid.data?.token || '',
            expiresAt: isValid.data?.expiresAt || '',
            isValid: true
          });
        }
      } catch (error) {
        console.log('No existing session found');
      }
    };

    checkSession();
  }, []);

  return {
    session,
    isConnected: session?.isValid || false,
    isLoading,
    error,
    authenticate,
    disconnect,
    getConnectionHealth,
    testConnection,
    addUser,
    queryUsers,
    addDevice,
    queryDevices,
    getLastPosition,
    clearError,
  };
};
