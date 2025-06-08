
import { supabase } from '@/integrations/supabase/client';
import { GP51ErrorHandler } from './gp51ErrorHandler';

interface EnhancedSessionResult {
  valid: boolean;
  error?: string;
  username?: string;
  expiresAt?: string;
  token?: string;
  healthStatus: 'healthy' | 'degraded' | 'critical';
  lastValidated: Date;
}

export class EnhancedSessionValidator {
  private static lastValidation: Date | null = null;
  private static cachedResult: EnhancedSessionResult | null = null;
  private static validationInProgress = false;

  async validateGP51Session(): Promise<EnhancedSessionResult> {
    // Return cached result if recent and valid
    if (this.isCacheValid()) {
      return EnhancedSessionValidator.cachedResult!;
    }

    // Prevent concurrent validations
    if (EnhancedSessionValidator.validationInProgress) {
      console.log('Session validation already in progress, waiting...');
      await this.waitForValidation();
      return EnhancedSessionValidator.cachedResult || this.createFailureResult('Validation timeout');
    }

    EnhancedSessionValidator.validationInProgress = true;

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
          message: 'Database connection failed during session validation',
          details: sessionError,
          severity: 'critical',
          timestamp: new Date()
        });

        return this.createFailureResult('Database connection failed');
      }

      if (!sessions || sessions.length === 0) {
        GP51ErrorHandler.logError({
          type: 'session',
          message: 'No GP51 sessions found in database',
          severity: 'critical',
          timestamp: new Date()
        });

        return this.createFailureResult('No GP51 sessions configured');
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

        // Test session connectivity with enhanced error handling
        const isWorking = await this.testSessionWithRetry(session.gp51_token, session.username);
        
        if (isWorking) {
          const result = this.createSuccessResult(session);
          this.cacheResult(result);
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

      return this.createFailureResult('All GP51 sessions failed validation');

    } catch (error) {
      GP51ErrorHandler.logError({
        type: 'api',
        message: 'Session validation failed with exception',
        details: error,
        severity: 'critical',
        timestamp: new Date()
      });

      return this.createFailureResult(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      EnhancedSessionValidator.validationInProgress = false;
    }
  }

  private async testSessionWithRetry(token: string, username: string, maxRetries: number = 2): Promise<boolean> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Testing GP51 session for ${username} (attempt ${attempt}/${maxRetries})...`);
        
        const { data, error } = await supabase.functions.invoke('gp51-service-management', {
          body: { 
            action: 'validate_token',
            token: token
          }
        });

        if (error) {
          console.warn(`Session test attempt ${attempt} failed:`, error);
          if (attempt === maxRetries) {
            GP51ErrorHandler.logError({
              type: 'api',
              message: `Session validation failed for ${username}`,
              details: error,
              severity: 'high',
              timestamp: new Date()
            });
          }
          continue;
        }

        if (data?.success === true) {
          console.log(`✅ Session validation successful for ${username}`);
          return true;
        }

        console.warn(`Session test returned failure for ${username}:`, data);
        if (attempt === maxRetries) {
          GP51ErrorHandler.logError({
            type: 'authentication',
            message: `Session authentication failed for ${username}`,
            details: data,
            severity: 'high',
            timestamp: new Date()
          });
        }

      } catch (testError) {
        console.warn(`Session test attempt ${attempt} exception:`, testError);
        if (attempt === maxRetries) {
          GP51ErrorHandler.logError({
            type: 'connectivity',
            message: `Session test connection failed for ${username}`,
            details: testError,
            severity: 'high',
            timestamp: new Date()
          });
        }
      }

      // Wait before retry
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    return false;
  }

  private isCacheValid(): boolean {
    if (!EnhancedSessionValidator.cachedResult || !EnhancedSessionValidator.lastValidation) {
      return false;
    }

    const cacheAge = Date.now() - EnhancedSessionValidator.lastValidation.getTime();
    const maxCacheAge = EnhancedSessionValidator.cachedResult.valid ? 30000 : 10000; // 30s for valid, 10s for invalid

    return cacheAge < maxCacheAge;
  }

  private async waitForValidation(): Promise<void> {
    let attempts = 0;
    while (EnhancedSessionValidator.validationInProgress && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
  }

  private createSuccessResult(session: any): EnhancedSessionResult {
    return {
      valid: true,
      username: session.username,
      expiresAt: session.token_expires_at,
      token: session.gp51_token,
      healthStatus: 'healthy',
      lastValidated: new Date()
    };
  }

  private createFailureResult(error: string): EnhancedSessionResult {
    return {
      valid: false,
      error,
      healthStatus: 'critical',
      lastValidated: new Date()
    };
  }

  private cacheResult(result: EnhancedSessionResult): void {
    EnhancedSessionValidator.cachedResult = result;
    EnhancedSessionValidator.lastValidation = new Date();
  }

  clearCache(): void {
    EnhancedSessionValidator.cachedResult = null;
    EnhancedSessionValidator.lastValidation = null;
  }
}

export const enhancedSessionValidator = new EnhancedSessionValidator();
