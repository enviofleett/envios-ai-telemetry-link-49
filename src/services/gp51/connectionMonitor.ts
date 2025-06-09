
import { supabase } from '@/integrations/supabase/client';
import { gp51ErrorReporter } from './errorReporter';

export interface ConnectionStatus {
  isConnected: boolean;
  lastCheckTime: Date;
  lastSuccessfulConnection?: Date;
  consecutiveFailures: number;
  currentError?: string;
  responseTime?: number;
  apiEndpoint?: string;
  username?: string;
}

export interface ConnectionHealth {
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  message: string;
  recommendations: string[];
  metrics: {
    uptime: number;
    successRate: number;
    avgResponseTime: number;
  };
}

export class GP51ConnectionMonitor {
  private static instance: GP51ConnectionMonitor;
  private currentStatus: ConnectionStatus = {
    isConnected: false,
    lastCheckTime: new Date(),
    consecutiveFailures: 0
  };
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
  private healthListeners: Set<(health: ConnectionHealth) => void> = new Set();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 60000; // 1 minute
  private readonly MAX_CONSECUTIVE_FAILURES = 3;

  static getInstance(): GP51ConnectionMonitor {
    if (!GP51ConnectionMonitor.instance) {
      GP51ConnectionMonitor.instance = new GP51ConnectionMonitor();
    }
    return GP51ConnectionMonitor.instance;
  }

  startMonitoring(): void {
    if (this.monitoringInterval) {
      return; // Already monitoring
    }

    console.log('🔍 Starting GP51 connection monitoring...');
    
    // Initial check
    this.performConnectionCheck();
    
    // Set up periodic monitoring
    this.monitoringInterval = setInterval(() => {
      this.performConnectionCheck();
    }, this.CHECK_INTERVAL);
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('⏹️ Stopped GP51 connection monitoring');
    }
  }

  async performConnectionCheck(): Promise<ConnectionStatus> {
    const startTime = Date.now();
    
    try {
      console.log('🔍 Performing GP51 connection check...');
      
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { action: 'health-check' }
      });

      const responseTime = Date.now() - startTime;

      if (error) {
        throw error;
      }

      const isConnected = data?.success && data?.connected;
      
      this.currentStatus = {
        isConnected,
        lastCheckTime: new Date(),
        responseTime,
        consecutiveFailures: isConnected ? 0 : this.currentStatus.consecutiveFailures + 1,
        lastSuccessfulConnection: isConnected ? new Date() : this.currentStatus.lastSuccessfulConnection,
        currentError: isConnected ? undefined : data?.error || 'Connection check failed',
        apiEndpoint: data?.health?.gp51Status?.apiUrl,
        username: data?.health?.gp51Status?.username
      };

      if (isConnected) {
        console.log('✅ GP51 connection check successful');
      } else {
        console.warn('⚠️ GP51 connection check failed:', this.currentStatus.currentError);
        
        gp51ErrorReporter.reportError({
          type: 'connectivity',
          message: 'GP51 connection check failed',
          details: data,
          severity: this.currentStatus.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES ? 'critical' : 'medium',
          username: this.currentStatus.username
        });
      }

    } catch (error) {
      console.error('❌ GP51 connection check error:', error);
      
      this.currentStatus = {
        isConnected: false,
        lastCheckTime: new Date(),
        responseTime: Date.now() - startTime,
        consecutiveFailures: this.currentStatus.consecutiveFailures + 1,
        currentError: error instanceof Error ? error.message : 'Unknown connection error',
        lastSuccessfulConnection: this.currentStatus.lastSuccessfulConnection
      };

      gp51ErrorReporter.reportError({
        type: 'connectivity',
        message: 'GP51 connection monitoring failed',
        details: error,
        severity: 'high'
      });
    }

    // Notify listeners
    this.notifyStatusListeners(this.currentStatus);
    this.notifyHealthListeners(this.calculateHealth());

    return this.currentStatus;
  }

  getCurrentStatus(): ConnectionStatus {
    return { ...this.currentStatus };
  }

  getConnectionHealth(): ConnectionHealth {
    return this.calculateHealth();
  }

  private calculateHealth(): ConnectionHealth {
    const { isConnected, consecutiveFailures, lastSuccessfulConnection, currentError } = this.currentStatus;
    
    let status: ConnectionHealth['status'] = 'unknown';
    let message = '';
    const recommendations: string[] = [];

    if (isConnected) {
      status = 'healthy';
      message = 'GP51 connection is stable and operational';
    } else if (consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
      status = 'critical';
      message = 'GP51 connection has failed multiple times';
      recommendations.push(
        'Check GP51 credentials and API configuration',
        'Verify network connectivity',
        'Contact GP51 support if issues persist'
      );
    } else if (consecutiveFailures > 0) {
      status = 'warning';
      message = 'GP51 connection experiencing intermittent issues';
      recommendations.push(
        'Monitor connection stability',
        'Check for network issues',
        'Verify GP51 service status'
      );
    } else {
      status = 'unknown';
      message = 'GP51 connection status unknown';
      recommendations.push('Perform connection test to verify status');
    }

    // Calculate metrics
    const now = Date.now();
    const dayAgo = now - (24 * 60 * 60 * 1000);
    const uptime = lastSuccessfulConnection ? 
      Math.max(0, (now - lastSuccessfulConnection.getTime()) / (60 * 60 * 1000)) : 0;

    return {
      status,
      message,
      recommendations,
      metrics: {
        uptime: Math.round(uptime * 100) / 100, // Hours with 2 decimal places
        successRate: consecutiveFailures === 0 ? 100 : Math.max(0, 100 - (consecutiveFailures * 20)),
        avgResponseTime: this.currentStatus.responseTime || 0
      }
    };
  }

  subscribeToStatus(callback: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(callback);
    
    // Send current status immediately
    callback(this.currentStatus);
    
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  subscribeToHealth(callback: (health: ConnectionHealth) => void): () => void {
    this.healthListeners.add(callback);
    
    // Send current health immediately
    callback(this.calculateHealth());
    
    return () => {
      this.healthListeners.delete(callback);
    };
  }

  private notifyStatusListeners(status: ConnectionStatus): void {
    this.statusListeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error notifying status listener:', error);
      }
    });
  }

  private notifyHealthListeners(health: ConnectionHealth): void {
    this.healthListeners.forEach(callback => {
      try {
        callback(health);
      } catch (error) {
        console.error('Error notifying health listener:', error);
      }
    });
  }

  // Fallback mechanism
  async attemptFallbackConnection(alternativeUrl?: string): Promise<boolean> {
    console.log('🔄 Attempting GP51 fallback connection...');
    
    try {
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { 
          action: 'save-gp51-credentials-basic',
          testOnly: true,
          apiUrl: alternativeUrl || 'https://www.gps51.com'
        }
      });

      if (!error && data?.success) {
        console.log('✅ Fallback connection successful');
        return true;
      }
      
      console.warn('⚠️ Fallback connection failed:', data?.error);
      return false;
      
    } catch (error) {
      console.error('❌ Fallback connection error:', error);
      return false;
    }
  }
}

export const gp51ConnectionMonitor = GP51ConnectionMonitor.getInstance();
