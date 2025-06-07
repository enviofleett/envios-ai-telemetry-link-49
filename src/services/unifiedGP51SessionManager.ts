
import { supabase } from '@/integrations/supabase/client';

export interface GP51SessionInfo {
  token: string;
  username: string;
  expiresAt: Date;
  isValid: boolean;
  userId: string;
  apiUrl?: string;
  latency?: number;
}

export interface SessionHealth {
  status: 'connected' | 'connecting' | 'degraded' | 'disconnected' | 'auth_error';
  lastCheck: Date;
  latency?: number;
  errorMessage?: string;
  sessionInfo?: GP51SessionInfo;
  needsRefresh: boolean;
}

export class UnifiedGP51SessionManager {
  private static instance: UnifiedGP51SessionManager;
  private currentSession: GP51SessionInfo | null = null;
  private currentHealth: SessionHealth | null = null;
  private refreshPromise: Promise<GP51SessionInfo> | null = null;
  private sessionListeners: Set<(session: GP51SessionInfo | null) => void> = new Set();
  private healthListeners: Set<(health: SessionHealth) => void> = new Set();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private sessionRefreshTimeout: NodeJS.Timeout | null = null;

  // Constants
  private static readonly REFRESH_THRESHOLD = 2 * 60 * 60 * 1000; // 2 hours
  private static readonly HEALTH_CHECK_INTERVAL = 60000; // 1 minute
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 2000; // 2 seconds

  static getInstance(): UnifiedGP51SessionManager {
    if (!UnifiedGP51SessionManager.instance) {
      UnifiedGP51SessionManager.instance = new UnifiedGP51SessionManager();
    }
    return UnifiedGP51SessionManager.instance;
  }

  constructor() {
    this.startHealthMonitoring();
    this.setupProactiveRefresh();
  }

  async validateAndEnsureSession(): Promise<GP51SessionInfo> {
    console.log('🔍 Validating and ensuring GP51 session...');

    // If refresh is in progress, wait for it
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Check current session validity
    if (this.currentSession && await this.isSessionValid(this.currentSession)) {
      console.log('✅ Current session is valid');
      return this.currentSession;
    }

    // Start session refresh
    this.refreshPromise = this.refreshSession();
    
    try {
      const session = await this.refreshPromise;
      this.refreshPromise = null;
      return session;
    } catch (error) {
      this.refreshPromise = null;
      throw error;
    }
  }

