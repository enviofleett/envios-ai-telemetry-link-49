
import { supabase } from '@/integrations/supabase/client';
import type { SessionValidationResult } from './types';

export class GP51SessionValidator {
  async validateGP51Session(): Promise<SessionValidationResult> {
    try {
      // Get the admin username from envio_users
      const { data: adminUsers, error: adminError } = await supabase
        .from('envio_users')
        .select('gp51_username')
        .not('gp51_username', 'is', null)
        .limit(1);

      if (adminError || !adminUsers || adminUsers.length === 0) {
        return { valid: false, error: 'No admin GP51 username found' };
      }

      const adminUsername = adminUsers[0].gp51_username;

      // Check if we have a valid session for this username
      const { data: sessions, error: sessionError } = await supabase
        .from('gp51_sessions')
        .select('*')
        .eq('username', adminUsername)
        .order('created_at', { ascending: false })
        .limit(1);

      if (sessionError || !sessions || sessions.length === 0) {
        return { valid: false, error: `No GP51 session found for username: ${adminUsername}` };
      }

      const session = sessions[0];

      // Check if session is still valid
      if (new Date(session.token_expires_at) <= new Date()) {
        return { valid: false, error: 'GP51 session expired' };
      }

      console.log(`Valid GP51 session found for username: ${adminUsername}`);
      return { valid: true };

    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Session validation failed' 
      };
    }
  }
}

export const gp51SessionValidator = new GP51SessionValidator();
