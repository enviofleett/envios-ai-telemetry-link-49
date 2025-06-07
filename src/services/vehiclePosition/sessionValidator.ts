
import { supabase } from '@/integrations/supabase/client';

interface SessionValidationResult {
  valid: boolean;
  error?: string;
  username?: string;
  expiresAt?: string;
  token?: string;
}

export class GP51SessionValidator {
  async validateGP51Session(): Promise<SessionValidationResult> {
    try {
      console.log('Validating GP51 session...');

      // Get ALL GP51 sessions, not just the most recent one
      const { data: sessions, error: sessionError } = await supabase
        .from('gp51_sessions')
        .select('username, gp51_token, token_expires_at')
        .order('token_expires_at', { ascending: false })
        .limit(10); // Get multiple sessions to find valid ones

      if (sessionError) {
        console.error('Failed to query GP51 sessions:', sessionError);
        return {
          valid: false,
          error: 'Failed to access GP51 sessions. Please check database connection.'
        };
      }

      if (!sessions || sessions.length === 0) {
        console.log('No GP51 sessions found in database');
        return {
          valid: false,
          error: 'No GP51 sessions configured. Please set up GP51 connection in Admin Settings.'
        };
      }

      console.log(`Found ${sessions.length} GP51 sessions, checking for valid ones...`);

      // Check each session to find a valid one
      const now = new Date();
      for (const session of sessions) {
        if (!session.gp51_token) {
          console.log(`Session for ${session.username} has no token, skipping...`);
          continue;
        }

        const expiresAt = new Date(session.token_expires_at);
        const timeUntilExpiry = expiresAt.getTime() - now.getTime();
        const hoursUntilExpiry = timeUntilExpiry / (1000 * 60 * 60);

        console.log(`Checking session for ${session.username}: expires at ${expiresAt.toISOString()}, ${hoursUntilExpiry.toFixed(2)} hours from now`);

        if (expiresAt > now) {
          console.log(`✅ Found valid GP51 session for username: ${session.username}`);
          
          // Test the session with a simple API call
          const isSessionWorking = await this.testSessionConnectivity(session.gp51_token);
          
          if (isSessionWorking) {
            return {
              valid: true,
              username: session.username,
              expiresAt: session.token_expires_at,
              token: session.gp51_token
            };
          } else {
            console.warn(`Session for ${session.username} token appears expired despite valid timestamp`);
          }
        } else {
          console.log(`Session for ${session.username} expired at ${expiresAt.toISOString()}`);
        }
      }

      // No valid sessions found
      const latestSession = sessions[0];
      console.error(`No valid GP51 sessions found. Latest session: ${latestSession.username} expired at ${latestSession.token_expires_at}`);
      
      return {
        valid: false,
        error: `All GP51 sessions have expired. Latest session (${latestSession.username}) expired at ${new Date(latestSession.token_expires_at).toLocaleString()}. Please refresh connection in Admin Settings.`
      };

    } catch (error) {
      console.error('Session validation error:', error);
      return {
        valid: false,
        error: `Session validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async testSessionConnectivity(token: string): Promise<boolean> {
    try {
      console.log('Testing GP51 session connectivity...');
      
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { 
          action: 'validate_token',
          token: token
        }
      });

      if (error) {
        console.warn('Session connectivity test failed:', error);
        return false;
      }

      return data?.success === true;
    } catch (error) {
      console.warn('Session connectivity test error:', error);
      return false;
    }
  }

  async refreshGP51Session(): Promise<SessionValidationResult> {
    try {
      console.log('Attempting to refresh GP51 session...');
      
      // First, try to get a valid existing session
      const existingSession = await this.validateGP51Session();
      if (existingSession.valid) {
        console.log('Found valid existing session, no refresh needed');
        return existingSession;
      }

      // If no valid session, attempt refresh via the service
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'refresh_session' }
      });

      if (error || !data?.success) {
        console.error('Failed to refresh GP51 session:', error || 'Service returned failure');
        return {
          valid: false,
          error: 'Failed to refresh GP51 session. Please re-authenticate in Admin Settings.'
        };
      }

      console.log('GP51 session refreshed successfully');
      return {
        valid: true,
        username: data.username,
        expiresAt: data.expiresAt,
        token: data.token
      };

    } catch (error) {
      console.error('Session refresh error:', error);
      return {
        valid: false,
        error: `Session refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async ensureValidSession(): Promise<SessionValidationResult> {
    console.log('Ensuring valid GP51 session...');
    
    // First check for existing valid session
    const validation = await this.validateGP51Session();
    if (validation.valid) {
      console.log('Valid session found, no action needed');
      return validation;
    }

    console.log('No valid session found, attempting refresh...');
    return await this.refreshGP51Session();
  }
}

export const gp51SessionValidator = new GP51SessionValidator();
