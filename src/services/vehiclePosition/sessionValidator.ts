
import { supabase } from '@/integrations/supabase/client';

interface SessionValidationResult {
  valid: boolean;
  error?: string;
  username?: string;
  expiresAt?: string;
}

export class GP51SessionValidator {
  async validateGP51Session(): Promise<SessionValidationResult> {
    try {
      console.log('Validating GP51 session...');

      // Get the most recent GP51 session
      const { data: session, error: sessionError } = await supabase
        .from('gp51_sessions')
        .select('username, gp51_token, token_expires_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (sessionError) {
        console.error('No GP51 session found:', sessionError);
        return {
          valid: false,
          error: 'No GP51 session configured. Please set up GP51 connection in Admin Settings.'
        };
      }

      if (!session || !session.gp51_token) {
        return {
          valid: false,
          error: 'No valid GP51 token found'
        };
      }

      // Check if token is still valid
      const now = new Date();
      const expiresAt = new Date(session.token_expires_at);

      if (expiresAt <= now) {
        console.error(`GP51 token expired at ${expiresAt.toISOString()}`);
        return {
          valid: false,
          error: 'GP51 token has expired. Please refresh connection in Admin Settings.'
        };
      }

      console.log(`Valid GP51 session found for username: ${session.username}`);
      
      return {
        valid: true,
        username: session.username,
        expiresAt: session.token_expires_at
      };

    } catch (error) {
      console.error('Session validation error:', error);
      return {
        valid: false,
        error: `Session validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

export const gp51SessionValidator = new GP51SessionValidator();
