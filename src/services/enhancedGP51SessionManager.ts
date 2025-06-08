
import { supabase } from '@/integrations/supabase/client';
import { SecurityService } from './security/SecurityService';
import { enhancedCachingService } from './performance/EnhancedCachingService';

export interface EnhancedGP51SessionValidation {
  isValid: boolean;
  username?: string;
  expiresAt?: string;
  timeUntilExpiry?: number; // minutes
  needsRefresh: boolean;
  lastValidated?: Date;
  error?: string;
}

export interface GP51SessionStatus {
  connected: boolean;
  username?: string;
  expiresAt?: string;
  warningMessage?: string;
  timeUntilExpiry?: number;
}

export class EnhancedGP51SessionManager {
  private static readonly CACHE_KEY = 'gp51_session_status';
  private static readonly CACHE_TTL = 300; // 5 minutes
  private static readonly REFRESH_THRESHOLD = 7200; // 2 hours in seconds

  static async validateAndRefreshSession(): Promise<EnhancedGP51SessionValidation> {
    try {
      console.log('Starting enhanced GP51 session validation...');

      // Check cache first for performance
      const cachedResult = enhancedCachingService.get<EnhancedGP51SessionValidation>(this.CACHE_KEY);
      if (cachedResult && !cachedResult.needsRefresh) {
        console.log('Using cached GP51 session status');
        return cachedResult;
      }

      // Get the most recent valid GP51 session
      const { data: sessions, error: sessionError } = await supabase
        .from('gp51_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .order('token_expires_at', { ascending: false })
        .limit(5);

      if (sessionError || !sessions || sessions.length === 0) {
        console.error('No GP51 sessions found:', sessionError);
        const result: EnhancedGP51SessionValidation = {
          isValid: false,
          needsRefresh: true,
          error: 'No GP51 sessions configured'
        };
        enhancedCachingService.set(this.CACHE_KEY, result, 60); // Cache error for 1 minute
        return result;
      }

      // Find the first non-expired session
      let validSession = null;
      const now = new Date();
      
      for (const session of sessions) {
        const expiresAt = new Date(session.token_expires_at);
        if (expiresAt > now) {
          validSession = session;
          break;
        }
      }

      if (!validSession) {
        console.error('All GP51 sessions are expired');
        const result: EnhancedGP51SessionValidation = {
          isValid: false,
          needsRefresh: true,
          error: 'All GP51 sessions expired. Please re-authenticate.'
        };
        enhancedCachingService.set(this.CACHE_KEY, result, 60);
        return result;
      }

      // Calculate time until expiry
      const expiresAt = new Date(validSession.token_expires_at);
      const timeUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60));
      const needsRefresh = timeUntilExpiry < 120; // Less than 2 hours

      // Validate token format
      const tokenValidation = SecurityService.validateInput(
        validSession.gp51_token || '', 
        'gp51_token'
      );

      if (!tokenValidation.isValid) {
        console.error('Invalid GP51 token format:', tokenValidation.error);
        const result: EnhancedGP51SessionValidation = {
          isValid: false,
          needsRefresh: true,
          error: 'Invalid token format'
        };
        enhancedCachingService.set(this.CACHE_KEY, result, 60);
        return result;
      }

      // Test actual connectivity
      const connectivityTest = await this.testGP51Connectivity(validSession);
      
      const result: EnhancedGP51SessionValidation = {
        isValid: connectivityTest.success,
        username: validSession.username,
        expiresAt: validSession.token_expires_at,
        timeUntilExpiry,
        needsRefresh: needsRefresh || !connectivityTest.success,
        lastValidated: new Date(),
        error: connectivityTest.error
      };

      // Cache the result
      const cacheTime = result.isValid ? this.CACHE_TTL : 60;
      enhancedCachingService.set(this.CACHE_KEY, result, cacheTime);

      // Log security event
      SecurityService.logSecurityEvent({
        type: 'authentication',
        severity: result.isValid ? 'low' : 'medium',
        description: `GP51 session validation: ${result.isValid ? 'success' : 'failed'}`,
        additionalData: { 
          username: validSession.username, 
          timeUntilExpiry, 
          needsRefresh: result.needsRefresh 
        }
      });

      return result;

    } catch (error) {
      console.error('Enhanced GP51 session validation error:', error);
      const result: EnhancedGP51SessionValidation = {
        isValid: false,
        needsRefresh: true,
        error: error instanceof Error ? error.message : 'Unknown validation error'
      };
      enhancedCachingService.set(this.CACHE_KEY, result, 60);
      return result;
    }
  }

  static async getSessionStatus(): Promise<GP51SessionStatus> {
    const validation = await this.validateAndRefreshSession();
    
    return {
      connected: validation.isValid,
      username: validation.username,
      expiresAt: validation.expiresAt,
      timeUntilExpiry: validation.timeUntilExpiry,
      warningMessage: validation.needsRefresh ? 'Session needs refresh' : validation.error
    };
  }

  private static async testGP51Connectivity(session: any): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'test_connection' }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.success) {
        return { success: false, error: data.error };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Connectivity test failed' 
      };
    }
  }

  static invalidateCache(): void {
    enhancedCachingService.invalidate(this.CACHE_KEY);
    console.log('GP51 session cache invalidated');
  }

  static async forceRefresh(): Promise<EnhancedGP51SessionValidation> {
    this.invalidateCache();
    return await this.validateAndRefreshSession();
  }
}
