
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { calculateMd5 } from '@/lib/crypto';

// Constants
const GP51_API_URL = 'https://www.gps51.com/webapi';
const GP51_SESSION_KEY = 'gp51_session';
const API_TIMEOUT = 15000; // 15 seconds

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
          console.log(' session expired. Clearing.');
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
      // The password must be MD5 hashed. E.g., "Octopus360%" -> "9e023908f51272714a275466b033d526"
      const hashedPassword = calculateMd5(password);
      const trimmedUsername = username.trim();
      const params = new URLSearchParams({
        action: 'login',
        username: trimmedUsername,
        password: hashedPassword,
      });
      
      const url = `${GP51_API_URL}?${params.toString()}`;
      console.log('📡 Sending login request to GP51');

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Network error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 GP51 Login Response:', data);

      // Abnormal response handling: check GP51-specific status
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
      setAuthState(prev => ({ ...prev, error: errorMessage }));
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
