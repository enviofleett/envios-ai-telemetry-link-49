import { supabase } from '@/integrations/supabase/client';

export interface GP51SessionInfo {
  token: string;
  username: string;
  expiresAt: Date;
  isValid: boolean;
  userId?: string;
  sessionId?: string; // Add this field for compatibility
}

export interface SessionHealth {
  status: 'healthy' | 'degraded' | 'critical';
  lastCheck: Date;
  errorMessage?: string;
  apiReachable: boolean;
  dataFlowing: boolean;
  sessionValid: boolean;
}

export class UnifiedGP51SessionManager {
  private static instance: UnifiedGP51SessionManager;
  private currentSession: GP51SessionInfo | null = null;
  private currentHealth: SessionHealth | null = null;
  private refreshPromise: Promise<GP51SessionInfo> | null = null;
  private sessionListeners: Set<(session: GP51SessionInfo | null) => void> = new Set();
  private healthListeners: Set<(health: SessionHealth) => void> = new Set();
  private healthCheckInterval: NodeJS.Timeout | null = null;

  static getInstance(): UnifiedGP51SessionManager {
    if (!UnifiedGP51SessionManager.instance) {
      UnifiedGP51SessionManager.instance = new UnifiedGP51SessionManager();
    }
    return UnifiedGP51SessionManager.instance;
  }

  constructor() {
    this.startHealthMonitoring();
  }

  async validateAndEnsureSession(): Promise<GP51SessionInfo> {
    console.log('🔍 Validating and ensuring GP51 session...');

    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    if (this.currentSession && await this.isSessionValid(this.currentSession)) {
      console.log('✅ Current session is valid');
      return this.currentSession;
    }

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
    const now = new Date();
    const timeUntilExpiry = session.expiresAt.getTime() - now.getTime();
    
    if (timeUntilExpiry <= 5 * 60 * 1000) {
      console.log('⏰ Session expires soon, needs refresh');
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'validate_token', token: session.token }
      });

      return !error && data?.success === true;
    } catch (error) {
      console.warn('Session validation test failed:', error);
      return false;
    }
  }

  private async refreshSession(): Promise<GP51SessionInfo> {
    console.log('🔄 Refreshing GP51 session...');

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated. Please log in first.');
      }

      const { data: envioUser, error: envioUserError } = await supabase
        .from('envio_users')
        .select('id')
        .eq('email', user.email)
        .single();

      if (envioUserError || !envioUser) {
        throw new Error('User profile not found. Please contact support.');
      }

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

      if (expiresAt <= now) {
        console.log('🔄 Session expired, attempting service refresh...');
        
        const { data, error: refreshError } = await supabase.functions.invoke('gp51-service-management', {
          body: { action: 'refresh_session' }
        });

        if (refreshError || !data?.success) {
          await this.clearInvalidSessions(envioUser.id);
          throw new Error('Session refresh failed. Please re-authenticate in Admin Settings.');
        }

        const { error: updateError } = await supabase
          .from('gp51_sessions')
          .update({
            gp51_token: data.token,
            token_expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', latestSession.id);

        if (updateError) {
          console.error('Failed to update session:', updateError);
        }

        this.currentSession = {
          token: data.token,
          username: latestSession.username,
          expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
          isValid: true,
          userId: envioUser.id,
          sessionId: data.token // Use token as sessionId for compatibility
        };
      } else {
        this.currentSession = {
          token: latestSession.gp51_token,
          username: latestSession.username,
          expiresAt: expiresAt,
          isValid: true,
          userId: envioUser.id,
          sessionId: latestSession.gp51_token // Use token as sessionId for compatibility
        };
      }

      console.log(`✅ Session refreshed for user: ${this.currentSession.username}`);
      this.notifySessionListeners(this.currentSession);
      return this.currentSession;

    } catch (error) {
      console.error('❌ Session refresh failed:', error);
      this.currentSession = null;
      this.notifySessionListeners(null);
      throw error;
    }
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

  getCurrentSession(): GP51SessionInfo | null {
    return this.currentSession;
  }

  getCurrentHealth(): SessionHealth | null {
    return this.currentHealth;
  }

  subscribeToSession(callback: (session: GP51SessionInfo | null) => void): () => void {
    this.sessionListeners.add(callback);
    
    if (this.currentSession) {
      callback(this.currentSession);
    }

    return () => {
      this.sessionListeners.delete(callback);
    };
  }

  subscribeToHealth(callback: (health: SessionHealth) => void): () => void {
    this.healthListeners.add(callback);
    
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

  async performHealthCheck(): Promise<SessionHealth> {
    console.log('🏥 Performing GP51 health check...');
    
    const healthCheck: SessionHealth = {
      status: 'critical',
      lastCheck: new Date(),
      apiReachable: false,
      dataFlowing: false,
      sessionValid: false
    };

    try {
      // Check session validity
      if (this.currentSession) {
        healthCheck.sessionValid = await this.isSessionValid(this.currentSession);
      }

      // Test API reachability
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'test_connection' }
      });

      if (!error && data?.success) {
        healthCheck.apiReachable = true;
        
        // Test data flow by fetching a small amount of data
        const testData = await supabase.functions.invoke('gp51-live-import', {
          body: { test: true, limit: 1 }
        });
        
        if (!testData.error && testData.data?.success) {
          healthCheck.dataFlowing = true;
        }
      }

      // Determine overall status
      if (healthCheck.sessionValid && healthCheck.apiReachable && healthCheck.dataFlowing) {
        healthCheck.status = 'healthy';
      } else if (healthCheck.sessionValid && healthCheck.apiReachable) {
        healthCheck.status = 'degraded';
        healthCheck.errorMessage = 'Data flow issues detected';
      } else {
        healthCheck.status = 'critical';
        healthCheck.errorMessage = 'Connection or authentication issues';
      }

    } catch (error) {
      healthCheck.status = 'critical';
      healthCheck.errorMessage = error instanceof Error ? error.message : 'Health check failed';
      console.error('❌ Health check failed:', error);
    }

    this.currentHealth = healthCheck;
    this.notifyHealthListeners(healthCheck);
    
    console.log(`🏥 Health check complete: ${healthCheck.status}`);
    return healthCheck;
  }

  private startHealthMonitoring(): void {
    // Perform initial health check after a short delay
    setTimeout(() => this.performHealthCheck(), 2000);
    
    // Set up periodic health checks every 5 minutes
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 5 * 60 * 1000);
  }

  async attemptReconnection(): Promise<{ success: boolean; message: string }> {
    console.log('🔄 Attempting GP51 reconnection...');
    
    try {
      // Clear current session to force refresh
      this.currentSession = null;
      
      // Attempt to get a new session
      await this.validateAndEnsureSession();
      
      // Perform health check
      const health = await this.performHealthCheck();
      
      if (health.status === 'healthy') {
        return { success: true, message: 'Reconnection successful' };
      } else {
        return { success: false, message: 'Reconnection partially successful but issues remain' };
      }
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Reconnection failed';
      console.error('❌ Reconnection failed:', error);
      return { success: false, message };
    }
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
  }

  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this.sessionListeners.clear();
    this.healthListeners.clear();
  }
}

export const unifiedGP51SessionManager = UnifiedGP51SessionManager.getInstance();
