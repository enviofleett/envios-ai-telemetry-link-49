
import { supabase } from '@/integrations/supabase/client';
import { GP51ErrorHandler } from '@/services/gp51ErrorHandler';
import { SessionValidationResult } from './types';
import { SessionCacheManager } from './sessionCacheManager';

export class EnhancedGP51SessionValidator {
  private static checkInProgress = false;
  private static maxRetries = 3;
  private static retryDelay = 2000; // 2 seconds

  async validateGP51Session(): Promise<SessionValidationResult> {
    // Use cached result if recent and valid
    if (SessionCacheManager.isCacheValid()) {
      const cached = SessionCacheManager.getCachedResult();
      console.log('📦 Using cached session validation result:', cached?.valid ? 'valid' : 'invalid');
      return cached;
    }

    // Prevent concurrent checks
    if (EnhancedGP51SessionValidator.checkInProgress) {
      await this.waitForCheck();
      return SessionCacheManager.getCachedResult() || this.createErrorResult('Check timeout');
    }

    EnhancedGP51SessionValidator.checkInProgress = true;

    try {
      console.log('🔍 Enhanced GP51 session validation starting...');

      const { data: sessions, error: sessionError } = await supabase
        .from('gp51_sessions')
        .select('username, gp51_token, token_expires_at, api_url')
        .order('token_expires_at', { ascending: false })
        .limit(5);

      if (sessionError) {
        GP51ErrorHandler.logError({
          type: 'connectivity',
          message: 'Database query failed during session validation',
          details: sessionError,
          severity: 'critical',
          timestamp: new Date()
        });
        const result = this.createErrorResult('Database connection failed');
        SessionCacheManager.setCachedResult(result);
        return result;
      }

      if (!sessions || sessions.length === 0) {
        GP51ErrorHandler.logError({
          type: 'session',
          message: 'No GP51 sessions found in database',
          severity: 'critical',
          timestamp: new Date()
        });
        const result = this.createErrorResult('No GP51 sessions configured');
        SessionCacheManager.setCachedResult(result);
        return result;
      }

      console.log(`Found ${sessions.length} GP51 sessions, validating...`);

      // Try each session to find a working one
      for (const session of sessions) {
        if (!session.gp51_token) {
          console.log(`Session for ${session.username} has no token, skipping...`);
          continue;
        }

        const expiresAt = new Date(session.token_expires_at);
        const now = new Date();
        const timeUntilExpiry = expiresAt.getTime() - now.getTime();

        if (timeUntilExpiry <= 0) {
          console.log(`Session for ${session.username} expired, skipping...`);
          continue;
        }

        // Test session connectivity with retry logic using complete API URL
        const isWorking = await this.testSessionWithRetry(session.gp51_token, session.username, session.api_url);
        
        if (isWorking) {
          const result = this.createSuccessResult(session);
          SessionCacheManager.setCachedResult(result);
          return result;
        }
      }

      // No working sessions found
      GP51ErrorHandler.logError({
        type: 'authentication',
        message: 'All GP51 sessions failed validation',
        details: { sessionCount: sessions.length },
        severity: 'critical',
        timestamp: new Date()
      });

      const result = this.createErrorResult('All GP51 sessions failed validation');
      SessionCacheManager.setCachedResult(result);
      return result;

    } catch (error) {
      GP51ErrorHandler.logError({
        type: 'api',
        message: 'Session validation failed with exception',
        details: error,
        severity: 'critical',
        timestamp: new Date()
      });

      const result = this.createErrorResult(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      SessionCacheManager.setCachedResult(result);
      return result;
    } finally {
      EnhancedGP51SessionValidator.checkInProgress = false;
    }
  }

  private async testSessionWithRetry(token: string, username: string, apiUrl?: string): Promise<boolean> {
    for (let attempt = 1; attempt <= EnhancedGP51SessionValidator.maxRetries; attempt++) {
      try {
        console.log(`Testing session for ${username} (attempt ${attempt}/${EnhancedGP51SessionValidator.maxRetries})...`);
        
        const { data, error } = await supabase.functions.invoke('gp51-service-management', {
          body: { action: 'test_connection' }
        });

        if (!error && data?.success) {
          console.log(`✅ Session test successful for ${username} using complete API URL: ${apiUrl || data.apiUrl}`);
          return true;
        }

        console.warn(`Session test failed for ${username}:`, error || data?.error);
        
        if (attempt < EnhancedGP51SessionValidator.maxRetries) {
          console.log(`Retrying in ${EnhancedGP51SessionValidator.retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, EnhancedGP51SessionValidator.retryDelay));
        }

      } catch (error) {
        console.error(`Session test exception for ${username} (attempt ${attempt}):`, error);
        
        if (attempt < EnhancedGP51SessionValidator.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, EnhancedGP51SessionValidator.retryDelay));
        }
      }
    }

    console.error(`❌ All session test attempts failed for ${username}`);
    return false;
  }

  private async waitForCheck(): Promise<void> {
    let attempts = 0;
    while (EnhancedGP51SessionValidator.checkInProgress && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
  }

  private createSuccessResult(session: any): SessionValidationResult {
    return {
      valid: true,
      username: session.username,
      expiresAt: session.token_expires_at,
      token: session.gp51_token,
      apiUrl: session.api_url || 'https://gps51.com/webapi'
    };
  }

  private createErrorResult(error: string): SessionValidationResult {
    return {
      valid: false,
      error
    };
  }

  clearCache(): void {
    SessionCacheManager.clearCache();
  }

  forceRevalidation(): void {
    console.log('🔄 Forcing session revalidation...');
    SessionCacheManager.forceExpire();
  }
}

export const enhancedGP51SessionValidator = new EnhancedGP51SessionValidator();
