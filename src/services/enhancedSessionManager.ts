
import { SecurityService } from './securityService';
import { AuditService } from './auditService';
import { supabase } from '@/integrations/supabase/client';

export interface SessionValidationResult {
  isValid: boolean;
  expiresAt?: string;
  username?: string;
  needsRotation: boolean;
  error?: string;
}

export class EnhancedSessionManager {
  private static readonly SESSION_ROTATION_THRESHOLD = 2 * 60 * 60 * 1000; // 2 hours
  private static readonly SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours
  private static sessionCache = new Map<string, { data: any; timestamp: number }>();

  /**
   * Validates GP51 session with enhanced security checks
   */
  static async validateGP51Session(checkRotation: boolean = true): Promise<SessionValidationResult> {
    try {
      console.log('Performing enhanced GP51 session validation...');

      // Get the most recent session
      const { data: sessions, error: sessionError } = await supabase
        .from('gp51_sessions')
        .select('id, username, gp51_token, token_expires_at, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(1);

      if (sessionError || !sessions || sessions.length === 0) {
        await AuditService.logSecurityEvent(undefined, 'SESSION_VALIDATION_FAILED', {
          error: 'No sessions found',
          checkRotation
        }, false);

        return {
          isValid: false,
          needsRotation: false,
          error: 'No GP51 sessions configured'
        };
      }

      const session = sessions[0];
      const now = new Date();
      const expiresAt = new Date(session.token_expires_at);
      const lastUpdated = new Date(session.updated_at);

      // Check if session has expired
      if (expiresAt <= now) {
        await AuditService.logSecurityEvent(session.username, 'SESSION_EXPIRED', {
          sessionId: session.id,
          expiresAt: session.token_expires_at
        }, false);

        return {
          isValid: false,
          needsRotation: true,
          error: 'GP51 session has expired'
        };
      }

      // Check if session needs rotation (security best practice)
      const timeSinceUpdate = now.getTime() - lastUpdated.getTime();
      const needsRotation = checkRotation && timeSinceUpdate > this.SESSION_ROTATION_THRESHOLD;

      if (needsRotation) {
        console.log(`Session for ${session.username} needs rotation (${timeSinceUpdate}ms old)`);
      }

      // Validate session with GP51 API
      const isActiveOnServer = await this.validateSessionWithGP51API(session.gp51_token);
      if (!isActiveOnServer) {
        await AuditService.logSecurityEvent(session.username, 'SESSION_INVALID_ON_SERVER', {
          sessionId: session.id
        }, false);

        return {
          isValid: false,
          needsRotation: true,
          error: 'Session is not valid on GP51 server'
        };
      }

      // Update session last used timestamp
      await this.updateSessionLastUsed(session.id);

      await AuditService.logSecurityEvent(session.username, 'SESSION_VALIDATION_SUCCESS', {
        sessionId: session.id,
        needsRotation
      }, true);

      return {
        isValid: true,
        expiresAt: session.token_expires_at,
        username: session.username,
        needsRotation
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await AuditService.logSecurityEvent(undefined, 'SESSION_VALIDATION_ERROR', {
        error: errorMessage,
        checkRotation
      }, false);

      return {
        isValid: false,
        needsRotation: false,
        error: `Session validation failed: ${errorMessage}`
      };
    }
  }

  /**
   * Validates session with GP51 API server
   */
  private static async validateSessionWithGP51API(token: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: {
          action: 'validate_token',
          token: token
        }
      });

      return !error && data.status === 0 && data.valid === true;
    } catch (error) {
      console.error('Failed to validate session with GP51 API:', error);
      return false;
    }
  }

  /**
   * Rotates GP51 session token
   */
  static async rotateSessionToken(currentSessionId: string): Promise<{
    success: boolean;
    newToken?: string;
    error?: string;
  }> {
    try {
      console.log(`Rotating session token for session: ${currentSessionId}`);

      // Get current session
      const { data: currentSession, error: sessionError } = await supabase
        .from('gp51_sessions')
        .select('*')
        .eq('id', currentSessionId)
        .single();

      if (sessionError || !currentSession) {
        return {
          success: false,
          error: 'Current session not found'
        };
      }

      // Request new token from GP51 API
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: {
          action: 'refresh_token',
          current_token: currentSession.gp51_token,
          username: currentSession.username
        }
      });

      if (error || data.status !== 0) {
        await AuditService.logSecurityEvent(currentSession.username, 'TOKEN_ROTATION_FAILED', {
          sessionId: currentSessionId,
          error: error?.message || data.cause
        }, false);

        return {
          success: false,
          error: error?.message || data.cause || 'Token rotation failed'
        };
      }

      // Update session with new token
      const newExpiresAt = new Date(Date.now() + this.SESSION_TIMEOUT).toISOString();
      
      const { error: updateError } = await supabase
        .from('gp51_sessions')
        .update({
          gp51_token: data.new_token,
          token_expires_at: newExpiresAt,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentSessionId);

      if (updateError) {
        return {
          success: false,
          error: `Failed to update session: ${updateError.message}`
        };
      }

      await AuditService.logSecurityEvent(currentSession.username, 'TOKEN_ROTATION_SUCCESS', {
        sessionId: currentSessionId,
        newExpiresAt
      }, true);

      // Clear cache for this session
      this.clearSessionCache(currentSessionId);

      return {
        success: true,
        newToken: data.new_token
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await AuditService.logSecurityEvent(undefined, 'TOKEN_ROTATION_ERROR', {
        sessionId: currentSessionId,
        error: errorMessage
      }, false);

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Updates session last used timestamp
   */
  private static async updateSessionLastUsed(sessionId: string): Promise<void> {
    try {
      await supabase
        .from('gp51_sessions')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);
    } catch (error) {
      console.error('Failed to update session last used:', error);
    }
  }

  /**
   * Clears session cache
   */
  private static clearSessionCache(sessionId: string): void {
    this.sessionCache.delete(sessionId);
  }

  /**
   * Gets cached session data
   */
  static getCachedSession(sessionId: string): any | null {
    const cached = this.sessionCache.get(sessionId);
    if (cached && Date.now() - cached.timestamp < 60000) { // 1 minute cache
      return cached.data;
    }
    return null;
  }

  /**
   * Caches session data
   */
  static setCachedSession(sessionId: string, data: any): void {
    this.sessionCache.set(sessionId, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Monitors session health across the application
   */
  static async monitorSessionHealth(): Promise<{
    activeSessions: number;
    expiringSoon: number;
    expired: number;
    needingRotation: number;
  }> {
    try {
      const { data: sessions, error } = await supabase
        .from('gp51_sessions')
        .select('id, token_expires_at, updated_at');

      if (error || !sessions) {
        return { activeSessions: 0, expiringSoon: 0, expired: 0, needingRotation: 0 };
      }

      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

      let activeSessions = 0;
      let expiringSoon = 0;
      let expired = 0;
      let needingRotation = 0;

      for (const session of sessions) {
        const expiresAt = new Date(session.token_expires_at);
        const lastUpdated = new Date(session.updated_at);

        if (expiresAt <= now) {
          expired++;
        } else {
          activeSessions++;
          
          if (expiresAt <= oneHourFromNow) {
            expiringSoon++;
          }

          const timeSinceUpdate = now.getTime() - lastUpdated.getTime();
          if (timeSinceUpdate > this.SESSION_ROTATION_THRESHOLD) {
            needingRotation++;
          }
        }
      }

      return { activeSessions, expiringSoon, expired, needingRotation };

    } catch (error) {
      console.error('Session health monitoring failed:', error);
      return { activeSessions: 0, expiringSoon: 0, expired: 0, needingRotation: 0 };
    }
  }
}
