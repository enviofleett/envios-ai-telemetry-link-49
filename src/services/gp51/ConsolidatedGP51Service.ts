
import { supabase } from '@/integrations/supabase/client';

export interface GP51ConnectionConfig {
  username: string;
  password: string;
  apiUrl?: string;
  enableAutoRefresh?: boolean;
  sessionTimeout?: number;
}

export interface GP51ServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  sessionId?: string;
}

export interface GP51Session {
  sessionId: string;
  username: string;
  token: string;
  expiresAt: string;
  apiUrl: string;
  isActive: boolean;
  lastActivity: string;
}

export class ConsolidatedGP51Service {
  private static instance: ConsolidatedGP51Service;
  private currentSession: GP51Session | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private sessionListeners: ((session: GP51Session | null) => void)[] = [];

  private constructor() {
    this.initializeSessionRecovery();
  }

  static getInstance(): ConsolidatedGP51Service {
    if (!ConsolidatedGP51Service.instance) {
      ConsolidatedGP51Service.instance = new ConsolidatedGP51Service();
    }
    return ConsolidatedGP51Service.instance;
  }

  /**
   * Consolidated authentication method that tries multiple approaches
   */
  async authenticate(config: GP51ConnectionConfig): Promise<GP51ServiceResult<GP51Session>> {
    try {
      console.log('🔐 Starting consolidated GP51 authentication...');

      // Try secure auth first (most secure)
      let result = await this.trySecureAuthentication(config);
      
      if (!result.success) {
        console.log('⚠️ Secure auth failed, trying hybrid approach...');
        result = await this.tryHybridAuthentication(config);
      }

      if (!result.success) {
        console.log('⚠️ Hybrid auth failed, trying standard approach...');
        result = await this.tryStandardAuthentication(config);
      }

      if (result.success && result.data) {
        await this.establishSession(result.data);
        this.scheduleSessionRefresh();
      }

      return result;

    } catch (error) {
      console.error('❌ Consolidated authentication failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
        errorCode: 'CONSOLIDATED_AUTH_ERROR'
      };
    }
  }

  /**
   * Try secure authentication method
   */
  private async trySecureAuthentication(config: GP51ConnectionConfig): Promise<GP51ServiceResult<GP51Session>> {
    try {
      const { data, error } = await supabase.functions.invoke('gp51-secure-auth', {
        body: {
          action: 'authenticate',
          username: config.username,
          password: config.password,
          apiUrl: config.apiUrl
        }
      });

      if (error || !data.success) {
        return {
          success: false,
          error: error?.message || data?.error || 'Secure authentication failed',
          errorCode: 'SECURE_AUTH_FAILED'
        };
      }

      return {
        success: true,
        data: this.createSessionFromAuthData(data, config)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Secure auth error',
        errorCode: 'SECURE_AUTH_ERROR'
      };
    }
  }

  /**
   * Try hybrid authentication method
   */
  private async tryHybridAuthentication(config: GP51ConnectionConfig): Promise<GP51ServiceResult<GP51Session>> {
    try {
      const { data, error } = await supabase.functions.invoke('gp51-hybrid-auth', {
        body: {
          action: 'authenticate',
          username: config.username,
          password: config.password
        }
      });

      if (error || !data.success) {
        return {
          success: false,
          error: error?.message || data?.error || 'Hybrid authentication failed',
          errorCode: 'HYBRID_AUTH_FAILED'
        };
      }

      return {
        success: true,
        data: this.createSessionFromAuthData(data, config)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Hybrid auth error',
        errorCode: 'HYBRID_AUTH_ERROR'
      };
    }
  }

  /**
   * Try standard authentication method
   */
  private async tryStandardAuthentication(config: GP51ConnectionConfig): Promise<GP51ServiceResult<GP51Session>> {
    try {
      const { data, error } = await supabase.functions.invoke('gp51-service', {
        body: {
          action: 'authenticate',
          username: config.username,
          password: config.password,
          apiUrl: config.apiUrl
        }
      });

      if (error || !data.success) {
        return {
          success: false,
          error: error?.message || data?.error || 'Standard authentication failed',
          errorCode: 'STANDARD_AUTH_FAILED'
        };
      }

      return {
        success: true,
        data: this.createSessionFromAuthData(data, config)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Standard auth error',
        errorCode: 'STANDARD_AUTH_ERROR'
      };
    }
  }

  /**
   * Create standardized session object from auth data
   */
  private createSessionFromAuthData(authData: any, config: GP51ConnectionConfig): GP51Session {
    const now = new Date();
    const expiresAt = authData.expiresAt || new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString();

    return {
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      username: config.username,
      token: authData.token,
      expiresAt,
      apiUrl: config.apiUrl || 'https://www.gps51.com/webapi',
      isActive: true,
      lastActivity: now.toISOString()
    };
  }

