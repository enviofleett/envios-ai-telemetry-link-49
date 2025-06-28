
import { useState, useCallback } from 'react';
import { GPS51ApiClient, GPS51LoginRequest } from '@/services/gp51/GPS51ApiClient';
import { GPS51PasswordService } from '@/services/gp51/GPS51PasswordService';
import { GPS51SecurityService } from '@/services/gp51/GPS51SecurityService';
import { useToast } from '@/hooks/use-toast';

export interface UseGPS51IntegrationReturn {
  // Authentication state
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Authentication methods
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  testConnection: () => Promise<boolean>;
  
  // MD5 testing
  md5TestResults: any;
  runMD5Tests: () => void;
  
  // Security information
  securityStats: any;
  refreshSecurityStats: () => void;
  
  // Utility methods
  clearError: () => void;
}

export const useGPS51Integration = (): UseGPS51IntegrationReturn => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [md5TestResults, setMD5TestResults] = useState<any>(null);
  const [securityStats, setSecurityStats] = useState<any>(null);
  
  const { toast } = useToast();
  const apiClient = new GPS51ApiClient();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    if (isLoading) return false;
    
    console.log('🚀 Starting GPS51 authentication process...');
    
    setIsLoading(true);
    setError(null);

    try {
      // First, run MD5 tests to ensure our implementation is correct
      console.log('🧪 Running MD5 validation tests...');
      const testResults = GPS51PasswordService.runAllTests();
      setMD5TestResults(testResults);
      
      if (!testResults.summary.passed) {
        throw new Error('MD5 implementation validation failed. Cannot proceed with authentication.');
      }

      // Check if account is locked
      if (GPS51SecurityService.isAccountLocked(username)) {
        const remainingTime = GPS51SecurityService.getLockoutTimeRemaining(username);
        const minutes = Math.ceil(remainingTime / (1000 * 60));
        throw new Error(`Account temporarily locked. Try again in ${minutes} minutes.`);
      }

      const loginRequest: GPS51LoginRequest = {
        username: username.trim(),
        password: password,
        from: 'WEB',
        type: 'USER'
      };

      console.log('📡 Attempting GPS51 login...');
      const result = await apiClient.login(loginRequest);
      
      if (result.status === 0) {
        console.log('✅ GPS51 authentication successful');
        setIsAuthenticated(true);
        toast({
          title: "Login Successful",
          description: `Connected to GPS51 as ${result.username || username}`,
        });
        return true;
      } else {
        throw new Error(result.cause || `GPS51 authentication failed (status: ${result.status})`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      console.error('❌ GPS51 authentication failed:', errorMessage);
      setError(errorMessage);
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, toast]);

  const logout = useCallback(() => {
    apiClient.clearToken();
    setIsAuthenticated(false);
    setError(null);
    
    console.log('👤 GPS51 logout successful');
    toast({
      title: "Logged Out",
      description: "Successfully disconnected from GPS51",
    });
  }, [toast]);

  const testConnection = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔌 Testing GPS51 connection...');
      const result = await apiClient.testConnection();
      
      if (result.success) {
        console.log('✅ GPS51 connection test successful');
        toast({
          title: "Connection Successful",
          description: `GPS51 server responded in ${result.responseTime}ms`,
        });
        return true;
      } else {
        throw new Error(result.error || 'Connection test failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection test failed';
      console.error('❌ GPS51 connection test failed:', errorMessage);
      setError(errorMessage);
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const runMD5Tests = useCallback(() => {
    try {
      console.log('🧪 Running MD5 tests from UI...');
      const results = GPS51PasswordService.runAllTests();
      setMD5TestResults(results);
      
      if (results.summary.passed) {
        toast({
          title: "MD5 Tests Passed",
          description: `All ${results.summary.totalCount} tests passed successfully`,
        });
      } else {
        toast({
          title: "MD5 Tests Failed",
          description: `${results.summary.passCount}/${results.summary.totalCount} tests passed`,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('❌ MD5 test error:', err);
      toast({
        title: "MD5 Test Error",
        description: "Failed to run MD5 tests",
        variant: "destructive",
      });
    }
  }, [toast]);

  const refreshSecurityStats = useCallback(() => {
    const stats = GPS51SecurityService.getSecurityStats();
    setSecurityStats(stats);
  }, []);

  return {
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    testConnection,
    md5TestResults,
    runMD5Tests,
    securityStats,
    refreshSecurityStats,
    clearError,
  };
};