  private async isSessionValid(session: GP51SessionInfo): Promise<boolean> {
    // Check expiration time with buffer
    const now = new Date();
    const timeUntilExpiry = session.expiresAt.getTime() - now.getTime();
    
    if (timeUntilExpiry <= 5 * 60 * 1000) { // 5 minutes buffer
      console.log('⏰ Session expires soon, needs refresh');
      return false;
    }

    // Test with GP51 API
    try {
      const startTime = Date.now();
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'validate_token', token: session.token }
      });
      
      const latency = Date.now() - startTime;
      session.latency = latency;

      return !error && data?.success === true;
    } catch (error) {
      console.warn('Session validation test failed:', error);
      return false;
    }
  }

  private async refreshSession(): Promise<GP51SessionInfo> {
    console.log('🔄 Refreshing GP51 session...');

    for (let attempt = 1; attempt <= UnifiedGP51SessionManager.MAX_RETRIES; attempt++) {
      try {
        // Get current user first
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          throw new Error('User not authenticated. Please log in first.');
        }

        // Get user from envio_users table
        const { data: envioUser, error: envioUserError } = await supabase
          .from('envio_users')
          .select('id')
          .eq('email', user.email)
          .single();

        if (envioUserError || !envioUser) {
          throw new Error('User profile not found. Please contact support.');
        }

        // Get latest session for this user
        const { data: sessions, error } = await supabase
          .from('gp51_sessions')
          .select('*')
          .eq('envio_user_id', envioUser.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error || !sessions || sessions.length === 0) {
          throw new Error('No GP51 sessions found. Please authenticate in Admin Settings.');
        }

        const latestSession = sessions[0];
        const expiresAt = new Date(latestSession.token_expires_at);
        const now = new Date();

        // If session is expired, try to refresh via service
        if (expiresAt <= now) {
          console.log('🔄 Session expired, attempting service refresh...');
          
          const { data, error: refreshError } = await supabase.functions.invoke('gp51-service-management', {
            body: { action: 'refresh_session' }
          });

          if (refreshError || !data?.success) {
            if (attempt < UnifiedGP51SessionManager.MAX_RETRIES) {
              console.warn(`Refresh attempt ${attempt} failed, retrying...`);
              await new Promise(resolve => setTimeout(resolve, UnifiedGP51SessionManager.RETRY_DELAY * attempt));
              continue;
            }
            
            await this.clearInvalidSessions(envioUser.id);
            throw new Error('Session refresh failed. Please re-authenticate in Admin Settings.');
          }

          // Update session with new token
          const newExpiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
          
          const { error: updateError } = await supabase
            .from('gp51_sessions')
            .update({
              gp51_token: data.token,
              token_expires_at: newExpiresAt.toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', latestSession.id);

          if (updateError) {
            console.error('Failed to update session:', updateError);
          }

          this.currentSession = {
            token: data.token,
            username: latestSession.username,
            expiresAt: newExpiresAt,
            isValid: true,
            userId: envioUser.id,
            apiUrl: latestSession.api_url
          };
        } else {
          // Use existing valid session
          this.currentSession = {
            token: latestSession.gp51_token,
            username: latestSession.username,
            expiresAt: expiresAt,
            isValid: true,
            userId: envioUser.id,
            apiUrl: latestSession.api_url
          };
        }

        console.log(`✅ Session refreshed for user: ${this.currentSession.username}`);
        this.notifySessionListeners(this.currentSession);
        this.updateHealth('connected', undefined, this.currentSession);
        return this.currentSession;

      } catch (error) {
        if (attempt < UnifiedGP51SessionManager.MAX_RETRIES) {
          console.warn(`Session refresh attempt ${attempt} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, UnifiedGP51SessionManager.RETRY_DELAY * attempt));
          continue;
        }

        console.error('❌ Session refresh failed after all attempts:', error);
        this.currentSession = null;
        this.notifySessionListeners(null);
        this.updateHealth('auth_error', error instanceof Error ? error.message : 'Unknown error');
        throw error;
      }
    }

    throw new Error('Session refresh failed after maximum retries');
  }

  private async clearInvalidSessions(userId: string): Promise<void> {
    try {
      console.log('🧹 Clearing invalid GP51 sessions...');
      
      const { error } = await supabase
        .from('gp51_sessions')
        .delete()
        .eq('envio_user_id', userId)
        .lt('token_expires_at', new Date().toISOString());

      if (error) {
        console.error('Failed to clear invalid sessions:', error);
      } else {
        console.log('✅ Invalid sessions cleared');
      }
    } catch (error) {
      console.error('Error clearing invalid sessions:', error);
    }
  }

  async performHealthCheck(): Promise<SessionHealth> {
    const startTime = Date.now();
    
    try {
      console.log('🔍 Performing GP51 health check...');
      
      // Test connection via gp51-service-management function
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'test_connection' }
      });

      const latency = Date.now() - startTime;

      if (error) {
        this.updateHealth('disconnected', error.message || 'Connection test failed', undefined, latency);
      } else if (data?.success) {
        const health: SessionHealth = {
          status: latency > 2000 ? 'degraded' : 'connected',
          lastCheck: new Date(),
          latency,
          sessionInfo: this.currentSession || undefined,
          needsRefresh: false
        };
        this.updateHealth(health.status, undefined, this.currentSession, latency);
      } else {
        this.updateHealth('auth_error', data?.error || 'Authentication failed', undefined, latency);
      }

      return this.currentHealth!;
    } catch (error) {
      const latency = Date.now() - startTime;
      this.updateHealth('disconnected', error instanceof Error ? error.message : 'Unknown error', undefined, latency);
      return this.currentHealth!;
    }
  }

  private updateHealth(
    status: SessionHealth['status'], 
    errorMessage?: string, 
    sessionInfo?: GP51SessionInfo | null,
    latency?: number
  ): void {
    this.currentHealth = {
      status,
      lastCheck: new Date(),
      latency,
      errorMessage,
      sessionInfo: sessionInfo || undefined,
      needsRefresh: status === 'auth_error' || status === 'disconnected'
    };

    this.notifyHealthListeners(this.currentHealth);
  }

  private startHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    console.log('🕐 Starting GP51 health monitoring');
    
    // Perform initial check
    this.performHealthCheck();

    // Set up periodic checks
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, UnifiedGP51SessionManager.HEALTH_CHECK_INTERVAL);
  }

  private setupProactiveRefresh(): void {
    // Check every 10 minutes if session needs proactive refresh
    setInterval(() => {
      if (this.currentSession) {
        const timeUntilExpiry = this.currentSession.expiresAt.getTime() - Date.now();
        
        if (timeUntilExpiry <= UnifiedGP51SessionManager.REFRESH_THRESHOLD && timeUntilExpiry > 0) {
          console.log('🔄 Proactively refreshing session before expiry');
          this.validateAndEnsureSession().catch(console.error);
        }
      }
    }, 10 * 60 * 1000); // 10 minutes
  }

  getCurrentSession(): GP51SessionInfo | null {
    return this.currentSession;
  }

  getCurrentHealth(): SessionHealth | null {
    return this.currentHealth;
  }

  subscribeToSession(callback: (session: GP51SessionInfo | null) => void): () => void {
    this.sessionListeners.add(callback);
    
    // Send current session immediately
    if (this.currentSession) {
      callback(this.currentSession);
    }

    return () => {
      this.sessionListeners.delete(callback);
    };
  }

  subscribeToHealth(callback: (health: SessionHealth) => void): () => void {
    this.healthListeners.add(callback);
    
    // Send current health immediately
    if (this.currentHealth) {
      callback(this.currentHealth);
    }

    return () => {
      this.healthListeners.delete(callback);
    };
  }

  private notifySessionListeners(session: GP51SessionInfo | null): void {
    this.sessionListeners.forEach(callback => {
      try {
        callback(session);
      } catch (error) {
        console.error('Error notifying session listener:', error);
      }
    });
  }

  private notifyHealthListeners(health: SessionHealth): void {
    this.healthListeners.forEach(callback => {
      try {
        callback(health);
      } catch (error) {
        console.error('Error notifying health listener:', error);
      }
    });
  }

  async forceReauthentication(): Promise<void> {
    console.log('🔄 Forcing GP51 re-authentication...');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: envioUser } = await supabase
          .from('envio_users')
          .select('id')
          .eq('email', user.email)
          .single();
        
        if (envioUser) {
          await this.clearInvalidSessions(envioUser.id);
        }
      }
    } catch (error) {
      console.error('Error during force re-authentication:', error);
    }
    
    this.currentSession = null;
    this.notifySessionListeners(null);
    this.updateHealth('disconnected', 'Session cleared, authentication required');
  }

  async attemptReconnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔄 Attempting GP51 reconnection...');
      
      this.updateHealth('connecting');

      await this.validateAndEnsureSession();

      return {
        success: true,
        message: 'Successfully reconnected to GP51'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Reconnection failed'
      };
    }
  }

  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.sessionRefreshTimeout) {
      clearTimeout(this.sessionRefreshTimeout);
    }
    this.sessionListeners.clear();
    this.healthListeners.clear();
  }
}

export const unifiedGP51SessionManager = UnifiedGP51SessionManager.getInstance();
