
import { useState, useEffect, useCallback } from 'react';
import { unifiedGP51Service, GP51ConnectionConfig, GP51Session, GP51ServiceResult, GP51User, GP51Device } from '@/services/gp51/UnifiedGP51Service';
import { useToast } from '@/hooks/use-toast';

export interface UseUnifiedGP51ServiceReturn {
  // Session state
  session: GP51Session | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;

  // Authentication
  authenticateAdmin: (config: GP51ConnectionConfig) => Promise<boolean>;
  refreshSession: () => Promise<boolean>;
  disconnect: () => Promise<void>;

  // User management
  addUser: (userData: GP51User) => Promise<GP51ServiceResult>;
  queryUserDetail: (username: string) => Promise<GP51ServiceResult>;

  // Device/Vehicle management
  addDevice: (deviceData: GP51Device) => Promise<GP51ServiceResult>;
  queryMonitorList: () => Promise<GP51ServiceResult>;

  // Real-time tracking
  getLastPosition: (deviceIds?: string[]) => Promise<GP51ServiceResult>;
  queryTracks: (deviceId: string, startTime: string, endTime: string) => Promise<GP51ServiceResult>;

  // Vehicle commands
  disableEngine: (deviceId: string) => Promise<GP51ServiceResult>;
  enableEngine: (deviceId: string) => Promise<GP51ServiceResult>;
  batchOperate: (deviceIds: string[], operation: string, params?: any) => Promise<GP51ServiceResult>;

  // Testing
  testConnection: () => Promise<boolean>;
  clearError: () => void;
}

export const useUnifiedGP51Service = (): UseUnifiedGP51ServiceReturn => {
  const [session, setSession] = useState<GP51Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Subscribe to session changes
    const unsubscribe = unifiedGP51Service.subscribeToSession((newSession) => {
      setSession(newSession);
    });

    return unsubscribe;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const authenticateAdmin = useCallback(async (config: GP51ConnectionConfig): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await unifiedGP51Service.authenticateAdmin(config.username, config.password);
      
      if (result.success) {
        toast({
          title: "Authentication Successful",
          description: `Connected to GP51 as ${config.username}`,
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

  const refreshSession = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const result = await unifiedGP51Service.refreshSession();
      
      if (result.success) {
        toast({
          title: "Session Refreshed",
          description: "GP51 session has been refreshed successfully",
        });
        return true;
      } else {
        setError(result.error || 'Session refresh failed');
        toast({
          title: "Session Refresh Failed",
          description: result.error || 'Session refresh failed',
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Session refresh error';
      setError(errorMessage);
      toast({
        title: "Session Refresh Error",
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

  const addUser = useCallback(async (userData: GP51User): Promise<GP51ServiceResult> => {
    setIsLoading(true);
    
    try {
      const result = await unifiedGP51Service.addUser(userData);
      
      if (result.success) {
        toast({
          title: "User Added",
          description: `User ${userData.username} has been added successfully`,
        });
      } else {
        toast({
          title: "Add User Failed",
          description: result.error || 'Failed to add user',
          variant: "destructive",
        });
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Add user error';
      toast({
        title: "Add User Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const queryUserDetail = useCallback(async (username: string): Promise<GP51ServiceResult> => {
    setIsLoading(true);
    
    try {
      return await unifiedGP51Service.queryUserDetail(username);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addDevice = useCallback(async (deviceData: GP51Device): Promise<GP51ServiceResult> => {
    setIsLoading(true);
    
    try {
      const result = await unifiedGP51Service.addDevice(deviceData);
      
      if (result.success) {
        toast({
          title: "Device Added",
          description: `Device ${deviceData.devicename} has been added successfully`,
        });
      } else {
        toast({
          title: "Add Device Failed",
          description: result.error || 'Failed to add device',
          variant: "destructive",
        });
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Add device error';
      toast({
        title: "Add Device Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const queryMonitorList = useCallback(async (): Promise<GP51ServiceResult> => {
    setIsLoading(true);
    
    try {
      return await unifiedGP51Service.queryMonitorList();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getLastPosition = useCallback(async (deviceIds?: string[]): Promise<GP51ServiceResult> => {
    setIsLoading(true);
    
    try {
      return await unifiedGP51Service.getLastPosition(deviceIds);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const queryTracks = useCallback(async (deviceId: string, startTime: string, endTime: string): Promise<GP51ServiceResult> => {
    setIsLoading(true);
    
    try {
      return await unifiedGP51Service.queryTracks(deviceId, startTime, endTime);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disableEngine = useCallback(async (deviceId: string): Promise<GP51ServiceResult> => {
    setIsLoading(true);
    
    try {
      const result = await unifiedGP51Service.disableEngine(deviceId);
      
      if (result.success) {
        toast({
          title: "Engine Disabled",
          description: `Engine disabled for device ${deviceId}`,
        });
      } else {
        toast({
          title: "Engine Disable Failed",
          description: result.error || 'Failed to disable engine',
          variant: "destructive",
        });
      }
      
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const enableEngine = useCallback(async (deviceId: string): Promise<GP51ServiceResult> => {
    setIsLoading(true);
    
    try {
      const result = await unifiedGP51Service.enableEngine(deviceId);
      
      if (result.success) {
        toast({
          title: "Engine Enabled",
          description: `Engine enabled for device ${deviceId}`,
        });
      } else {
        toast({
          title: "Engine Enable Failed",
          description: result.error || 'Failed to enable engine',
          variant: "destructive",
        });
      }
      
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const batchOperate = useCallback(async (deviceIds: string[], operation: string, params?: any): Promise<GP51ServiceResult> => {
    setIsLoading(true);
    
    try {
      const result = await unifiedGP51Service.batchOperate(deviceIds, operation, params);
      
      if (result.success) {
        toast({
          title: "Batch Operation Completed",
          description: `${operation} completed for ${deviceIds.length} devices`,
        });
      } else {
        toast({
          title: "Batch Operation Failed",
          description: result.error || 'Batch operation failed',
          variant: "destructive",
        });
      }
      
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const testConnection = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const result = await unifiedGP51Service.testConnection();
      
      if (result.success) {
        toast({
          title: "Connection Test Successful",
          description: "GP51 connection is working properly",
        });
        return true;
      } else {
        setError(result.error || 'Connection test failed');
        toast({
          title: "Connection Test Failed",
          description: result.error || 'Connection test failed',
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection test error';
      setError(errorMessage);
      toast({
        title: "Connection Test Error",
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
    isConnected: unifiedGP51Service.isSessionValid(),
    isLoading,
    error,
    authenticateAdmin,
    refreshSession,
    disconnect,
    addUser,
    queryUserDetail,
    addDevice,
    queryMonitorList,
    getLastPosition,
    queryTracks,
    disableEngine,
    enableEngine,
    batchOperate,
    testConnection,
    clearError,
  };
};
