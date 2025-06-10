
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { gp51StatusCoordinator } from '@/services/gp51/statusCoordinator';

export interface GP51SessionInfo {
  isValid: boolean;
  username?: string;
  expiresAt?: Date;
  isLoading: boolean;
  error?: string;
}

export const useGP51SessionRestoration = () => {
  const [sessionInfo, setSessionInfo] = useState<GP51SessionInfo>({
    isValid: false,
    isLoading: true
  });

  const restoreSessionFromDatabase = async () => {
    console.log('🔄 Restoring GP51 session from database...');
    
    try {
      // Check authentication state first
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session) {
        console.log('❌ No valid authentication session found');
        setSessionInfo({
          isValid: false,
          isLoading: false,
          error: 'Authentication required'
        });
        return;
      }

      // Get user from envio_users table
      const { data: envioUser, error: userError } = await supabase
        .from('envio_users')
        .select('id')
        .eq('email', session.user.email)
        .single();

      if (userError || !envioUser) {
        console.log('❌ User profile not found');
        setSessionInfo({
          isValid: false,
          isLoading: false,
          error: 'User profile not found'
        });
        return;
      }

      // Get latest GP51 session
      const { data: gp51Sessions, error: sessionError } = await supabase
        .from('gp51_sessions')
        .select('username, gp51_token, token_expires_at')
        .eq('envio_user_id', envioUser.id)
        .order('token_expires_at', { ascending: false })
        .limit(1);

      if (sessionError) {
        console.error('❌ Error fetching GP51 sessions:', sessionError);
        setSessionInfo({
          isValid: false,
          isLoading: false,
          error: 'Database error'
        });
        return;
      }

      if (!gp51Sessions || gp51Sessions.length === 0) {
        console.log('⚠️ No GP51 sessions found');
        setSessionInfo({
          isValid: false,
          isLoading: false
        });
        // Update status coordinator to show disconnected state
        gp51StatusCoordinator.reportMonitorStatus(false, 'No GP51 sessions configured');
        return;
      }

      const gp51Session = gp51Sessions[0];
      const expiresAt = new Date(gp51Session.token_expires_at);
      const now = new Date();

      if (expiresAt <= now) {
        console.log('⏰ GP51 session expired');
        setSessionInfo({
          isValid: false,
          isLoading: false,
          username: gp51Session.username,
          error: 'Session expired'
        });
        // Update status coordinator to show expired state
        gp51StatusCoordinator.reportMonitorStatus(false, 'GP51 session expired');
        return;
      }

      console.log('✅ Valid GP51 session restored:', gp51Session.username);
      setSessionInfo({
        isValid: true,
        isLoading: false,
        username: gp51Session.username,
        expiresAt
      });

      // Update status coordinator with restored session
      gp51StatusCoordinator.reportSaveSuccess(gp51Session.username);

    } catch (error) {
      console.error('❌ Session restoration failed:', error);
      setSessionInfo({
        isValid: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      gp51StatusCoordinator.reportMonitorStatus(false, 'Session restoration failed');
    }
  };

  useEffect(() => {
    restoreSessionFromDatabase();
  }, []);

  return {
    sessionInfo,
    refreshSession: restoreSessionFromDatabase
  };
};
