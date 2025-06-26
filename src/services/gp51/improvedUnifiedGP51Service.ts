
import { supabase } from '@/integrations/supabase/client';

export interface GP51ConnectionConfig {
  username: string;
  password: string;
  apiUrl?: string;
}

export interface GP51Session {
  id: string;
  username: string;
  expiresAt: Date;
  sessionFingerprint?: string;
  isActive: boolean;
  lastActivity?: Date;
}

export interface GP51ServiceResult {
  success: boolean;
  data?: any;
  error?: string;
  requiresReauth?: boolean;
  healthStatus?: any;
}

export interface GP51HealthStatus {
  isHealthy: boolean;
  validSessions: number;
  expiringSoon: number;
  recommendations: string[];
  lastCheck: Date;
}

class ImprovedUnifiedGP51Service {
  private session: GP51Session | null = null;
  private sessionListeners: Set<(session: GP51Session | null) => void> = new Set();
  private healthStatus: GP51HealthStatus | null = null;
  private connectionRetryCount = 0;
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  subscribeToSession(callback: (session: GP51Session | null) => void): () => void {
    this.sessionListeners.add(callback);
    callback(this.session); // Send current session immediately
    
    return () => {
      this.sessionListeners.delete(callback);
    };
  }

  private notifySessionListeners(session: GP51Session | null): void {
    this.session = session;
    this.sessionListeners.forEach(callback => {
      try {
        callback(session);
      } catch (error) {
        console.error('❌ Error notifying session listener:', error);
      }
    });
  }

  async authenticate(config: GP51ConnectionConfig): Promise<GP51ServiceResult> {
    try {
      console.log('🔐 [IMPROVED-UNIFIED] Starting authentication...');
      
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: {
          action: 'authenticate-gp51',
          username: config.username,
          password: config.password,
          apiUrl: config.apiUrl || 'https://www.gps51.com'
        }
      });

