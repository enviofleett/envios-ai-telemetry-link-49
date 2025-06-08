
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

export class ProductionGP51SessionManager {
  private static instance: ProductionGP51SessionManager;
  private currentSession: GP51SessionInfo | null = null;
  private currentHealth: SessionHealth | null = null;
  private healthCheckInterval: number | null = null;
  private sessionListeners: Set<(session: GP51SessionInfo | null) => void> = new Set();
  private healthListeners: Set<(health: SessionHealth) => void> = new Set();

  static getInstance(): ProductionGP51SessionManager {
    if (!ProductionGP51SessionManager.instance) {
      ProductionGP51SessionManager.instance = new ProductionGP51SessionManager();
    }
    return ProductionGP51SessionManager.instance;
  }

  async testConnection(): Promise<SessionHealth> {
    console.log('Testing GP51 connection...');
    
    try {
      const startTime = Date.now();
      
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'test_connection' }
      });

      const latency = Date.now() - startTime;

      if (error) {
        console.error('GP51 connection test failed:', error);
        const health: SessionHealth = {
          status: 'disconnected',
          lastCheck: new Date(),
          errorMessage: error.message,
          needsRefresh: true
        };
        this.updateHealth(health);
        return health;
      }

      if (!data.success) {
        console.error('GP51 connection test failed:', data.error);
        const health: SessionHealth = {
          status: 'auth_error',
          lastCheck: new Date(),
          errorMessage: data.error,
          needsRefresh: true
        };
        this.updateHealth(health);
        return health;
      }

      const health: SessionHealth = {
        status: 'connected',
        lastCheck: new Date(),
        latency,
        sessionInfo: {
          token: 'hidden',
          username: data.username,
          expiresAt: new Date(data.expiresAt),
          isValid: true,
          userId: data.username,
          latency
        },
        needsRefresh: false
      };

      this.updateHealth(health);
      return health;

    } catch (error) {
      console.error('GP51 connection test error:', error);
      const health: SessionHealth = {
        status: 'disconnected',
        lastCheck: new Date(),
        errorMessage: error.message,
        needsRefresh: true
      };
      this.updateHealth(health);
      return health;
    }
  }

  async refreshSession(): Promise<boolean> {
    console.log('Refreshing GP51 session...');
    
    try {
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'refresh_session' }
      });

      if (error || !data.success) {
        console.error('Session refresh failed:', error || data.error);
        this.updateHealth({
          status: 'auth_error',
          lastCheck: new Date(),
          errorMessage: error?.message || data.error,
          needsRefresh: true
        });
        return false;
      }

      await this.testConnection();
      return true;
    } catch (error) {
      console.error('Session refresh error:', error);
      this.updateHealth({
        status: 'disconnected',
        lastCheck: new Date(),
        errorMessage: error.message,
        needsRefresh: true
      });
      return false;
    }
  }

  async performHealthCheck(): Promise<void> {
    await this.testConnection();
  }

  async attemptReconnection(): Promise<boolean> {
    console.log('Attempting GP51 reconnection...');
    
    this.updateHealth({
      status: 'connecting',
      lastCheck: new Date(),
      needsRefresh: false
    });

    const refreshSuccess = await this.refreshSession();
    if (refreshSuccess) {
      return true;
    }

    // If refresh fails, try test connection
    const health = await this.testConnection();
    return health.status === 'connected';
  }

  startHealthMonitoring(intervalMs: number = 60000): void {
    console.log('Starting GP51 health monitoring...');
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = window.setInterval(async () => {
      await this.performHealthCheck();
    }, intervalMs);

    // Perform initial check
    this.performHealthCheck();
  }

  stopHealthMonitoring(): void {
    console.log('Stopping GP51 health monitoring...');
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  subscribeToSession(callback: (session: GP51SessionInfo | null) => void): () => void {
    this.sessionListeners.add(callback);
    
    // Immediately call with current session
    callback(this.currentSession);
    
    return () => {
      this.sessionListeners.delete(callback);
    };
  }

  subscribeToHealth(callback: (health: SessionHealth) => void): () => void {
    this.healthListeners.add(callback);
    
    // Immediately call with current health
    if (this.currentHealth) {
      callback(this.currentHealth);
    }
    
    return () => {
      this.healthListeners.delete(callback);
    };
  }

  getCurrentHealth(): SessionHealth | null {
    return this.currentHealth;
  }

  getCurrentSession(): GP51SessionInfo | null {
    return this.currentSession;
  }

  private updateHealth(health: SessionHealth): void {
    this.currentHealth = health;
    
    // Notify all health listeners
    this.healthListeners.forEach(callback => {
      try {
        callback(health);
      } catch (error) {
        console.error('Error in health listener:', error);
      }
    });
  }

  private updateSession(session: GP51SessionInfo | null): void {
    this.currentSession = session;
    
    // Notify all session listeners
    this.sessionListeners.forEach(callback => {
      try {
        callback(session);
      } catch (error) {
        console.error('Error in session listener:', error);
      }
    });
  }
}

export const productionGP51SessionManager = ProductionGP51SessionManager.getInstance();
