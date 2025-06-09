
import { supabase } from '@/integrations/supabase/client';
import { gp51SessionManager } from './sessionManager';
import { gp51ErrorReporter } from './errorReporter';

export interface SessionHealth {
  isValid: boolean;
  expiresAt: Date | null;
  username: string | null;
  lastCheck: Date;
  needsRefresh: boolean;
  consecutiveFailures: number;
}

type HealthUpdateCallback = (health: SessionHealth) => void;

export class GP51SessionHealthMonitor {
  private static instance: GP51SessionHealthMonitor;
  private healthStatus: SessionHealth = {
    isValid: false,
    expiresAt: null,
    username: null,
    lastCheck: new Date(),
    needsRefresh: false,
    consecutiveFailures: 0
  };
  private callbacks: Set<HealthUpdateCallback> = new Set();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private checkInProgress = false;

  static getInstance(): GP51SessionHealthMonitor {
    if (!GP51SessionHealthMonitor.instance) {
      GP51SessionHealthMonitor.instance = new GP51SessionHealthMonitor();
    }
    return GP51SessionHealthMonitor.instance;
  }

  startMonitoring(intervalMs: number = 30000): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    console.log('🏥 Starting GP51 session health monitoring...');
    
    // Initial check
    this.performHealthCheck();
    
    // Schedule regular checks
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, intervalMs);
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('🏥 Stopped GP51 session health monitoring');
    }
  }

  async performHealthCheck(): Promise<void> {
    if (this.checkInProgress) return;
    
    this.checkInProgress = true;
    
    try {
      console.log('🏥 Performing GP51 health check...');
      
      const sessionInfo = await gp51SessionManager.validateSession();
      const currentTime = new Date();
      
      const newHealth: SessionHealth = {
        isValid: sessionInfo.valid,
        expiresAt: sessionInfo.expiresAt ? new Date(sessionInfo.expiresAt) : null,
        username: sessionInfo.username || null,
        lastCheck: currentTime,
        needsRefresh: false,
        consecutiveFailures: sessionInfo.valid ? 0 : this.healthStatus.consecutiveFailures + 1
      };

      // Check if session needs refresh (within 10 minutes of expiration)
      if (newHealth.expiresAt) {
        const timeUntilExpiry = newHealth.expiresAt.getTime() - currentTime.getTime();
        newHealth.needsRefresh = timeUntilExpiry < 10 * 60 * 1000; // 10 minutes
      }

      // Report health issues
      if (!newHealth.isValid) {
        gp51ErrorReporter.reportError({
          type: 'connectivity',
          message: `GP51 session health check failed (${newHealth.consecutiveFailures} consecutive failures)`,
          details: sessionInfo.error || 'Session validation failed',
          severity: newHealth.consecutiveFailures > 3 ? 'high' : 'medium'
        });
      }

      this.healthStatus = newHealth;
      this.notifyCallbacks();
      
    } catch (error) {
      console.error('❌ Health check failed:', error);
      
      this.healthStatus = {
        ...this.healthStatus,
        isValid: false,
        lastCheck: new Date(),
        consecutiveFailures: this.healthStatus.consecutiveFailures + 1,
        needsRefresh: true
      };
      
      this.notifyCallbacks();
      
      gp51ErrorReporter.reportError({
        type: 'api',
        message: 'GP51 health check exception',
        details: error,
        severity: 'high'
      });
    } finally {
      this.checkInProgress = false;
    }
  }

  async forceHealthCheck(): Promise<void> {
    await this.performHealthCheck();
  }

  onHealthUpdate(callback: HealthUpdateCallback): () => void {
    this.callbacks.add(callback);
    
    // Immediately call with current status
    callback(this.healthStatus);
    
    return () => {
      this.callbacks.delete(callback);
    };
  }

  getHealthStatus(): SessionHealth {
    return { ...this.healthStatus };
  }

  private notifyCallbacks(): void {
    this.callbacks.forEach(callback => {
      try {
        callback(this.healthStatus);
      } catch (error) {
        console.error('❌ Health callback error:', error);
      }
    });
  }
}

export const sessionHealthMonitor = GP51SessionHealthMonitor.getInstance();
