
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { gp51SessionManager } from '@/services/gp51/sessionManager';
import { gps51ProductionService } from '@/services/gp51/GPS51ProductionService';

export interface GPS51SecurityStats {
  totalLogins: number;
  failedLogins: number;
  sessionDuration: number;
  lastLoginTime: string | null;
  activeConnections: number;
  securityLevel: 'low' | 'medium' | 'high';
  // Added missing properties to fix build errors
  totalConnections: number;
  failedAttempts: number;
  totalEvents: number;
  recentFailedAttempts: number;
  lastSuccessfulConnection: string | null;
  lockedAccounts: number;
  rateLimitExceeded: number;
  lastEventTime: string | null;
}

export interface UseGPS51IntegrationReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string;
  username: string;
  securityStats: GPS51SecurityStats;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<boolean>;
  testConnection: () => Promise<boolean>;
  refreshSecurityStats: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  clearError: () => void;
}

const defaultSecurityStats: GPS51SecurityStats = {
  totalLogins: 0,
  failedLogins: 0,
  sessionDuration: 0,
  lastLoginTime: null,
  activeConnections: 0,
  securityLevel: 'low',
  totalConnections: 0,
  failedAttempts: 0,
  totalEvents: 0,
  recentFailedAttempts: 0,
  lastSuccessfulConnection: null,
  lockedAccounts: 0,
  rateLimitExceeded: 0,
  lastEventTime: null
};

export function useGPS51Integration(): UseGPS51IntegrationReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');
  const [securityStats, setSecurityStats] = useState<GPS51SecurityStats>(defaultSecurityStats);
  const { toast } = useToast();

  const clearError = useCallback(() => {
    setError('');
  }, []);

  const refreshSecurityStats = useCallback(async () => {
    try {
      // Get basic session info
      const activeSession = await gp51SessionManager.getInstance().getSession();
      
      if (activeSession) {
        setSecurityStats({
          totalLogins: 1,
          failedLogins: 0,
          sessionDuration: Math.floor((Date.now() - new Date(activeSession.created_at).getTime()) / 1000),
          lastLoginTime: activeSession.created_at,
          activeConnections: 1,
          securityLevel: 'medium',
          totalConnections: 1,
          failedAttempts: 0,
          totalEvents: 1,
          recentFailedAttempts: 0,
          lastSuccessfulConnection: activeSession.created_at,
          lockedAccounts: 0,
          rateLimitExceeded: 0,
          lastEventTime: activeSession.created_at
        });
      } else {
        setSecurityStats(defaultSecurityStats);
      }
    } catch (err) {
      console.error('Error refreshing security stats:', err);
      setSecurityStats(defaultSecurityStats);
    }
  }, []);

  const login = useCallback(async (usernameInput: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError('');
      
      console.log('🔐 Initiating GP51 authentication...');
      
      const result = await gps51ProductionService.authenticate(usernameInput, password);
      
      if (result.success && result.token) {
        setIsAuthenticated(true);
        setUsername(result.username || usernameInput);
        await refreshSecurityStats();
        
        toast({
          title: "Authentication Successful",
          description: `Welcome back, ${result.username || usernameInput}!`,
        });
        
        console.log('✅ GP51 authentication successful');
        return true;
      } else {
        const errorMsg = result.error || 'Authentication failed';
        setError(errorMsg);
        toast({
          title: "Authentication Failed",
          description: errorMsg,
          variant: "destructive"
        });
        console.error('❌ GP51 authentication failed:', errorMsg);
        return false;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Authentication error';
      setError(errorMsg);
      toast({
        title: "Authentication Error",
        description: errorMsg,
        variant: "destructive"
      });
      console.error('❌ GP51 authentication error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast, refreshSecurityStats]);

  const logout = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      await gp51SessionManager.getInstance().clearAllSessions();
      
      setIsAuthenticated(false);
      setUsername('');
      setSecurityStats(defaultSecurityStats);
      setError('');
      
      toast({
        title: "Logged Out",
        description: "Successfully logged out of GP51",
      });
      
      console.log('👋 GP51 logout successful');
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Logout failed';
      setError(errorMsg);
      console.error('❌ GP51 logout error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError('');
      
      const result = await gps51ProductionService.testConnection();
      
      if (result.success) {
        toast({
          title: "Connection Test Successful",
          description: "GP51 service is responding correctly",
        });
        return true;
      } else {
        const errorMsg = result.error || 'Connection test failed';
        setError(errorMsg);
        toast({
          title: "Connection Test Failed",
          description: errorMsg,
          variant: "destructive"
        });
        return false;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Connection test error';
      setError(errorMsg);
      toast({
        title: "Connection Test Error",
        description: errorMsg,
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const validation = await gp51SessionManager.getInstance().validateSession();
      
      if (validation.valid && validation.session) {
        setIsAuthenticated(true);
        setUsername(validation.session.username);
        await refreshSecurityStats();
        return true;
      } else {
        setIsAuthenticated(false);
        setUsername('');
        setSecurityStats(defaultSecurityStats);
        if (validation.error) {
          setError(validation.error);
        }
        return false;
      }
    } catch (err) {
      console.error('❌ Session refresh error:', err);
      setIsAuthenticated(false);
      return false;
    }
  }, [refreshSecurityStats]);

  // Initialize session state on mount
  useEffect(() => {
    const initializeSession = async () => {
      setIsLoading(true);
      try {
        await refreshSession();
      } catch (err) {
        console.error('Session initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();
  }, [refreshSession]);

  return {
    isAuthenticated,
    isLoading,
    error,
    username,
    securityStats,
    login,
    logout,
    testConnection,
    refreshSecurityStats,
    refreshSession,
    clearError
  };
}
