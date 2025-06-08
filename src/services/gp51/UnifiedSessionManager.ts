
import { supabase } from '@/integrations/supabase/client';

export interface GP51Session {
  token: string;
  username: string;
  expiresAt: Date;
  isValid: boolean;
  apiUrl?: string;
}

export interface SessionHealth {
  status: 'connected' | 'connecting' | 'degraded' | 'disconnected' | 'auth_error';
  lastCheck: Date;
  latency?: number;
  errorMessage?: string;
  needsRefresh: boolean;
}

export class UnifiedGP51SessionManager {
  private static instance: UnifiedGP51SessionManager;
  private currentSession: GP51Session | null = null;
  private currentHealth: SessionHealth | null = null;
  private sessionListeners: Set<(session: GP51Session | null) => void> = new Set();
  private healthListeners: Set<(health: SessionHealth) => void> = new Set();

  static getInstance(): UnifiedGP51SessionManager {
    if (!UnifiedGP51SessionManager.instance) {
      UnifiedGP51SessionManager.instance = new UnifiedGP51SessionManager();
    }
    return UnifiedGP51SessionManager.instance;
  }

  async validateAndEnsureSession(): Promise<GP51Session | null> {
    try {
      const { data: sessions, error } = await supabase
        .from('gp51_sessions')
        .select('username, gp51_token, token_expires_at, api_url')
        .order('token_expires_at', { ascending: false })
        .limit(1);

      if (error || !sessions || sessions.length === 0) {
        this.updateHealth({
          status: 'disconnected',
          lastCheck: new Date(),
          errorMessage: 'No GP51 sessions found',
          needsRefresh: true
        });
        return null;
      }

      const session = sessions[0];
      const expiresAt = new Date(session.token_expires_at);
      const now = new Date();

      if (expiresAt <= now) {
        this.updateHealth({
          status: 'auth_error',
          lastCheck: new Date(),
          errorMessage: 'Session expired',
          needsRefresh: true
        });
        return null;
      }

      const validSession: GP51Session = {
        token: session.gp51_token,
        username: session.username,
        expiresAt,
        isValid: true,
        apiUrl: session.api_url
      };

      this.currentSession = validSession;
      this.updateHealth({
        status: 'connected',
        lastCheck: new Date(),
        needsRefresh: false
      });

      return validSession;
    } catch (error) {
      this.updateHealth({
        status: 'disconnected',
        lastCheck: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        needsRefresh: true
      });
      return null;
    }
  }

  async performHealthCheck(): Promise<SessionHealth> {
    const session = await this.validateAndEnsureSession();
    
    if (!session) {
      return this.currentHealth || {
        status: 'disconnected',
        lastCheck: new Date(),
        needsRefresh: true
      };
    }

    try {
      const startTime = Date.now();
      
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'test_connection' }
      });

      const latency = Date.now() - startTime;

      if (error || !data?.success) {
        const health: SessionHealth = {
          status: 'degraded',
          lastCheck: new Date(),
          errorMessage: error?.message || data?.error || 'Connection test failed',
          needsRefresh: false,
          latency
        };
        this.updateHealth(health);
        return health;
      }

      const health: SessionHealth = {
        status: 'connected',
        lastCheck: new Date(),
        latency,
        needsRefresh: false
      };
      this.updateHealth(health);
      return health;
    } catch (error) {
      const health: SessionHealth = {
        status: 'disconnected',
        lastCheck: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Health check failed',
        needsRefresh: true
      };
      this.updateHealth(health);
      return health;
    }
  }

  async attemptReconnection(): Promise<{ success: boolean; message: string }> {
    this.updateHealth({
      status: 'connecting',
      lastCheck: new Date(),
      needsRefresh: false
    });

    const health = await this.performHealthCheck();
    
    if (health.status === 'connected') {
      return { success: true, message: 'Reconnection successful' };
    }

    return { 
      success: false, 
      message: health.errorMessage || 'Reconnection failed' 
    };
  }

  async forceReauthentication(): Promise<void> {
    this.currentSession = null;
    this.updateHealth({
      status: 'connecting',
      lastCheck: new Date(),
      needsRefresh: true
    });
  }

  subscribeToSession(callback: (session: GP51Session | null) => void): () => void {
    this.sessionListeners.add(callback);
    callback(this.currentSession);
    return () => this.sessionListeners.delete(callback);
  }

  subscribeToHealth(callback: (health: SessionHealth) => void): () => void {
    this.healthListeners.add(callback);
    if (this.currentHealth) callback(this.currentHealth);
    return () => this.healthListeners.delete(callback);
  }

  getCurrentSession(): GP51Session | null {
    return this.currentSession;
  }

  getCurrentHealth(): SessionHealth | null {
    return this.currentHealth;
  }

  private updateHealth(health: SessionHealth): void {
    this.currentHealth = health;
    this.healthListeners.forEach(callback => {
      try {
        callback(health);
      } catch (error) {
        console.error('Error in health listener:', error);
      }
    });
  }

  private updateSession(session: GP51Session | null): void {
    this.currentSession = session;
    this.sessionListeners.forEach(callback => {
      try {
        callback(session);
      } catch (error) {
        console.error('Error in session listener:', error);
      }
    });
  }
}

export const unifiedGP51SessionManager = UnifiedGP51SessionManager.getInstance();
