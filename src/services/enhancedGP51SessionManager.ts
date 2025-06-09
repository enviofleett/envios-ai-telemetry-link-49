
import { supabase } from '@/integrations/supabase/client';
import { AuditService } from './auditService';

export interface SessionHealth {
  isValid: boolean;
  expiresAt?: string;
  username?: string;
  needsRefresh: boolean;
  timeUntilExpiry?: number;
  error?: string;
}

export class EnhancedGP51SessionManager {
  private static readonly REFRESH_THRESHOLD = 2 * 60 * 60 * 1000; // 2 hours before expiry
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 2000; // 2 seconds

  static async validateAndRefreshSession(): Promise<SessionHealth> {
    try {
      console.log('🔍 Starting enhanced GP51 session validation...');
      
      const { data: sessions, error } = await supabase
        .from('gp51_sessions')
        .select('id, username, gp51_token, token_expires_at, created_at')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error || !sessions || sessions.length === 0) {
        return {
          isValid: false,
          needsRefresh: false,
          error: 'No GP51 sessions configured. Please authenticate in Settings.'
        };
      }

      const session = sessions[0];
      const now = new Date();
      const expiresAt = new Date(session.token_expires_at);
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();

      // Check if session has expired
      if (timeUntilExpiry <= 0) {
        console.log('❌ Session expired, attempting refresh...');
        return await this.attemptSessionRefresh(session);
      }

      // Check if session needs proactive refresh (2 hours before expiry)
      const needsRefresh = timeUntilExpiry <= this.REFRESH_THRESHOLD;
      
      if (needsRefresh) {
        console.log(`⚠️ Session expires in ${Math.round(timeUntilExpiry / (1000 * 60))} minutes, refreshing proactively...`);
        return await this.attemptSessionRefresh(session);
      }

      // Validate session is still active with GP51 API
      const isActive = await this.validateWithGP51API(session.gp51_token);
      
      if (!isActive) {
        console.log('❌ Session invalid with GP51 API, attempting refresh...');
        return await this.attemptSessionRefresh(session);
      }

      console.log(`✅ Session healthy for ${session.username}, expires in ${Math.round(timeUntilExpiry / (1000 * 60 * 60))} hours`);
      
      return {
        isValid: true,
        expiresAt: session.token_expires_at,
        username: session.username,
        needsRefresh: false,
        timeUntilExpiry: Math.round(timeUntilExpiry / (1000 * 60))
      };

    } catch (error) {
      console.error('💥 Session validation failed:', error);
      return {
        isValid: false,
        needsRefresh: true,
        error: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private static async attemptSessionRefresh(session: any): Promise<SessionHealth> {
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(`🔄 Refresh attempt ${attempt}/${this.MAX_RETRIES}...`);
        
        const { data, error } = await supabase.functions.invoke('gp51-service-management', {
          body: { action: 'refresh_session' }
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data.status === 0 && data.token) {
          console.log('✅ Session refreshed successfully');
          
          // Update session in database
          await supabase
            .from('gp51_sessions')
            .update({
              gp51_token: data.token,
              token_expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', session.id);

          await AuditService.logSecurityEvent(session.username, 'SESSION_REFRESHED_SUCCESS', {
            attempt,
            newExpiry: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
          }, true);

          return {
            isValid: true,
            expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
            username: session.username,
            needsRefresh: false,
            timeUntilExpiry: 8 * 60 // 8 hours in minutes
          };
        }

        throw new Error(data.error || 'Refresh failed');

      } catch (error) {
        console.error(`❌ Refresh attempt ${attempt} failed:`, error);
        
        if (attempt < this.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * attempt));
          continue;
        }

        await AuditService.logSecurityEvent(session.username, 'SESSION_REFRESH_FAILED', {
          attempts: this.MAX_RETRIES,
          finalError: error instanceof Error ? error.message : 'Unknown error'
        }, false);

        return {
          isValid: false,
          needsRefresh: true,
          error: `Session refresh failed after ${this.MAX_RETRIES} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    }

    return {
      isValid: false,
      needsRefresh: true,
      error: 'Maximum refresh attempts exceeded'
    };
  }

  private static async validateWithGP51API(token: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: {
          action: 'validate_token',
          token: token
        }
      });

      return !error && data?.status === 0;
    } catch (error) {
      console.error('🔌 GP51 API validation failed:', error);
      return false;
    }
  }

  static async getSessionStatus(): Promise<{
    connected: boolean;
    username?: string;
    expiresAt?: string;
    warningMessage?: string;
  }> {
    const health = await this.validateAndRefreshSession();
    
    return {
      connected: health.isValid,
      username: health.username,
      expiresAt: health.expiresAt,
      warningMessage: health.needsRefresh ? 'Session requires attention' : undefined
    };
  }

  static async ensureHealthySession(): Promise<boolean> {
    const health = await this.validateAndRefreshSession();
    return health.isValid;
  }
}
