import { useState, useEffect, useCallback } from 'react';
import { gps51ProductionService } from '@/services/gps51/GPS51ProductionService';
import { gps51SessionManager } from '@/services/gp51/sessionManager';

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

  // Initialize and check existing session
  useEffect(() => {
    const initializeSession = async () => {
      try {
        console.log('🔄 [GPS51-INTEGRATION] Initializing session...');
        setIsLoading(true);
        setError(null);

        // Test existing connection
        const connectionTest = await gps51ProductionService.testConnection();
        
        if (connectionTest.success) {
          setIsAuthenticated(true);
          setSecurityStats(prev => ({
            ...prev,
            isConnected: true,
            lastValidation: new Date(),
            lastSuccessfulConnection: new Date(),
            totalConnections: (prev.totalConnections || 0) + 1
          }));
          
          console.log('✅ [GPS51-INTEGRATION] Existing session validated');
        } else {
          console.log('ℹ️ [GPS51-INTEGRATION] No valid session found');
          setIsAuthenticated(false);
          setSecurityStats(prev => ({
            ...prev,
            isConnected: false
          }));
        }

      } catch (err) {
        console.error('❌ [GPS51-INTEGRATION] Session initialization failed:', err);
        setError(err instanceof Error ? err.message : 'Session initialization failed');
        setIsAuthenticated(false);
        setSecurityStats(prev => ({
          ...prev,
          isConnected: false
        }));
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();
  }, []);

  const login = useCallback(async (usernameInput: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 [GPS51-INTEGRATION] Starting authentication...');
      setIsLoading(true);
      setError(null);

      const result = await gps51ProductionService.authenticate(usernameInput, password);

      if (result.success) {
        setIsAuthenticated(true);
        setUsername(result.username || usernameInput);
        setSecurityStats(prev => ({
          ...prev,
          isConnected: true,
          lastAuthentication: new Date(),
          sessionDuration: 0,
          failedAttempts: 0,
          lastValidation: new Date(),
          lastSuccessfulConnection: new Date(),
          totalConnections: (prev.totalConnections || 0) + 1,
          totalEvents: (prev.totalEvents || 0) + 1,
          lastEventTime: new Date()
        }));

        console.log('✅ [GPS51-INTEGRATION] Authentication successful');
        return true;
      } else {
        console.log('❌ [GPS51-INTEGRATION] Authentication failed:', result.error);
        setError(result.error || 'Authentication failed');
        setIsAuthenticated(false);
        
        // Update failed attempts
        setSecurityStats(prev => ({
          ...prev,
          failedAttempts: prev.failedAttempts + 1,
          recentFailedAttempts: (prev.recentFailedAttempts || 0) + 1,
          totalEvents: (prev.totalEvents || 0) + 1,
          lastEventTime: new Date()
        }));
        
        return false;
      }
    } catch (err) {
      console.error('❌ [GPS51-INTEGRATION] Authentication error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<boolean> => {
    try {
      console.log('👋 [GPS51-INTEGRATION] Logging out...');
      
      // Clear session from database
      await gps51SessionManager.clearAllSessions();
      
      // Reset state
      setIsAuthenticated(false);
      setUsername(null);
      setError(null);
      setSecurityStats({
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
      
      console.log('✅ [GPS51-INTEGRATION] Logout successful');
      return true;
    } catch (err) {
      console.error('❌ [GPS51-INTEGRATION] Logout error:', err);
      setError(err instanceof Error ? err.message : 'Logout failed');
      return false;
    }
  }, []);

  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🧪 [GPS51-INTEGRATION] Testing connection...');
      setError(null);

      const result = await gps51ProductionService.testConnection();

      if (result.success) {
        // Update security stats
        setSecurityStats(prev => ({
          ...prev,
          lastValidation: new Date(),
          lastSuccessfulConnection: new Date(),
          totalEvents: (prev.totalEvents || 0) + 1,
          lastEventTime: new Date()
        }));

        console.log('✅ [GPS51-INTEGRATION] Connection test successful');
        return true;
      } else {
        setError(result.error || 'Connection test failed');
        return false;
      }
    } catch (err) {
      console.error('❌ [GPS51-INTEGRATION] Connection test error:', err);
      setError(err instanceof Error ? err.message : 'Connection test failed');
      return false;
    }
  }, []);

  const refreshSecurityStats = useCallback(async () => {
    const session = gps51SessionManager.getSession();
    if (session) {
      const sessionDuration = Date.now() - session.lastActivity.getTime();
      setSecurityStats(prev => ({
        ...prev,
        sessionDuration
      }));
    }
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const result = await gps51ProductionService.testConnection();
      
      if (result.success) {
        // Update security stats
        setSecurityStats(prev => ({
          ...prev,
          lastValidation: new Date(),
          totalEvents: (prev.totalEvents || 0) + 1,
          lastEventTime: new Date()
        }));
        
        console.log('✅ [GPS51-INTEGRATION] Session refreshed');
        return true;
      } else {
        setError(result.error || 'Session refresh failed');
        return false;
      }
    } catch (err) {
      console.error('❌ [GPS51-INTEGRATION] Session refresh error:', err);
      setError(err instanceof Error ? err.message : 'Session refresh failed');
      return false;
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
    refreshSession
  };
};