      if (error) {
        console.error('❌ [IMPROVED-UNIFIED] Authentication error:', error);
        this.connectionRetryCount++;
        
        if (this.connectionRetryCount < this.maxRetries) {
          console.log(`🔄 [IMPROVED-UNIFIED] Retrying authentication (${this.connectionRetryCount}/${this.maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * this.connectionRetryCount));
          return this.authenticate(config);
        }
        
        return { success: false, error: error.message, requiresReauth: true };
      }

      if (!data.success) {
        console.error('❌ [IMPROVED-UNIFIED] Authentication failed:', data.error);
        return { success: false, error: data.error, requiresReauth: true };
      }

      // Reset retry count on success
      this.connectionRetryCount = 0;

      // Create session object
      const session: GP51Session = {
        id: data.sessionId,
        username: data.username,
        expiresAt: new Date(data.expiresAt),
        sessionFingerprint: data.sessionFingerprint,
        isActive: true,
        lastActivity: new Date()
      };

      this.notifySessionListeners(session);
      
      console.log('✅ [IMPROVED-UNIFIED] Authentication successful');
      return { success: true, data: session };

    } catch (error) {
      console.error('❌ [IMPROVED-UNIFIED] Authentication exception:', error);
      this.connectionRetryCount++;
      
      if (this.connectionRetryCount < this.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * this.connectionRetryCount));
        return this.authenticate(config);
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
        requiresReauth: true
      };
    }
  }

  async testConnection(): Promise<GP51ServiceResult> {
    try {
      console.log('🧪 [IMPROVED-UNIFIED] Testing connection...');
      
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { action: 'enhanced-gp51-status' }
      });

      if (error) {
        console.error('❌ [IMPROVED-UNIFIED] Connection test error:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ [IMPROVED-UNIFIED] Connection test result:', data);
      
      // Update session if we have status data
      if (data.connected && data.username) {
        const session: GP51Session = {
          id: data.statusDetails?.sessionId || 'unknown',
          username: data.username,
          expiresAt: new Date(data.expiresAt),
          isActive: true,
          lastActivity: data.statusDetails?.lastActivity ? new Date(data.statusDetails.lastActivity) : new Date()
        };
        
        this.notifySessionListeners(session);
      } else if (!data.connected) {
        this.notifySessionListeners(null);
      }

      return {
        success: data.connected,
        data: data,
        error: data.connected ? undefined : data.message,
        requiresReauth: data.requiresAuth,
        healthStatus: data.healthCheck
      };

    } catch (error) {
      console.error('❌ [IMPROVED-UNIFIED] Connection test exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  async refreshSession(): Promise<GP51ServiceResult> {
    try {
      console.log('🔄 [IMPROVED-UNIFIED] Refreshing session...');
      
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { action: 'smart-session-refresh' }
      });

      if (error) {
        console.error('❌ [IMPROVED-UNIFIED] Session refresh error:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ [IMPROVED-UNIFIED] Session refresh result:', data);
      
      if (data.requiresReauth) {
        this.notifySessionListeners(null);
      }

      return {
        success: data.refreshed,
        error: data.error,
        requiresReauth: data.requiresReauth
      };

    } catch (error) {
      console.error('❌ [IMPROVED-UNIFIED] Session refresh exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Session refresh failed'
      };
    }
  }

  async getConnectionHealth(): Promise<GP51HealthStatus> {
    try {
      console.log('🏥 [IMPROVED-UNIFIED] Getting connection health...');
      
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { action: 'comprehensive-health-check' }
      });

      if (error) {
        console.error('❌ [IMPROVED-UNIFIED] Health check error:', error);
        throw error;
      }

      const healthStatus: GP51HealthStatus = {
        isHealthy: data.isHealthy,
        validSessions: data.sessionStats?.valid || 0,
        expiringSoon: data.sessionStats?.expiringSoon || 0,
        recommendations: data.recommendations || [],
        lastCheck: new Date()
      };

      this.healthStatus = healthStatus;
      console.log('✅ [IMPROVED-UNIFIED] Health check complete:', healthStatus);
      
      return healthStatus;

    } catch (error) {
      console.error('❌ [IMPROVED-UNIFIED] Health check exception:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      console.log('🔌 [IMPROVED-UNIFIED] Disconnecting...');
      
      const { error } = await supabase.functions.invoke('settings-management', {
        body: { action: 'clear-gp51-sessions' }
      });

      if (error) {
        console.error('❌ [IMPROVED-UNIFIED] Disconnect error:', error);
      }

      this.notifySessionListeners(null);
      this.healthStatus = null;
      this.connectionRetryCount = 0;
      
      console.log('✅ [IMPROVED-UNIFIED] Disconnected successfully');

    } catch (error) {
      console.error('❌ [IMPROVED-UNIFIED] Disconnect exception:', error);
      this.notifySessionListeners(null);
    }
  }

  isSessionValid(): boolean {
    if (!this.session) return false;
    
    const now = new Date();
    const expiresAt = new Date(this.session.expiresAt);
    
    return expiresAt > now && this.session.isActive;
  }

  getCurrentSession(): GP51Session | null {
    return this.session;
  }

  getHealthStatus(): GP51HealthStatus | null {
    return this.healthStatus;
  }

  // Auto-refresh mechanism
  private startAutoRefresh(): void {
    const checkInterval = 5 * 60 * 1000; // 5 minutes
    
    setInterval(async () => {
      if (this.session && this.isSessionValid()) {
        const expiresAt = new Date(this.session.expiresAt);
        const now = new Date();
        const timeUntilExpiry = expiresAt.getTime() - now.getTime();
        const hoursUntilExpiry = timeUntilExpiry / (1000 * 60 * 60);
        
        // Auto-refresh if expiring within 2 hours
        if (hoursUntilExpiry <= 2) {
          console.log('⏰ [IMPROVED-UNIFIED] Auto-refreshing session...');
          await this.refreshSession();
        }
      }
    }, checkInterval);
  }
}

export const improvedUnifiedGP51Service = new ImprovedUnifiedGP51Service();

// Start auto-refresh mechanism
if (typeof window !== 'undefined') {
  (improvedUnifiedGP51Service as any).startAutoRefresh();
}
