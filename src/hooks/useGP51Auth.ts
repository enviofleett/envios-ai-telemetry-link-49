
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { md5 } from '@/lib/md5';

// Constants
const GP51_API_URL = 'https://www.gps51.com/webapi';
const GP51_SESSION_KEY = 'gp51_session';
const API_TIMEOUT = 15000; // 15 seconds
const TOKEN_RENEWAL_THRESHOLD = 3600000; // 1 hour in milliseconds

// Interfaces
interface GP51Session {
  username: string;
  token: string;
  expiresAt: string; // ISO string
}

export interface AuthResult {
  success: boolean;
  error?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  username?: string;
  tokenExpiresAt?: Date;
  isLoading: boolean;
  error: string | null;
  isRestoringSession: boolean;
}

interface GP51LoginResponse {
  status: number; // 0 for success, non-zero for error
  cause?: string; // Error message
  message?: string; // Alternative error message
  token?: string;
}

interface GP51UserInfoResponse {
  status: number;
  cause?: string;
  userinfo?: {
    username: string;
    [key: string]: any;
  };
}

export const useGP51Auth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: false,
    error: null,
    isRestoringSession: true,
  });
  const { toast } = useToast();

  const clearError = useCallback(() => {
    console.log('🔄 useGP51Auth: Clearing error state');
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  const setError = useCallback((error: string) => {
    console.error('❌ useGP51Auth: Setting error:', error);
    setAuthState(prev => ({ 
      ...prev, 
      error, 
      isLoading: false,
      isRestoringSession: false 
    }));
  }, []);

  const setLoading = useCallback((isLoading: boolean) => {
    console.log(`🔄 useGP51Auth: Setting loading state to ${isLoading}`);
    setAuthState(prev => ({ 
      ...prev, 
      isLoading,
      ...(isLoading ? { error: null } : {}) // Clear error when starting new operation
    }));
  }, []);
  
  // Effect for restoring session from localStorage on initial load
  useEffect(() => {
    console.log('🔍 useGP51Auth: Initializing and restoring session...');
    try {
      const storedSession = localStorage.getItem(GP51_SESSION_KEY);
      if (storedSession) {
        const session: GP51Session = JSON.parse(storedSession);
        const expiresAt = new Date(session.expiresAt);
        
        if (expiresAt > new Date()) {
          console.log(`✅ Restored session for ${session.username}. Expires at: ${expiresAt.toLocaleString()}`);
          setAuthState(prev => ({
            ...prev,
            isAuthenticated: true,
            username: session.username,
            tokenExpiresAt: expiresAt,
            isRestoringSession: false,
            error: null
          }));
        } else {
          console.log('⏰ Stored session expired. Clearing.');
          localStorage.removeItem(GP51_SESSION_KEY);
          setAuthState(prev => ({ ...prev, isRestoringSession: false }));
        }
      } else {
        console.log('📭 No stored session found');
        setAuthState(prev => ({ ...prev, isRestoringSession: false }));
      }
    } catch (error) {
      console.error('❌ Failed to restore session:', error);
      localStorage.removeItem(GP51_SESSION_KEY);
      setAuthState(prev => ({ 
        ...prev, 
        isRestoringSession: false,
        error: 'Failed to restore previous session'
      }));
    }
  }, []);

  // Proactive token renewal check
  const checkTokenRenewal = useCallback(async () => {
    const storedSession = localStorage.getItem(GP51_SESSION_KEY);
    if (!storedSession) return;

    try {
      const session: GP51Session = JSON.parse(storedSession);
      const expiresAt = new Date(session.expiresAt);
      const now = new Date();
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();

      console.log(`🕐 Token expires in ${Math.round(timeUntilExpiry / 60000)} minutes`);

      // If token expires within threshold, attempt renewal
      if (timeUntilExpiry < TOKEN_RENEWAL_THRESHOLD && timeUntilExpiry > 0) {
        console.log('🔄 Token approaching expiry, attempting proactive renewal...');
        // For GP51, we need to re-authenticate to get a new token
        // Note: This would require storing the password, which is not secure
        // Alternative: Just warn the user that they need to re-authenticate soon
        console.warn('⚠️ GP51 token approaching expiry. User will need to re-authenticate soon.');
      }
    } catch (error) {
      console.error('❌ Error checking token renewal:', error);
    }
  }, []);

  const validateGP51Response = useCallback((response: Response, data: any): { isValid: boolean; error?: string } => {
    console.log(`📊 Validating GP51 response: HTTP ${response.status}, GP51 status: ${data?.status}`);
    
    // Check HTTP status
    if (!response.ok) {
      return { 
        isValid: false, 
        error: `HTTP Error ${response.status}: ${response.statusText}` 
      };
    }

    // Check GP51 internal status
    if (data.status !== 0) {
      const gpError = data.cause || data.message || `GP51 Error (status: ${data.status})`;
      return { 
        isValid: false, 
        error: gpError 
      };
    }

    return { isValid: true };
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<AuthResult> => {
    console.log(`🔐 useGP51Auth: Starting login for ${username}`);
    setLoading(true);
    clearError();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('⏰ GP51 login request timed out');
      controller.abort();
    }, API_TIMEOUT);

    try {
      // Use proper MD5 hashing
      const hashedPassword = md5(password);
      const trimmedUsername = username.trim();
      
      console.log(`🔒 Password hashed with MD5: ${hashedPassword.substring(0, 8)}...`);
      
      const url = new URL(GP51_API_URL);
      url.searchParams.append('action', 'login');

      console.log('📡 Sending login request to GP51 via POST');

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: trimmedUsername,
          password: hashedPassword,
          from: 'WEB',
          type: 'USER',
        }),
        signal: controller.signal
      });

      const data: GP51LoginResponse = await response.json();
      console.log('📊 GP51 Login Response:', data);

      // Validate response using comprehensive validation
      const validation = validateGP51Response(response, data);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      if (!data.token) {
        throw new Error('No authentication token received from GP51');
      }

      console.log('✅ useGP51Auth: Login successful');
      
      // Calculate token expiry (GP51 tokens typically last 24 hours)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const session: GP51Session = {
        username: trimmedUsername,
        token: data.token,
        expiresAt: expiresAt.toISOString(),
      };

      localStorage.setItem(GP51_SESSION_KEY, JSON.stringify(session));
      setAuthState({
        isAuthenticated: true,
        username: trimmedUsername,
        tokenExpiresAt: expiresAt,
        isLoading: false,
        error: null,
        isRestoringSession: false,
      });

      toast({
        title: "Login Successful",
        description: `Connected to GP51 as ${trimmedUsername}.`,
      });

      // Schedule token renewal check
      setTimeout(checkTokenRenewal, TOKEN_RENEWAL_THRESHOLD / 2);

      return { success: true };

    } catch (error) {
      let errorMessage: string;
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'GP51 connection timed out. Please check your internet connection and try again.';
        } else {
          errorMessage = error.message;
        }
      } else {
        errorMessage = 'An unknown error occurred during authentication';
      }
        
      console.error('❌ useGP51Auth: Login failed:', errorMessage);
      setError(errorMessage);
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return { success: false, error: errorMessage };
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [toast, validateGP51Response, clearError, setError, setLoading, checkTokenRenewal]);

  const logout = useCallback(async (): Promise<AuthResult> => {
    console.log('👋 useGP51Auth: Logging out...');
    localStorage.removeItem(GP51_SESSION_KEY);
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isRestoringSession: false,
      username: undefined,
      tokenExpiresAt: undefined,
    });
    toast({
      title: "Logged Out",
      description: "Disconnected from GP51.",
    });
    return { success: true };
  }, [toast]);

  const getToken = useCallback(async (): Promise<string | null> => {
    const storedSession = localStorage.getItem(GP51_SESSION_KEY);
    if (!storedSession) {
      console.log('📭 No stored session for token retrieval');
      return null;
    }

    try {
      const session: GP51Session = JSON.parse(storedSession);
      const expiresAt = new Date(session.expiresAt);
      
      if (expiresAt < new Date()) {
        console.warn("⏰ Attempted to get an expired token. Logging out.");
        await logout();
        return null;
      }
      
      console.log(`🎟️ Retrieved valid token for ${session.username}`);
      return session.token;
    } catch (error) {
      console.error('❌ Error parsing stored session:', error);
      await logout();
      return null;
    }
  }, [logout]);

  // Enhanced health check that actually validates with GP51
  const healthCheck = useCallback(async (): Promise<boolean> => {
    console.log('🏥 useGP51Auth: Starting health check...');
    setLoading(true);
    clearError();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('⏰ Health check timed out');
      controller.abort();
    }, API_TIMEOUT);

    try {
      const token = await getToken();
      if (!token) {
        setError('Not authenticated with GP51');
        return false;
      }

      // Make a lightweight API call to validate the token
      const url = new URL(GP51_API_URL);
      url.searchParams.append('action', 'getuserinfo');
      url.searchParams.append('token', token);

      console.log('📡 Sending health check request to GP51...');

      const response = await fetch(url.toString(), {
        method: 'GET',
        signal: controller.signal
      });

      const data: GP51UserInfoResponse = await response.json();
      console.log('📊 GP51 Health Check Response:', data);

      const validation = validateGP51Response(response, data);
      if (!validation.isValid) {
        console.error('❌ Health check failed:', validation.error);
        setError(`Health check failed: ${validation.error}`);
        return false;
      }

      console.log('✅ Health check passed - GP51 connection is healthy');
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: null 
      }));
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? (error.name === 'AbortError' ? 'Health check timed out' : error.message)
        : 'Health check failed';
      
      console.error('❌ Health check error:', errorMessage);
      setError(`Health check failed: ${errorMessage}`);
      return false;
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [getToken, validateGP51Response, clearError, setError, setLoading]);

  return {
    ...authState,
    login,
    logout,
    getToken,
    healthCheck,
    clearError,
  };
};
