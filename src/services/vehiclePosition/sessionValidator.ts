
import { supabase } from '@/integrations/supabase/client';

interface GP51Session {
  id: string;
  username: string;
  gp51_token: string;
  token_expires_at: string;
  created_at: string;
  updated_at: string;
}

interface SessionValidationResult {
  valid: boolean;
  session?: GP51Session;
  error?: string;
  expiresAt?: string;
}

export class GP51SessionValidator {
  private lastValidationTime = 0;
  private lastValidationResult: SessionValidationResult | null = null;
  private readonly VALIDATION_CACHE_MS = 30000; // 30 seconds

  async validateGP51Session(): Promise<SessionValidationResult> {
    const now = Date.now();
    
    // Return cached result if recent
    if (this.lastValidationResult && (now - this.lastValidationTime) < this.VALIDATION_CACHE_MS) {
      return this.lastValidationResult;
    }

    console.log('Validating GP51 session...');

    try {
      // Get all sessions, ordered by creation time
      const { data: sessions, error } = await supabase
        .from('gp51_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Database error fetching sessions:', error);
        const result = { valid: false, error: 'Database error fetching sessions' };
        this.cacheResult(result);
        return result;
      }

      if (!sessions || sessions.length === 0) {
        console.log('No GP51 sessions found in database');
        const result = { valid: false, error: 'No GP51 sessions found' };
        this.cacheResult(result);
        return result;
      }

      console.log(`Found ${sessions.length} GP51 sessions, checking for valid ones...`);

      // Check each session for validity
      for (const session of sessions) {
        const expiresAt = new Date(session.token_expires_at);
        const hoursUntilExpiry = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60);
        
        console.log(`Checking session for ${session.username}: expires at ${expiresAt.toISOString()}, ${hoursUntilExpiry.toFixed(2)} hours from now`);

        if (expiresAt > new Date()) {
          console.log(`✅ Found valid GP51 session for username: ${session.username}`);
          
          // Test the session with GP51 API
          console.log('Testing GP51 session connectivity...');
          
          try {
            const { data: testResult } = await supabase.functions.invoke('gp51-service-management', {
              body: { action: 'test_connection' }
            });

            if (testResult && testResult.success) {
              console.log('✅ GP51 session connectivity test passed');
              const result = { 
                valid: true, 
                session, 
                expiresAt: session.token_expires_at 
              };
              this.cacheResult(result);
              return result;
            } else {
              console.warn(`Session for ${session.username} failed connectivity test:`, testResult?.error);
              continue; // Try next session
            }
          } catch (testError) {
            console.warn(`Session for ${session.username} token appears expired despite valid timestamp`);
            continue; // Try next session
          }
        } else {
          console.log(`Session for ${session.username} is expired`);
        }
      }

      // No valid sessions found
      const latestSession = sessions[0];
      const errorMessage = `No valid GP51 sessions found. Latest session: ${latestSession.username} expired at ${latestSession.token_expires_at}`;
      console.error(errorMessage);
      
      const result = { valid: false, error: errorMessage };
      this.cacheResult(result);
      return result;

    } catch (error) {
      console.error('Error validating GP51 session:', error);
      const result = { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Unknown error during session validation' 
      };
      this.cacheResult(result);
      return result;
    }
  }

  async refreshGP51Session(): Promise<SessionValidationResult> {
    console.log('Attempting to refresh GP51 session...');
    
    // Clear cache to force fresh validation
    this.lastValidationResult = null;
    this.lastValidationTime = 0;
    
    const validationResult = await this.validateGP51Session();
    
    if (!validationResult.valid) {
      console.error('Failed to refresh GP51 session:', validationResult.error);
      return { valid: false, error: 'Service returned failure' };
    }

    // Try to refresh the session token with GP51
    try {
      const { data: refreshResult } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'refresh_session' }
      });

      if (refreshResult && refreshResult.status === 0) {
        console.log('✅ GP51 session refreshed successfully');
        return validationResult;
      } else {
        console.warn('GP51 session refresh returned non-success status:', refreshResult);
        return validationResult; // Return the original valid session anyway
      }
    } catch (refreshError) {
      console.warn('GP51 session refresh failed, but session is still valid:', refreshError);
      return validationResult; // Return the original valid session anyway
    }
  }

  async ensureValidSession(): Promise<SessionValidationResult> {
    console.log('Ensuring valid GP51 session...');
    
    const validationResult = await this.validateGP51Session();
    
    if (validationResult.valid) {
      return validationResult;
    }

    console.log('No valid session found, attempting refresh...');
    return await this.refreshGP51Session();
  }

  private cacheResult(result: SessionValidationResult): void {
    this.lastValidationResult = result;
    this.lastValidationTime = Date.now();
  }

  clearCache(): void {
    this.lastValidationResult = null;
    this.lastValidationTime = 0;
  }
}

export const gp51SessionValidator = new GP51SessionValidator();
