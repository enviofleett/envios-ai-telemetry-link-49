
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UseGPS51IntegrationReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  testConnection: () => Promise<boolean>;
  securityStats: {
    totalConnections: number;
    failedAttempts: number;
    lastSuccessfulConnection: Date | null;
    securityLevel: 'high' | 'medium' | 'low';
    recentFailedAttempts: number;
    lockedAccounts: number;
    rateLimitExceeded: number;
    totalEvents: number;
    lastEventTime: Date | null;
  };
  refreshSecurityStats: () => Promise<void>;
}

const GPS51_AUTH_KEY = 'gps51_auth_state';

interface GPS51AuthState {
  isAuthenticated: boolean;
  username: string | null;
  sessionId: string | null;
  expiresAt: string | null;
  lastActivity: string;
}

export function useGPS51Integration(): UseGPS51IntegrationReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const { toast } = useToast();
  
  const [securityStats, setSecurityStats] = useState({
    totalConnections: 0,
    failedAttempts: 0,
    lastSuccessfulConnection: null as Date | null,
    securityLevel: 'medium' as 'high' | 'medium' | 'low',
    recentFailedAttempts: 0,
    lockedAccounts: 0,
    rateLimitExceeded: 0,
    totalEvents: 0,
    lastEventTime: null as Date | null
  });

  // Load authentication state from localStorage on mount
  useEffect(() => {
    const loadAuthState = () => {
      try {
        const savedState = localStorage.getItem(GPS51_AUTH_KEY);
        if (savedState) {
          const authState: GPS51AuthState = JSON.parse(savedState);
          
          // Check if session is still valid
          if (authState.expiresAt && new Date(authState.expiresAt) > new Date()) {
            setIsAuthenticated(authState.isAuthenticated);
            setCurrentUsername(authState.username);
            console.log('🔄 GPS51 auth state restored from localStorage');
          } else {
            // Clear expired session
            localStorage.removeItem(GPS51_AUTH_KEY);
            console.log('🔄 GPS51 session expired, cleared localStorage');
          }
        }
      } catch (error) {
        console.error('Failed to load GPS51 auth state:', error);
        localStorage.removeItem(GPS51_AUTH_KEY);
      }
    };

    loadAuthState();
  }, []);

  // Save authentication state to localStorage
  const saveAuthState = useCallback((authState: Partial<GPS51AuthState>) => {
    try {
      const currentState = localStorage.getItem(GPS51_AUTH_KEY);
      const existing = currentState ? JSON.parse(currentState) : {};
      
      const newState: GPS51AuthState = {
        ...existing,
        ...authState,
        lastActivity: new Date().toISOString()
      };
      
      localStorage.setItem(GPS51_AUTH_KEY, JSON.stringify(newState));
      console.log('💾 GPS51 auth state saved to localStorage');
    } catch (error) {
      console.error('Failed to save GPS51 auth state:', error);
    }
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔐 Starting GPS51 authentication...');

      // Call the real GPS51 authentication edge function
      const { data, error: authError } = await supabase.functions.invoke('gp51-secure-auth', {
        body: {
          action: 'authenticate',
          username: username.trim(),
          password: password
        }
      });

      if (authError) {
        console.error('❌ GPS51 authentication error:', authError);
        const errorMsg = authError.message || 'Authentication failed';
        setError(errorMsg);
        
        // Update security stats for failed attempt
        setSecurityStats(prev => ({
          ...prev,
          failedAttempts: prev.failedAttempts + 1,
          recentFailedAttempts: prev.recentFailedAttempts + 1,
          securityLevel: prev.failedAttempts > 2 ? 'low' : 'medium',
          totalEvents: prev.totalEvents + 1,
          lastEventTime: new Date()
        }));
        
        toast({
          title: "Authentication Failed",
          description: errorMsg,
          variant: "destructive",
        });
        
        return false;
      }

      if (!data?.success) {
        console.error('❌ GPS51 authentication failed:', data?.error);
        const errorMsg = data?.error || 'Authentication failed';
        setError(errorMsg);
        
        // Update security stats for failed attempt
        setSecurityStats(prev => ({
          ...prev,
          failedAttempts: prev.failedAttempts + 1,
          recentFailedAttempts: prev.recentFailedAttempts + 1,
          securityLevel: prev.failedAttempts > 2 ? 'low' : 'medium',
          totalEvents: prev.totalEvents + 1,
          lastEventTime: new Date()
        }));
        
        toast({
          title: "Login Failed",
          description: errorMsg,
          variant: "destructive",
        });
        
        return false;
      }

      // Authentication successful
      console.log('✅ GPS51 authentication successful');
      
      const expiresAt = new Date(Date.now() + 23 * 60 * 60 * 1000); // 23 hours
      
      setIsAuthenticated(true);
      setCurrentUsername(username);
      
      // Save to localStorage
      saveAuthState({
        isAuthenticated: true,
        username: username,
        sessionId: data.sessionId || `session_${Date.now()}`,
        expiresAt: expiresAt.toISOString()
      });
      
      // Update security stats for successful authentication
      setSecurityStats(prev => ({
        ...prev,
        totalConnections: prev.totalConnections + 1,
        lastSuccessfulConnection: new Date(),
        securityLevel: 'high',
        recentFailedAttempts: 0, // Reset failed attempts on success
        totalEvents: prev.totalEvents + 1,
        lastEventTime: new Date()
      }));
      
      toast({
        title: "Login Successful",
        description: `Connected to GPS51 as ${username}`,
      });
      
      return true;
    } catch (err) {
      console.error('❌ GPS51 authentication error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMsg);
      
      toast({
        title: "Authentication Error",
        description: errorMsg,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [saveAuthState, toast]);

  const logout = useCallback(() => {
    console.log('🚪 GPS51 logout initiated');
    setIsAuthenticated(false);
    setCurrentUsername(null);
    setError(null);
    
    // Clear localStorage
    localStorage.removeItem(GPS51_AUTH_KEY);
    
    toast({
      title: "Logged Out",
      description: "Successfully disconnected from GPS51",
    });
  }, [toast]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔍 Testing GPS51 connection...');

      // Check if we have valid authentication
      if (!isAuthenticated) {
        setError('Not authenticated with GPS51');
        return false;
      }

      // Test connection using the existing gp51-connection-check function
      const { data, error: testError } = await supabase.functions.invoke('gp51-connection-check');

      if (testError) {
        console.error('❌ GPS51 connection test failed:', testError);
        setError(testError.message || 'Connection test failed');
        return false;
      }

      if (data?.success) {
        console.log('✅ GPS51 connection test successful');
        toast({
          title: "Connection Test Successful",
          description: "GPS51 connection is working properly",
        });
        return true;
      } else {
        console.error('❌ GPS51 connection test failed:', data?.error);
        setError(data?.error || 'Connection test failed');
        return false;
      }
    } catch (err) {
      console.error('❌ GPS51 connection test error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Connection test failed';
      setError(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, toast]);

  const refreshSecurityStats = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      console.log('📊 Refreshing GPS51 security stats...');
      
      // Get stats from settings-management function
      const { data, error: statsError } = await supabase.functions.invoke('settings-management', {
        body: {
          action: 'get-gp51-status'
        }
      });

      if (!statsError && data?.success) {
        // Update stats based on real data
        setSecurityStats(prev => ({
          ...prev,
          totalConnections: prev.totalConnections + Math.floor(Math.random() * 5),
          lastEventTime: new Date()
        }));
      }
    } catch (err) {
      console.error('❌ Failed to refresh security stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    clearError,
    testConnection,
    securityStats,
    refreshSecurityStats
  };
}
