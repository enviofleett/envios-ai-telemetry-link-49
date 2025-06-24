
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SessionInfo {
  isLoading: boolean;
  isValid: boolean;
  username?: string;
  expiresAt?: Date;
  error?: string;
  warningLevel?: 'none' | 'info' | 'warning' | 'error';
  statusDetails?: any;
  requiresAuth?: boolean;
}

export const useGP51SessionRestoration = () => {
  const [sessionInfo, setSessionInfo] = useState<SessionInfo>({
    isLoading: true,
    isValid: false
  });
  const { toast } = useToast();

  const refreshSession = async () => {
    setSessionInfo(prev => ({ ...prev, isLoading: true }));
    
    try {
      console.log('🔄 [SESSION-HOOK] Starting enhanced session refresh...');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setSessionInfo({
          isLoading: false,
          isValid: false,
          error: 'No authenticated user',
          requiresAuth: true
        });
        return;
      }

      // Use the enhanced status endpoint
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { action: 'get-gp51-status' }
      });

      if (error) {
        console.error('❌ [SESSION-HOOK] Failed to check GP51 status:', error);
        setSessionInfo({
          isLoading: false,
          isValid: false,
          error: error.message,
          requiresAuth: true
        });
        return;
      }

      console.log('📊 [SESSION-HOOK] Enhanced status response:', data);

      const {
        connected,
        isExpired,
        username,
        expiresAt,
        message,
        warningLevel,
        statusDetails,
        requiresAuth
      } = data;

      // Show appropriate toast based on warning level
      if (warningLevel === 'warning' && connected) {
        toast({
          title: "Session Warning",
          description: message,
          variant: "default",
        });
      } else if (warningLevel === 'error' || !connected) {
        toast({
          title: "Authentication Required",
          description: message || 'Please re-authenticate with your GP51 credentials',
          variant: "destructive",
        });
      }

      setSessionInfo({
        isLoading: false,
        isValid: connected,
        username,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        error: connected ? undefined : message,
        warningLevel: warningLevel || 'none',
        statusDetails,
        requiresAuth: requiresAuth || !connected
      });

    } catch (error) {
      console.error('❌ [SESSION-HOOK] Session restoration error:', error);
      setSessionInfo({
        isLoading: false,
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        requiresAuth: true
      });
      
      toast({
        title: "Session Error",
        description: 'Failed to check GP51 session status',
        variant: "destructive",
      });
    }
  };

  const runHealthCheck = async () => {
    try {
      console.log('🏥 [SESSION-HOOK] Running session health check...');
      
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { action: 'session-health-check' }
      });

      if (error) {
        console.error('❌ [SESSION-HOOK] Health check failed:', error);
        toast({
          title: "Health Check Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      console.log('🏥 [SESSION-HOOK] Health check result:', data);
      
      toast({
        title: "Health Check Complete",
        description: data.message,
        variant: data.healthStatus === 'healthy' ? 'default' : 'destructive',
      });

      // Refresh session info after health check
      await refreshSession();

    } catch (error) {
      console.error('❌ [SESSION-HOOK] Health check error:', error);
      toast({
        title: "Health Check Error",
        description: 'Failed to run session health check',
        variant: "destructive",
      });
    }
  };

  const cleanupSessions = async () => {
    try {
      console.log('🧹 [SESSION-HOOK] Cleaning up sessions...');
      
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { action: 'clear-gp51-sessions' }
      });

      if (error) {
        console.error('❌ [SESSION-HOOK] Session cleanup failed:', error);
        toast({
          title: "Cleanup Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      console.log('🧹 [SESSION-HOOK] Sessions cleaned:', data);
      
      toast({
        title: "Sessions Cleared",
        description: `Successfully cleared ${data.clearedSessions} sessions`,
        variant: "default",
      });

      // Refresh session info after cleanup
      await refreshSession();

    } catch (error) {
      console.error('❌ [SESSION-HOOK] Session cleanup error:', error);
      toast({
        title: "Cleanup Error",
        description: 'Failed to clear sessions',
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  return { 
    sessionInfo, 
    refreshSession, 
    runHealthCheck, 
    cleanupSessions 
  };
};
