import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { calculateMd5 } from '@/lib/crypto';

// Constants
const GP51_SESSION_KEY = 'gp51_session';
const API_TIMEOUT = 15000; // 15 seconds

// Helper function to get GP51 API URL with robust construction
const getGP51ApiUrl = (): string => {
  // Try to get from environment variable first, fallback to standard URL
  const baseUrl = process.env.GP51_BASE_URL || 'https://www.gps51.com';
  
  // Remove trailing slash if present
  const cleanUrl = baseUrl.replace(/\/$/, '');
  
  // Only append /webapi if it's not already present
  if (!cleanUrl.endsWith('/webapi')) {
    return cleanUrl + '/webapi';
  }
  
  return cleanUrl;
};

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

export const useGP51Auth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: false,
    error: null,
    isRestoringSession: true,
  });
  const { toast } = useToast();

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
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
          }));
        } else {
          console.log('🕒 session expired. Clearing.');
          localStorage.removeItem(GP51_SESSION_KEY);
        }
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
      localStorage.removeItem(GP51_SESSION_KEY);
    } finally {
      setAuthState(prev => ({ ...prev, isRestoringSession: false }));
    }
  }, []);
  
  const login = useCallback(async (username: string, password: string): Promise<AuthResult> => {
    console.log(`🔐 useGP51Auth: Starting login for ${username}`);
    setAuthState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null, 
      isRestoringSession: false 
    }));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
      const hashedPassword = calculateMd5(password);
      const trimmedUsername = username.trim();
      
      const apiUrl = getGP51ApiUrl();
      const url = new URL(apiUrl);
      url.searchParams.append('action', 'login');

      console.log(`📡 Sending login request to GP51 API: ${apiUrl}`);

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

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data: GP51LoginResponse = await response.json();
      console.log('📊 GP51 Login Response:', data);

      if (data.status !== 0 || !data.token) {
        throw new Error(data.cause || data.message || 'Invalid username or password');
      }

      console.log('✅ useGP51Auth: Login successful');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Token expires in 24 hours
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
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error 
        ? (error.name === 'AbortError' ? 'GP51 connection timed out. Please try again.' : error.message)
        : 'An unknown error occurred';
        
      console.error('❌ useGP51Auth: Login failed:', errorMessage);
      setAuthState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    } finally {
      clearTimeout(timeoutId);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, [toast]);

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
    if (!storedSession) return null;

    const session: GP51Session = JSON.parse(storedSession);
    if (new Date(session.expiresAt) < new Date()) {
        console.warn("Attempted to get an expired token.");
        await logout();
        return null;
    }
    return session.token;
  }, [logout]);

  // Health check can be expanded to ping an endpoint like 'getuserinfo'
  const healthCheck = useCallback(async (): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    const token = await getToken();
    if (!token) {
        setAuthState(prev => ({ ...prev, isLoading: false, error: 'Not authenticated.' }));
        return false;
    }
    // For now, we assume if token exists and is not expired, it's healthy.
    // A future improvement would be to call a lightweight API endpoint here.
    console.log('✅ Health check passed (local session valid).');
    setAuthState(prev => ({ ...prev, isLoading: false }));
    return true;
  }, [getToken]);

  return {
    ...authState,
    login,
    logout,
    getToken,
    healthCheck,
    clearError,
  };
};
