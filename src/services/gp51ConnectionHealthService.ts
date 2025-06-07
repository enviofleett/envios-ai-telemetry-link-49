
import { supabase } from '@/integrations/supabase/client';

export interface ConnectionHealthStatus {
  status: 'connected' | 'connecting' | 'degraded' | 'disconnected' | 'auth_error';
  lastCheck: Date;
  latency?: number;
  errorMessage?: string;
  sessionInfo?: {
    username: string;
    expiresAt: string;
  };
}

export interface HealthMetric {
  timestamp: Date;
  latency: number;
  success: boolean;
  errorDetails?: string;
}

export class GP51ConnectionHealthService {
  private static instance: GP51ConnectionHealthService;
  private currentStatus: ConnectionHealthStatus | null = null;
  private healthCheckInterval: number | null = null;
  private subscribers: ((status: ConnectionHealthStatus) => void)[] = [];

  static getInstance(): GP51ConnectionHealthService {
    if (!GP51ConnectionHealthService.instance) {
      GP51ConnectionHealthService.instance = new GP51ConnectionHealthService();
    }
    return GP51ConnectionHealthService.instance;
  }

  async performHealthCheck(): Promise<ConnectionHealthStatus> {
    const startTime = Date.now();
    
    try {
      console.log('🔍 Performing GP51 connection health check...');
      
      // Test connection via gp51-service-management function
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'test_connection' }
      });

      const latency = Date.now() - startTime;

      if (error) {
        console.error('❌ GP51 health check failed:', error);
        this.currentStatus = {
          status: 'disconnected',
          lastCheck: new Date(),
          latency,
          errorMessage: error.message || 'Connection test failed'
        };
      } else if (data?.success) {
        console.log('✅ GP51 health check successful');
        this.currentStatus = {
          status: latency > 2000 ? 'degraded' : 'connected',
          lastCheck: new Date(),
          latency,
          sessionInfo: {
            username: data.username,
            expiresAt: data.expiresAt
          }
        };
      } else {
        console.warn('⚠️ GP51 health check returned error:', data?.error);
        this.currentStatus = {
          status: 'auth_error',
          lastCheck: new Date(),
          latency,
          errorMessage: data?.error || 'Authentication failed'
        };
      }

      // Store health metric in database
      await this.storeHealthMetric({
        timestamp: new Date(),
        latency,
        success: this.currentStatus.status === 'connected' || this.currentStatus.status === 'degraded',
        errorDetails: this.currentStatus.errorMessage
      });

      // Notify subscribers
      this.notifySubscribers(this.currentStatus);

      return this.currentStatus;
    } catch (error) {
      console.error('💥 Health check error:', error);
      const latency = Date.now() - startTime;
      
      this.currentStatus = {
        status: 'disconnected',
        lastCheck: new Date(),
        latency,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };

      this.notifySubscribers(this.currentStatus);
      return this.currentStatus;
    }
  }

  async attemptReconnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔄 Attempting GP51 reconnection...');
      
      // Update status to connecting
      this.currentStatus = {
        status: 'connecting',
        lastCheck: new Date()
      };
      this.notifySubscribers(this.currentStatus);

      // Trigger session refresh via settings management
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'refresh_session' }
      });

      if (error || !data?.success) {
        return {
          success: false,
          message: error?.message || data?.error || 'Failed to refresh session'
        };
      }

      // Perform health check to update status
      await this.performHealthCheck();

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

  startMonitoring(intervalMs: number = 60000): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    console.log(`🕐 Starting GP51 health monitoring (interval: ${intervalMs}ms)`);
    
    // Perform initial check
    this.performHealthCheck();

    // Set up periodic checks
    this.healthCheckInterval = window.setInterval(() => {
      this.performHealthCheck();
    }, intervalMs);
  }

  stopMonitoring(): void {
    if (this.healthCheckInterval) {
      console.log('⏹️ Stopping GP51 health monitoring');
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  subscribe(callback: (status: ConnectionHealthStatus) => void): () => void {
    this.subscribers.push(callback);
    
    // Send current status if available
    if (this.currentStatus) {
      callback(this.currentStatus);
    }

    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  getCurrentStatus(): ConnectionHealthStatus | null {
    return this.currentStatus;
  }

  async getHealthHistory(limit: number = 50): Promise<HealthMetric[]> {
    try {
      const { data, error } = await supabase
        .from('gp51_health_metrics')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to fetch health history:', error);
        return [];
      }

      return data?.map(record => ({
        timestamp: new Date(record.timestamp),
        latency: record.latency,
        success: record.success,
        errorDetails: record.error_details
      })) || [];
    } catch (error) {
      console.error('Error fetching health history:', error);
      return [];
    }
  }

  private async storeHealthMetric(metric: HealthMetric): Promise<void> {
    try {
      await supabase
        .from('gp51_health_metrics')
        .insert({
          timestamp: metric.timestamp.toISOString(),
          latency: metric.latency,
          success: metric.success,
          error_details: metric.errorDetails,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to store health metric:', error);
    }
  }

  private notifySubscribers(status: ConnectionHealthStatus): void {
    this.subscribers.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error notifying health status subscriber:', error);
      }
    });
  }
}

export const gp51ConnectionHealthService = GP51ConnectionHealthService.getInstance();
