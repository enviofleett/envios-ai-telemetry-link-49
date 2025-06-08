
import { supabase } from '@/integrations/supabase/client';
import { GP51ErrorHandler } from '../gp51ErrorHandler';

interface SessionValidationResult {
  valid: boolean;
  error?: string;
  username?: string;
  expiresAt?: string;
  token?: string;
}

export class GP51SessionValidator {
  private static lastCheck: Date | null = null;
  private static cachedResult: SessionValidationResult | null = null;
  private static checkInProgress = false;

  async validateGP51Session(): Promise<SessionValidationResult> {
    // Use cached result if recent
    if (this.isCacheValid()) {
      return GP51SessionValidator.cachedResult!;
    }

    // Prevent concurrent checks
    if (GP51SessionValidator.checkInProgress) {
      await this.waitForCheck();
      return GP51SessionValidator.cachedResult || this.createErrorResult('Check timeout');
    }

    GP51SessionValidator.checkInProgress = true;

    try {
      console.log('🔍 Enhanced GP51 session validation...');

      const { data: sessions, error: sessionError } = await supabase
        .from('gp51_sessions')
        .select('username, gp51_token, token_expires_at')
        .order('token_expires_at', { ascending: false })
        .limit(3);

      if (sessionError) {
        GP51ErrorHandler.logError({
          type: 'connectivity',
          message: 'Database query failed during session validation',
          details: sessionError,
          severity: 'critical',
          timestamp: new Date()
        });
        return this.cacheAndReturn(this.createErrorResult('Database connection failed'));
      }

      if (!sessions || sessions.length === 0) {
        GP51ErrorHandler.logError({
          type: 'session',
          message: 'No GP51 sessions found',
          severity: 'critical',
          timestamp: new Date()
        });
        return this.cacheAndReturn(this.createErrorResult('No GP51 sessions configured'));
      }

      console.log(`Found ${sessions.length} GP51 sessions, checking validity...`);

      // Check each session
      for (const session of sessions) {
        if (!session.gp51_token) {
          console.log(`Session for ${session.username} missing token, skipping...`);
          continue;
        }

        const expiresAt = new Date(session.token_expires_at);
        const now = new Date();

        if (expiresAt <= now) {
          console.log(`Session for ${session.username} expired, skipping...`);
          continue;
        }

        console.log(`✅ Found valid session for ${session.username}, expires: ${expiresAt.toISOString()}`);
        
        return this.cacheAndReturn({
          valid: true,
          username: session.username,
          expiresAt: session.token_expires_at,
          token: session.gp51_token
        });
      }

      GP51ErrorHandler.logError({
        type: 'session',
        message: 'All GP51 sessions expired or invalid',
        details: { sessionCount: sessions.length },
        severity: 'critical',
        timestamp: new Date()
      });

      return this.cacheAndReturn(this.createErrorResult('All GP51 sessions expired'));

    } catch (error) {
      GP51ErrorHandler.logError({
        type: 'api',
        message: 'Session validation exception',
        details: error,
        severity: 'critical',
        timestamp: new Date()
      });

      return this.cacheAndReturn(this.createErrorResult(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    } finally {
      GP51SessionValidator.checkInProgress = false;
    }
  }

  async refreshGP51Session(): Promise<SessionValidationResult> {
    console.log('🔄 Attempting GP51 session refresh...');
    
    try {
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'refresh_session' }
      });

      if (error || !data?.success) {
        GP51ErrorHandler.logError({
          type: 'authentication',
          message: 'Session refresh failed',
          details: error || data,
          severity: 'high',
          timestamp: new Date()
        });
        return this.createErrorResult('Session refresh failed');
      }

      console.log('✅ GP51 session refreshed successfully');
      this.clearCache(); // Clear cache to force fresh validation
      
      return {
        valid: true,
        username: data.username,
        expiresAt: data.expiresAt,
        token: data.token
      };

    } catch (error) {
      GP51ErrorHandler.logError({
        type: 'api',
        message: 'Session refresh exception',
        details: error,
        severity: 'high',
        timestamp: new Date()
      });
      return this.createErrorResult(`Refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async ensureValidSession(): Promise<SessionValidationResult> {
    console.log('🔍 Ensuring valid GP51 session...');
    
    const validation = await this.validateGP51Session();
    if (validation.valid) {
      return validation;
    }

    console.log('Invalid session found, attempting refresh...');
    return await this.refreshGP51Session();
  }

  private isCacheValid(): boolean {
    if (!GP51SessionValidator.cachedResult || !GP51SessionValidator.lastCheck) {
      return false;
    }

    const cacheAge = Date.now() - GP51SessionValidator.lastCheck.getTime();
    const maxAge = GP51SessionValidator.cachedResult.valid ? 30000 : 5000; // 30s valid, 5s invalid

    return cacheAge < maxAge;
  }

  private async waitForCheck(): Promise<void> {
    let attempts = 0;
    while (GP51SessionValidator.checkInProgress && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
  }

  private cacheAndReturn(result: SessionValidationResult): SessionValidationResult {
    GP51SessionValidator.cachedResult = result;
    GP51SessionValidator.lastCheck = new Date();
    return result;
  }

  private createErrorResult(message: string): SessionValidationResult {
    return {
      valid: false,
      error: message
    };
  }

  private clearCache(): void {
    GP51SessionValidator.cachedResult = null;
    GP51SessionValidator.lastCheck = null;
  }
}

export const gp51SessionValidator = new GP51SessionValidator();
