
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ConsolidatedGP51AuthResult {
  success: boolean;
  error?: string;
  token?: string;
  username?: string;
  apiUrl?: string;
}

export const useConsolidatedGP51Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const login = useCallback(async (
    username: string, 
    password: string
  ): Promise<ConsolidatedGP51AuthResult> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔑 [CONSOLIDATED-AUTH] Starting GP51 authentication...');
      
      const { data, error: invokeError } = await supabase.functions.invoke('gp51-hybrid-auth', {
        body: {
          action: 'authenticate',
          username,
          password
        }
      });

      if (invokeError) {
        console.error('❌ [CONSOLIDATED-AUTH] Edge function error:', invokeError);
        const errorMessage = `Authentication failed: ${invokeError.message}`;
        setError(errorMessage);
        toast({
          title: "Authentication Error",
          description: errorMessage,
          variant: "destructive",
        });
        return { success: false, error: errorMessage };
      }

      if (!data?.success) {
        console.error('❌ [CONSOLIDATED-AUTH] Authentication failed:', data?.error);
        const errorMessage = data?.error || 'Authentication failed';
        setError(errorMessage);
        toast({
          title: "Login Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return { success: false, error: errorMessage };
      }

      console.log('✅ [CONSOLIDATED-AUTH] Authentication successful');
      toast({
        title: "Login Successful",
        description: `Connected to GP51 as ${data.username}`,
      });

      return {
        success: true,
        token: data.token,
        username: data.username,
        apiUrl: data.apiUrl
      };

    } catch (error) {
      console.error('❌ [CONSOLIDATED-AUTH] Unexpected error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setError(errorMessage);
      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const checkStoredCredentials = useCallback(async (username: string): Promise<boolean> => {
    if (username !== 'octopus') return false;

    try {
      console.log('🔍 [CONSOLIDATED-AUTH] Checking for stored admin credentials...');
      
      const { data, error } = await supabase.functions.invoke('gp51-connection-check');
      
      if (!error && data?.success && data?.username === 'octopus') {
        console.log('✅ [CONSOLIDATED-AUTH] Found stored admin credentials');
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ [CONSOLIDATED-AUTH] Error checking stored credentials:', error);
      return false;
    }
  }, []);

  return {
    login,
    checkStoredCredentials,
    isLoading,
    error,
    clearError,
  };
};
