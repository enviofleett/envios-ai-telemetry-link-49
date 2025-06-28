import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { GP51SessionManager } from '@/services/gp51/sessionManager';
import { gps51ProductionService } from '@/services/gps51/GPS51ProductionService';

export interface GPS51AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  username?: string;
  sessionData?: any;
}

export interface GPS51SecurityStats {
  isConnected: boolean;
  lastAuthentication: Date | null;
  sessionDuration: number;
  failedAttempts: number;
  lastValidation: Date | null;
  securityLevel?: string;
  totalConnections?: number;
  totalEvents?: number;
  recentFailedAttempts?: number;
  lastSuccessfulConnection?: Date | null;
  lockedAccounts?: number;
  rateLimitExceeded?: number;
  lastEventTime?: Date | null;
}

export const useGPS51Integration = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [securityStats, setSecurityStats] = useState<GPS51SecurityStats>({
    isConnected: false,
    lastAuthentication: null,
    sessionDuration: 0,
    failedAttempts: 0,
    lastValidation: null,
    securityLevel: 'normal',
    totalConnections: 0,
    totalEvents: 0,
    recentFailedAttempts: 0,
    lastSuccessfulConnection: null,
    lockedAccounts: 0,
    rateLimitExceeded: 0,
    lastEventTime: null
  });

  const clearError = useCallback(() => {
    setError('');
  }, []);

  // Initialize and check existing session
  useEffect(() => {
    const initializeSession = async () => {
      try {
        setIsLoading(true);
        
        // Check if there's an existing valid session
        const sessionValidation = await GP51SessionManager.validateSession();
        
        if (sessionValidation.valid && sessionValidation.session) {
          setIsAuthenticated(true);
          setUsername(sessionValidation.session.username);
          console.log('✅ [GPS51-INTEGRATION] Existing session validated');
        } else {
          console.log('ℹ️ [GPS51-INTEGRATION] No valid existing session');
        }
      } catch (error) {
        console.error('❌ [GPS51-INTEGRATION] Session initialization failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();
  }, []);

  const login = useCallback(async (usernameInput: string, password: string): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      setIsLoading(true);
      setError('');
      
      console.log('🔐 [GPS51-INTEGRATION] Attempting login...');
      
      const response = await gps51ProductionService.authenticate(usernameInput, password);
      
      if (response.success && response.token && response.username) {
        // Store session via session manager
        await GP51SessionManager.getInstance().setSessionFromAuth(response.username, response.token);
        
        setIsAuthenticated(true);
        setUsername(response.username);
        
        // Update security stats
        setSecurityStats(prev => ({
          ...prev,
          successfulLogins: prev.successfulLogins + 1,
          lastLoginTime: new Date(),
          lastEventTime: new Date()
        }));
        
        console.log('✅ [GPS51-INTEGRATION] Login successful');
        return { success: true };
      } else {
        const errorMsg = response.error || 'Authentication failed';
        setError(errorMsg);
        
        // Update security stats
        setSecurityStats(prev => ({
          ...prev,
          failedAttempts: prev.failedAttempts + 1,
          lastEventTime: new Date()
        }));
        
        console.error('❌ [GPS51-INTEGRATION] Login failed:', errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Login failed';
      setError(errorMsg);
      
      setSecurityStats(prev => ({
        ...prev,
        failedAttempts: prev.failedAttempts + 1,
        lastEventTime: new Date()
      }));
      
      console.error('❌ [GPS51-INTEGRATION] Login exception:', error);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      console.log('👋 [GPS51-INTEGRATION] Logging out...');
      
      // Clear session from database
      await GP51SessionManager.clearAllSessions();
      
      // Reset state
      setIsAuthenticated(false);
      setUsername('');
      setError('');
      
      console.log('✅ [GPS51-INTEGRATION] Logout successful');
    } catch (error) {
      console.error('❌ [GPS51-INTEGRATION] Logout failed:', error);
      // Even if logout fails, reset local state
      setIsAuthenticated(false);
      setUsername('');
    }
  }, []);

  const testConnection = useCallback(async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      setIsLoading(true);
      console.log('🧪 [GPS51-INTEGRATION] Testing connection...');
      
      const response = await gps51ProductionService.testConnection();
      
      if (response.success) {
        console.log('✅ [GPS51-INTEGRATION] Connection test successful');
        return { success: true };
      } else {
        const errorMsg = response.error || 'Connection test failed';
        console.error('❌ [GPS51-INTEGRATION] Connection test failed:', errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Connection test failed';
      console.error('❌ [GPS51-INTEGRATION] Connection test exception:', error);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔄 [GPS51-INTEGRATION] Refreshing session...');
      
      const refreshed = await GP51SessionManager.getInstance().refreshSession();
      
      if (refreshed) {
        console.log('✅ [GPS51-INTEGRATION] Session refreshed successfully');
        return true;
      } else {
        console.log('❌ [GPS51-INTEGRATION] Session refresh failed');
        setIsAuthenticated(false);
        setUsername('');
        return false;
      }
    } catch (error) {
      console.error('❌ [GPS51-INTEGRATION] Session refresh exception:', error);
      setIsAuthenticated(false);
      setUsername('');
      return false;
    }
  }, []);

  const refreshSecurityStats = useCallback(async () => {
    const sessionManager = GP51SessionManager.getInstance();
    const session = sessionManager.getSession();
    if (session) {
      const sessionDuration = Date.now() - session.lastActivity.getTime();
      setSecurityStats(prev => ({
        ...prev,
        sessionDuration,
        lastEventTime: new Date()
      }));
    }
  }, []);

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
};
