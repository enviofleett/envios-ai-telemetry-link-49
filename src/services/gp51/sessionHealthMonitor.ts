
import { supabase } from '@/integrations/supabase/client';
import { GP51SessionManager } from './sessionManager';
import { gp51ErrorReporter } from './errorReporter';
import { SessionHealth } from '../sessionValidation/types';

type HealthUpdateCallback = (health: SessionHealth) => void;

export class GP51SessionHealthMonitor {
  private static instance: GP51SessionHealthMonitor;
  private healthStatus: SessionHealth = {
    status: 'critical',
    isValid: false,
    expiresAt: null,
    username: null,
    lastCheck: new Date(),
    consecutiveFailures: 0,
    isAuthError: false,
    latency: null,
    needsRefresh: false
  };
  private callbacks: Set<HealthUpdateCallback> = new Set();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private checkInProgress = false;
  private cacheExpiry: Date | null = null;
  private readonly CACHE_DURATION = 30000; // 30 seconds

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

  clearCache(): void {
    console.log('🧹 Clearing GP51 health monitor cache');
    this.cacheExpiry = null;
  }

  private isCacheValid(): boolean {
    return this.cacheExpiry !== null && new Date() < this.cacheExpiry;
  }

  private setCacheExpiry(): void {
    this.cacheExpiry = new Date(Date.now() + this.CACHE_DURATION);
  }

  async performHealthCheck(): Promise<void> {
    if (this.checkInProgress) return;
    
    this.checkInProgress = true;
    const startTime = Date.now();
    
    try {
      console.log('🏥 Performing GP51 health check...');
      
      // First check if user is authenticated
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session) {
        console.log('⚠️ No valid authentication session during health check');
        const newHealth: SessionHealth = {
          status: 'critical',
          isValid: false,
          expiresAt: null,
          username: null,
          lastCheck: new Date(),
          consecutiveFailures: this.healthStatus.consecutiveFailures + 1,
          isAuthError: true,
          latency: Date.now() - startTime,
          needsRefresh: false
        };
        this.healthStatus = newHealth;
        this.setCacheExpiry();
        this.notifyCallbacks();
        return;
      }
      
      // Test GP51 connection using the edge function
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'test_connection' }
      });

      if (error) {
        console.error('❌ GP51 health check failed:', error);
        const newHealth: SessionHealth = {
          status: 'critical',
          isValid: false,
          expiresAt: null,
          username: null,
          lastCheck: new Date(),
          consecutiveFailures: this.healthStatus.consecutiveFailures + 1,
          isAuthError: false,
          latency: Date.now() - startTime,
          needsRefresh: false,
          errorMessage: error.message || 'Health check failed'
        };
        this.healthStatus = newHealth;
      } else {
        // The edge function now returns a proper SessionHealth object
        this.healthStatus = {
          ...data,
          lastCheck: new Date(data.lastCheck),
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null
        };
      }

      this.setCacheExpiry();
      this.notifyCallbacks();
      
    } catch (error) {
      console.error('❌ Health check failed:', error);
      
      this.healthStatus = {
        status: 'critical',
        isValid: false,
        expiresAt: null,
        username: null,
        lastCheck: new Date(),
        consecutiveFailures: this.healthStatus.consecutiveFailures + 1,
        isAuthError: false,
        latency: Date.now() - startTime,
        needsRefresh: true,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
      
      this.setCacheExpiry();
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
    this.clearCache();
    await this.performHealthCheck();
  }

  onHealthUpdate(callback: HealthUpdateCallback): () => void {
    this.callbacks.add(callback);
    
    // Immediately call with current status if not using stale cache
    if (!this.isCacheValid() || this.healthStatus.lastCheck) {
      callback(this.healthStatus);
    }
    
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
