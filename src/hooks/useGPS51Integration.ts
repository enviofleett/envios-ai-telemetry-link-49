
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { gps51SessionManager } from '@/services/gps51/GPS51SessionManager';

export interface GPS51AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  username?: string;
  sessionData?: any;
}

export interface GPS51SecurityStats {
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
  const [authState, setAuthState] = useState<GPS51AuthState>({
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  const [securityStats, setSecurityStats] = useState<GPS51SecurityStats>({
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
        console.log('🔄 Initializing GPS51 session...');
        
        // Initialize the session manager
        await gps51SessionManager.initialize();
        
        // Check if we have a valid session
        const isValid = await gps51SessionManager.validateSession();
        
        if (isValid) {
          const sessionData = gps51SessionManager.getSession();
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            error: null,
            username: sessionData?.username,
            sessionData
          });
          
          // Update security stats
          setSecurityStats(prev => ({
            ...prev,
            lastAuthentication: sessionData?.lastActivity || null,
            lastValidation: new Date(),
            lastSuccessfulConnection: new Date(),
            totalConnections: (prev.totalConnections || 0) + 1
          }));
          
          console.log('✅ GPS51 session restored successfully');
        } else {
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
          console.log('ℹ️ No valid GPS51 session found');
        }
      } catch (error) {
        console.error('❌ Failed to initialize GPS51 session:', error);
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Session initialization failed'
        });
      }
    };

    initializeSession();
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      console.log('🔐 Attempting GPS51 login...');
      
      // Authenticate with GP51 using the edge function
      const { data, error } = await supabase.functions.invoke('gp51-secure-auth', {
        body: {
          action: 'authenticate',
          username,
          password
        }
      });

      if (error || !data.success) {
        throw new Error(data?.error || error?.message || 'Authentication failed');
      }

      console.log('✅ GPS51 authentication successful');

      // Store session data in GPS51SessionManager
      await gps51SessionManager.setSessionFromAuth(username, data.token);

      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        error: null,
        username: data.username,
        sessionData: data
      });

      // Update security stats
      setSecurityStats(prev => ({
        ...prev,
        lastAuthentication: new Date(),
        sessionDuration: 0,
        failedAttempts: 0,
        lastValidation: new Date(),
        lastSuccessfulConnection: new Date(),
        totalConnections: (prev.totalConnections || 0) + 1,
        totalEvents: (prev.totalEvents || 0) + 1,
        lastEventTime: new Date()
      }));

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      console.error('❌ GPS51 login failed:', errorMessage);
      
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage
      });

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
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log('👋 Logging out of GPS51...');
      await gps51SessionManager.clearSession();
      
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
      
      // Reset security stats
      setSecurityStats({
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
      
      console.log('✅ GPS51 logout successful');
    } catch (error) {
      console.error('❌ GPS51 logout error:', error);
    }
  }, []);

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const session = gps51SessionManager.getSession();
      if (!session || !session.token) {
        throw new Error('No GPS51 session available for testing');
      }

      // Test connection using the gp51-service edge function
      const { data, error } = await supabase.functions.invoke('gp51-service', {
        body: {
          action: 'querymonitorlist',
          token: session.token
        }
      });

      if (error || data.status !== 0) {
        throw new Error(data?.cause || error?.message || 'Connection test failed');
      }

      console.log('✅ GPS51 connection test successful');
      
      // Update security stats
      setSecurityStats(prev => ({
        ...prev,
        lastValidation: new Date(),
        lastSuccessfulConnection: new Date(),
        totalEvents: (prev.totalEvents || 0) + 1,
        lastEventTime: new Date()
      }));

      return true;
    } catch (error) {
      console.error('❌ GPS51 connection test failed:', error);
      return false;
    } finally {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const refreshSecurityStats = useCallback(async () => {
    const session = gps51SessionManager.getSession();
    if (session) {
      const sessionDuration = Date.now() - session.lastActivity.getTime();
      setSecurityStats(prev => ({
        ...prev,
        sessionDuration: Math.floor(sessionDuration / 1000), // in seconds
        lastValidation: new Date()
      }));
    }
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const refreshed = await gps51SessionManager.refreshSession();
      if (refreshed) {
        const sessionData = gps51SessionManager.getSession();
        setAuthState(prev => ({
          ...prev,
          sessionData,
          error: null
        }));

        // Update security stats
        setSecurityStats(prev => ({
          ...prev,
          lastValidation: new Date(),
          totalEvents: (prev.totalEvents || 0) + 1,
          lastEventTime: new Date()
        }));
      }
      return refreshed;
    } catch (error) {
      console.error('❌ Session refresh failed:', error);
      return false;
    }
  }, []);

  return {
    ...authState,
    securityStats,
    login,
    logout,
    clearError,
    testConnection,
    refreshSecurityStats,
    refreshSession
  };
};
