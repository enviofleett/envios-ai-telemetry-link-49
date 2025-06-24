
import { supabase } from '@/integrations/supabase/client';

export interface SessionHealth {
  totalSessions: number;
  validSessions: number;
  expiredSessions: number;
  invalidTokens: number;
  recommendations: string[];
  lastChecked: Date;
}

export class SessionHealthMonitor {
  private static instance: SessionHealthMonitor;
  private healthData: SessionHealth | null = null;
  private listeners: Set<(health: SessionHealth) => void> = new Set();
  private checkInterval: NodeJS.Timeout | null = null;

  static getInstance(): SessionHealthMonitor {
    if (!SessionHealthMonitor.instance) {
      SessionHealthMonitor.instance = new SessionHealthMonitor();
    }
    return SessionHealthMonitor.instance;
  }

  async checkSessionHealth(): Promise<SessionHealth> {
    try {
      console.log('🔍 Checking GP51 session health...');
      
      const { data, error } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: { action: 'monitor_session_health' }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error('Session health check failed');
      }

      const healthData: SessionHealth = {
        ...data.health,
        recommendations: data.recommendations || [],
        lastChecked: new Date()
      };

      this.healthData = healthData;
      this.notifyListeners(healthData);

      console.log('✅ Session health check completed:', healthData);
      return healthData;

    } catch (error) {
      console.error('❌ Session health check failed:', error);
      
      const errorHealth: SessionHealth = {
        totalSessions: 0,
        validSessions: 0,
        expiredSessions: 0,
        invalidTokens: 0,
        recommendations: ['Health check failed - please verify GP51 connectivity'],
        lastChecked: new Date()
      };

      this.healthData = errorHealth;
      this.notifyListeners(errorHealth);
      
      throw error;
    }
  }

  startMonitoring(intervalMinutes: number = 5): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Initial check
    this.checkSessionHealth();

    // Set up periodic monitoring
    this.checkInterval = setInterval(() => {
      this.checkSessionHealth().catch(error => {
        console.warn('Periodic session health check failed:', error);
      });
    }, intervalMinutes * 60 * 1000);

    console.log(`🔄 Session health monitoring started (every ${intervalMinutes} minutes)`);
  }

  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('⏹️ Session health monitoring stopped');
    }
  }

  subscribe(callback: (health: SessionHealth) => void): () => void {
    this.listeners.add(callback);
    
    // Send current health data immediately if available
    if (this.healthData) {
      callback(this.healthData);
    }

    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(health: SessionHealth): void {
    this.listeners.forEach(callback => {
      try {
        callback(health);
      } catch (error) {
        console.error('Error notifying session health listener:', error);
      }
    });
  }

  getCurrentHealth(): SessionHealth | null {
    return this.healthData;
  }

  getHealthStatus(): 'healthy' | 'warning' | 'critical' | 'unknown' {
    if (!this.healthData) {
      return 'unknown';
    }

    const { totalSessions, validSessions, expiredSessions, invalidTokens } = this.healthData;

    if (totalSessions === 0) {
      return 'critical';
    }

    if (invalidTokens > 0 || validSessions === 0) {
      return 'critical';
    }

    if (expiredSessions > 0) {
      return 'warning';
    }

    return 'healthy';
  }

  async triggerSessionRefresh(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Triggering session refresh...');
      
      // The session refresh will happen automatically when we try to get a valid session
      const { data, error } = await supabase.functions.invoke('enhanced-bulk-import', {
        body: { action: 'fetch_available_data' }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Check health after refresh attempt
      await this.checkSessionHealth();
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Session refresh failed' 
      };
    }
  }
}

export const sessionHealthMonitor = SessionHealthMonitor.getInstance();