  /**
   * Establish and store session
   */
  private async establishSession(session: GP51Session): Promise<void> {
    this.currentSession = session;
    
    // Store in database for persistence
    try {
      await supabase.from('gp51_sessions').upsert({
        id: session.sessionId,
        username: session.username,
        gp51_token: session.token,
        token_expires_at: session.expiresAt,
        api_url: session.apiUrl,
        is_active: true,
        last_activity_at: session.lastActivity,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.warn('⚠️ Failed to persist session to database:', error);
    }

    // Notify listeners
    this.notifySessionListeners(session);
  }

  /**
   * Schedule automatic session refresh
   */
  private scheduleSessionRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    if (!this.currentSession) return;

    const expiresAt = new Date(this.currentSession.expiresAt).getTime();
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;
    const refreshTime = Math.max(timeUntilExpiry - 30 * 60 * 1000, 5 * 60 * 1000); // Refresh 30 mins before expiry, but at least 5 mins

    this.refreshTimer = setTimeout(async () => {
      console.log('🔄 Auto-refreshing GP51 session...');
      await this.refreshSession();
    }, refreshTime);
  }

  /**
   * Refresh current session
   */
  async refreshSession(): Promise<GP51ServiceResult<GP51Session>> {
    if (!this.currentSession) {
      return {
        success: false,
        error: 'No active session to refresh',
        errorCode: 'NO_SESSION'
      };
    }

    try {
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: {
          action: 'refresh_session',
          sessionId: this.currentSession.sessionId
        }
      });

      if (error || !data.success) {
        return {
          success: false,
          error: error?.message || data?.error || 'Session refresh failed',
          errorCode: 'REFRESH_FAILED'
        };
      }

      // Update current session
      this.currentSession.token = data.token;
      this.currentSession.expiresAt = data.expiresAt;
      this.currentSession.lastActivity = new Date().toISOString();

      await this.establishSession(this.currentSession);
      this.scheduleSessionRefresh();

      return {
        success: true,
        data: this.currentSession
      };

    } catch (error) {
      console.error('❌ Session refresh error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Refresh error',
        errorCode: 'REFRESH_ERROR'
      };
    }
  }

  /**
   * Get current session
   */
  getCurrentSession(): GP51Session | null {
    return this.currentSession;
  }

  /**
   * Check if session is valid and active
   */
  isSessionValid(): boolean {
    if (!this.currentSession) return false;
    
    const now = new Date();
    const expiresAt = new Date(this.currentSession.expiresAt);
    
    return this.currentSession.isActive && expiresAt > now;
  }

  /**
   * Test connection with current session
   */
  async testConnection(): Promise<GP51ServiceResult> {
    if (!this.isSessionValid()) {
      return {
        success: false,
        error: 'No valid session available',
        errorCode: 'NO_VALID_SESSION'
      };
    }

    try {
      const { data, error } = await supabase.functions.invoke('gp51-service', {
        body: {
          action: 'test_connection',
          token: this.currentSession!.token
        }
      });

      if (error) {
        return {
          success: false,
          error: error.message,
          errorCode: 'CONNECTION_TEST_ERROR'
        };
      }

      return {
        success: data.success || false,
        error: data.error
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
        errorCode: 'CONNECTION_TEST_FAILED'
      };
    }
  }

  /**
   * Subscribe to session changes
   */
  subscribeToSession(callback: (session: GP51Session | null) => void): () => void {
    this.sessionListeners.push(callback);
    
    // Immediately call with current session
    callback(this.currentSession);
    
    // Return unsubscribe function
    return () => {
      this.sessionListeners = this.sessionListeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Notify all session listeners
   */
  private notifySessionListeners(session: GP51Session | null): void {
    this.sessionListeners.forEach(listener => {
      try {
        listener(session);
      } catch (error) {
        console.error('Error in session listener:', error);
      }
    });
  }

  /**
   * Initialize session recovery on startup
   */
  private async initializeSessionRecovery(): Promise<void> {
    try {
      // Try to recover session from database
      const { data: sessions, error } = await supabase
        .from('gp51_sessions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && sessions && sessions.length > 0) {
        const dbSession = sessions[0];
        const expiresAt = new Date(dbSession.token_expires_at);
        
        if (expiresAt > new Date()) {
          console.log('🔄 Recovering GP51 session from database...');
          
          this.currentSession = {
            sessionId: dbSession.id,
            username: dbSession.username,
            token: dbSession.gp51_token,
            expiresAt: dbSession.token_expires_at,
            apiUrl: dbSession.api_url || 'https://www.gps51.com/webapi',
            isActive: true,
            lastActivity: dbSession.last_activity_at || new Date().toISOString()
          };

          this.scheduleSessionRefresh();
          this.notifySessionListeners(this.currentSession);
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to recover session:', error);
    }
  }

  /**
   * Terminate current session
   */
  async terminate(): Promise<void> {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    if (this.currentSession) {
      try {
        // Mark session as inactive in database
        await supabase
          .from('gp51_sessions')
          .update({ 
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', this.currentSession.sessionId);
      } catch (error) {
        console.warn('⚠️ Failed to deactivate session in database:', error);
      }

      this.currentSession = null;
      this.notifySessionListeners(null);
    }
  }
}

// Export singleton instance
export const consolidatedGP51Service = ConsolidatedGP51Service.getInstance();
