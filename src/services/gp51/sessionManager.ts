
import { supabase } from '@/integrations/supabase/client';

export interface GP51SessionInfo {
  valid: boolean;
  username?: string;
  expiresAt?: string;
  token?: string;
  error?: string;
  lastValidated?: Date;
}

export class GP51SessionManager {
  private static instance: GP51SessionManager;
  private sessionCache: GP51SessionInfo | null = null;
  private cacheExpiry: Date | null = null;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  static getInstance(): GP51SessionManager {
    if (!GP51SessionManager.instance) {
      GP51SessionManager.instance = new GP51SessionManager();
    }
    return GP51SessionManager.instance;
  }

  async validateSession(): Promise<GP51SessionInfo> {
    // Return cached result if still valid
    if (this.isCacheValid()) {
      console.log('📦 Using cached GP51 session validation result');
      return this.sessionCache!;
    }

    console.log('🔍 Validating GP51 session...');

    try {
      const { data: sessions, error } = await supabase
        .from('gp51_sessions')
        .select('username, gp51_token, token_expires_at, api_url')
        .order('token_expires_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('❌ Database error during session validation:', error);
        return this.setCacheAndReturn({
          valid: false,
          error: 'Database connection failed',
          lastValidated: new Date()
        });
      }

      if (!sessions || sessions.length === 0) {
        console.log('⚠️ No GP51 sessions found');
        return this.setCacheAndReturn({
          valid: false,
          error: 'No GP51 sessions configured',
          lastValidated: new Date()
        });
      }

      const session = sessions[0];
      const expiresAt = new Date(session.token_expires_at);
      const now = new Date();

      if (expiresAt <= now) {
        console.log('⏰ GP51 session expired');
        return this.setCacheAndReturn({
          valid: false,
          username: session.username,
          expiresAt: session.token_expires_at,
          error: 'Session expired',
          lastValidated: new Date()
        });
      }

      console.log('✅ Valid GP51 session found');
      return this.setCacheAndReturn({
        valid: true,
        username: session.username,
        expiresAt: session.token_expires_at,
        token: session.gp51_token,
        lastValidated: new Date()
      });

    } catch (error) {
      console.error('❌ Session validation failed:', error);
      return this.setCacheAndReturn({
        valid: false,
        error: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastValidated: new Date()
      });
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string; username?: string }> {
    console.log('🧪 Testing GP51 connection...');

    try {
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'test_connection' }
      });

      if (error) {
        console.error('❌ Connection test failed:', error);
        return {
          success: false,
          error: error.message || 'Connection test failed'
        };
      }

      if (data?.success) {
        console.log('✅ GP51 connection test successful');
        return {
          success: true,
          username: data.username
        };
      } else {
        console.log('❌ GP51 connection test failed');
        return {
          success: false,
          error: data?.error || 'Connection test failed'
        };
      }

    } catch (error) {
      console.error('❌ Connection test exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  async refreshSession(): Promise<GP51SessionInfo> {
    console.log('🔄 Refreshing GP51 session...');

    try {
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'refresh_session' }
      });

      if (error || !data?.success) {
        console.error('❌ Session refresh failed:', error || data);
        return this.setCacheAndReturn({
          valid: false,
          error: data?.error || error?.message || 'Session refresh failed',
          lastValidated: new Date()
        });
      }

      console.log('✅ GP51 session refreshed successfully');
      return this.setCacheAndReturn({
        valid: true,
        username: data.username,
        expiresAt: data.expiresAt,
        token: data.token,
        lastValidated: new Date()
      });

    } catch (error) {
      console.error('❌ Session refresh exception:', error);
      return this.setCacheAndReturn({
        valid: false,
        error: `Refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastValidated: new Date()
      });
    }
  }

  clearCache(): void {
    console.log('🧹 Clearing GP51 session cache');
    this.sessionCache = null;
    this.cacheExpiry = null;
  }

  private isCacheValid(): boolean {
    return this.sessionCache !== null && 
           this.cacheExpiry !== null && 
           new Date() < this.cacheExpiry;
  }

  private setCacheAndReturn(sessionInfo: GP51SessionInfo): GP51SessionInfo {
    this.sessionCache = sessionInfo;
    this.cacheExpiry = new Date(Date.now() + this.CACHE_DURATION);
    return sessionInfo;
  }
}

export const gp51SessionManager = GP51SessionManager.getInstance();
