
import { supabase } from '@/integrations/supabase/client';
import { enhancedGP51SessionManager } from './enhancedGP51SessionManager';

export interface SessionHealth {
  isHealthy: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  lastValidated: Date | null;
  issues: string[];
  sessionAge: number;
  tokenExpiry: Date | null;
  connectionLatency?: number;
}

export interface HealthStatus {
  overallHealth: 'excellent' | 'good' | 'warning' | 'critical';
  uptime: number;
  lastCheck: Date;
  recommendations: string[];
}

export class SessionHealthMonitor {
  private static instance: SessionHealthMonitor;
  private healthCheckInterval: number | null = null;
  private currentHealth: SessionHealth | null = null;
  private subscribers: Set<(health: SessionHealth) => void> = new Set();
  private healthHistory: SessionHealth[] = [];
  private readonly MAX_HISTORY = 50;

  private constructor() {}

  static getInstance(): SessionHealthMonitor {
    if (!SessionHealthMonitor.instance) {
      SessionHealthMonitor.instance = new SessionHealthMonitor();
    }
    return SessionHealthMonitor.instance;
  }

  async checkSessionHealth(): Promise<SessionHealth> {
    const startTime = Date.now();
    
    try {
      const session = enhancedGP51SessionManager.getCurrentSession();
      
      if (!session) {
        const health: SessionHealth = {
          isHealthy: false,
          riskLevel: 'high',
          lastValidated: null,
          issues: ['No active session'],
          sessionAge: 0,
          tokenExpiry: null
        };
        
        this.updateHealth(health);
        return health;
      }

      // Check session validation
      const validation = await enhancedGP51SessionManager.validateCurrentSession();
      const connectionLatency = Date.now() - startTime;
      
      // Calculate session age
      const sessionAge = Date.now() - session.lastValidated.getTime();
      
      const health: SessionHealth = {
        isHealthy: validation.isValid,
        riskLevel: validation.riskLevel,
        lastValidated: session.lastValidated,
        issues: validation.reasons,
        sessionAge,
        tokenExpiry: session.expiresAt,
        connectionLatency
      };

      this.updateHealth(health);
      return health;
      
    } catch (error) {
      const health: SessionHealth = {
        isHealthy: false,
        riskLevel: 'high',
        lastValidated: null,
        issues: [`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        sessionAge: 0,
        tokenExpiry: null,
        connectionLatency: Date.now() - startTime
      };
      
      this.updateHealth(health);
      return health;
    }
  }

  private updateHealth(health: SessionHealth): void {
    this.currentHealth = health;
    
    // Add to history
    this.healthHistory.push({ ...health });
    if (this.healthHistory.length > this.MAX_HISTORY) {
      this.healthHistory.shift();
    }

    // Notify subscribers
    this.subscribers.forEach(callback => {
      try {
        callback(health);
      } catch (error) {
        console.error('Health monitor subscriber error:', error);
      }
    });
  }

  subscribe(callback: (health: SessionHealth) => void): () => void {
    this.subscribers.add(callback);
    
    // Immediately notify with current health if available
    if (this.currentHealth) {
      callback(this.currentHealth);
    }
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  startMonitoring(intervalMinutes: number = 2): void {
    this.stopMonitoring();
    
    // Initial check
    this.checkSessionHealth();
    
    // Set up interval
    this.healthCheckInterval = window.setInterval(() => {
      this.checkSessionHealth();
    }, intervalMinutes * 60 * 1000);
    
    console.log(`🏥 Session health monitoring started (checking every ${intervalMinutes} minutes)`);
  }

  stopMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      console.log('🏥 Session health monitoring stopped');
    }
  }

  getCurrentHealth(): SessionHealth | null {
    return this.currentHealth;
  }

  getHealthHistory(): SessionHealth[] {
    return [...this.healthHistory];
  }

  getHealthStatus(): HealthStatus {
    if (!this.currentHealth) {
      return {
        overallHealth: 'critical',
        uptime: 0,
        lastCheck: new Date(),
        recommendations: ['No health data available', 'Start monitoring to get health status']
      };
    }

    const recommendations: string[] = [];
    let overallHealth: 'excellent' | 'good' | 'warning' | 'critical' = 'excellent';

    // Analyze health
    if (!this.currentHealth.isHealthy) {
      overallHealth = 'critical';
      recommendations.push('Session is unhealthy - consider re-authentication');
    } else if (this.currentHealth.riskLevel === 'high') {
      overallHealth = 'critical';
      recommendations.push('High risk level detected');
    } else if (this.currentHealth.riskLevel === 'medium') {
      overallHealth = 'warning';
      recommendations.push('Medium risk level - monitor closely');
    } else if (this.currentHealth.connectionLatency && this.currentHealth.connectionLatency > 5000) {
      overallHealth = 'warning';
      recommendations.push('High connection latency detected');
    } else {
      overallHealth = 'good';
    }

    // Session age recommendations
    if (this.currentHealth.sessionAge > 6 * 60 * 60 * 1000) { // 6 hours
      recommendations.push('Session is getting old - consider refreshing');
    }

    // Token expiry recommendations
    if (this.currentHealth.tokenExpiry) {
      const timeUntilExpiry = this.currentHealth.tokenExpiry.getTime() - Date.now();
      if (timeUntilExpiry < 60 * 60 * 1000) { // 1 hour
        recommendations.push('Token expires soon - refresh recommended');
      }
    }

    const uptime = this.healthHistory.filter(h => h.isHealthy).length / Math.max(this.healthHistory.length, 1) * 100;

    return {
      overallHealth,
      uptime,
      lastCheck: new Date(),
      recommendations: recommendations.length > 0 ? recommendations : ['Session is healthy']
    };
  }

  async triggerSessionRefresh(): Promise<{ success: boolean; error?: string }> {
    try {
      const { consolidatedGP51Service } = await import('../gp51/ConsolidatedGP51Service');
      const result = await consolidatedGP51Service.refreshSession();
      
      if (result.success) {
        // Trigger immediate health check after refresh
        await this.checkSessionHealth();
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Session refresh failed'
      };
    }
  }
}

export const sessionHealthMonitor = SessionHealthMonitor.getInstance();
