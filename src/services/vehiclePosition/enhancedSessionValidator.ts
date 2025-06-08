
import { supabase } from '@/integrations/supabase/client';
import { GP51ErrorHandler } from '@/services/gp51ErrorHandler';
import { SessionValidationResult } from './types';
import { GP51SessionCache } from './sessionCache';
import { GP51SessionRefresher } from './sessionRefresher';

export class GP51SessionValidator {
  private static checkInProgress = false;

  async validateGP51Session(): Promise<SessionValidationResult> {
    // Use cached result if recent
    if (GP51SessionCache.isCacheValid()) {
      return GP51SessionCache.getCachedResult()!;
    }

    // Prevent concurrent checks
    if (GP51SessionValidator.checkInProgress) {
      await this.waitForCheck();
      return GP51SessionCache.getCachedResult() || this.createErrorResult('Check timeout');
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
        return GP51SessionCache.setCachedResult(this.createErrorResult('Database connection failed'));
      }

      if (!sessions || sessions.length === 0) {
        GP51ErrorHandler.logError({
          type: 'session',
          message: 'No GP51 sessions found',
          severity: 'critical',
          timestamp: new Date()
        });
        return GP51SessionCache.setCachedResult(this.createErrorResult('No GP51 sessions configured'));
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
        
        return GP51SessionCache.setCachedResult({
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

      return GP51SessionCache.setCachedResult(this.createErrorResult('All GP51 sessions expired'));

    } catch (error) {
      GP51ErrorHandler.logError({
        type: 'api',
        message: 'Session validation exception',
        details: error,
        severity: 'critical',
        timestamp: new Date()
      });

      return GP51SessionCache.setCachedResult(this.createErrorResult(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    } finally {
      GP51SessionValidator.checkInProgress = false;
    }
  }

  async refreshGP51Session(): Promise<SessionValidationResult> {
    const result = await GP51SessionRefresher.refreshGP51Session();
    if (result.valid) {
      GP51SessionCache.clearCache(); // Clear cache to force fresh validation
    }
    return result;
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

  private async waitForCheck(): Promise<void> {
    let attempts = 0;
    while (GP51SessionValidator.checkInProgress && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
  }

  private createErrorResult(message: string): SessionValidationResult {
    return {
      valid: false,
      error: message
    };
  }

  private clearCache(): void {
    GP51SessionCache.clearCache();
  }
}

export const gp51SessionValidator = new GP51SessionValidator();
