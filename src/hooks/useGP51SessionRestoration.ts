
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SessionInfo {
  isLoading: boolean;
  isValid: boolean;
  username?: string;
  expiresAt?: Date;
  error?: string;
}

export const useGP51SessionRestoration = () => {
  const [sessionInfo, setSessionInfo] = useState<SessionInfo>({
    isLoading: true,
    isValid: false
  });

  const refreshSession = async () => {
    setSessionInfo(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setSessionInfo({
          isLoading: false,
          isValid: false,
          error: 'No authenticated user'
        });
        return;
      }

      // Check for active GP51 session - using correct column names
      const { data: sessions, error } = await supabase
        .from('gp51_sessions')
        .select('gp51_token, username, token_expires_at')
        .eq('envio_user_id', user.id)
        .gt('token_expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Failed to check GP51 session:', error);
        setSessionInfo({
          isLoading: false,
          isValid: false,
          error: error.message
        });
        return;
      }

      if (sessions && sessions.length > 0) {
        const session = sessions[0];
        setSessionInfo({
          isLoading: false,
          isValid: true,
          username: session.username,
          expiresAt: new Date(session.token_expires_at)
        });
      } else {
        setSessionInfo({
          isLoading: false,
          isValid: false,
          error: 'No valid GP51 session found'
        });
      }
    } catch (error) {
      console.error('Session restoration error:', error);
      setSessionInfo({
        isLoading: false,
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  return { sessionInfo, refreshSession };
};
