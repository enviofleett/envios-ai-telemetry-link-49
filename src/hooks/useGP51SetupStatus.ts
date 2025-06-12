
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAutoAuth } from './useAdminAutoAuth';

interface GP51SetupStatus {
  hasGP51Configured: boolean;
  isLoading: boolean;
  error: string | null;
  isAdminAutoAuth?: boolean;
}

export const useGP51SetupStatus = (): GP51SetupStatus => {
  const adminAutoAuth = useAdminAutoAuth();
  const [status, setStatus] = useState<GP51SetupStatus>({
    hasGP51Configured: false,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const checkGP51Setup = async () => {
      try {
        setStatus(prev => ({ ...prev, isLoading: true, error: null }));

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          setStatus({
            hasGP51Configured: false,
            isLoading: false,
            error: 'Authentication required'
          });
          return;
        }

        // Check if admin auto-auth is in progress
        if (adminAutoAuth.isAdmin && adminAutoAuth.isAutoAuthenticating) {
          setStatus({
            hasGP51Configured: false,
            isLoading: true,
            error: null,
            isAdminAutoAuth: true
          });
          return;
        }

        // If admin auto-auth completed successfully
        if (adminAutoAuth.isAdmin && adminAutoAuth.autoAuthCompleted) {
          setStatus({
            hasGP51Configured: true,
            isLoading: false,
            error: null,
            isAdminAutoAuth: true
          });
          return;
        }

        // Get user from envio_users table
        const { data: envioUser, error: envioUserError } = await supabase
          .from('envio_users')
          .select('id')
          .eq('email', user.email)
          .single();

        if (envioUserError || !envioUser) {
          setStatus({
            hasGP51Configured: false,
            isLoading: false,
            error: 'User profile not found'
          });
          return;
        }

        // Check for valid GP51 sessions
        const { data: sessions, error: sessionError } = await supabase
          .from('gp51_sessions')
          .select('username, token_expires_at')
          .eq('envio_user_id', envioUser.id)
          .order('token_expires_at', { ascending: false })
          .limit(1);

        if (sessionError) {
          setStatus({
            hasGP51Configured: false,
            isLoading: false,
            error: 'Database error checking GP51 status'
          });
          return;
        }

        const hasValidSession = sessions && sessions.length > 0 && 
          new Date(sessions[0].token_expires_at) > new Date();

        setStatus({
          hasGP51Configured: hasValidSession,
          isLoading: false,
          error: null,
          isAdminAutoAuth: adminAutoAuth.isAdmin
        });

      } catch (error) {
        console.error('Error checking GP51 setup status:', error);
        setStatus({
          hasGP51Configured: false,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          isAdminAutoAuth: adminAutoAuth.isAdmin
        });
      }
    };

    checkGP51Setup();
  }, [adminAutoAuth.isAutoAuthenticating, adminAutoAuth.autoAuthCompleted, adminAutoAuth.isAdmin]);

  // If admin auto-auth failed, still allow fallback to manual setup
  if (adminAutoAuth.isAdmin && adminAutoAuth.error && !adminAutoAuth.isAutoAuthenticating) {
    return {
      hasGP51Configured: false,
      isLoading: false,
      error: null, // Don't show admin auto-auth errors to user
      isAdminAutoAuth: true
    };
  }

  return {
    ...status,
    isAdminAutoAuth: adminAutoAuth.isAdmin
  };
};
