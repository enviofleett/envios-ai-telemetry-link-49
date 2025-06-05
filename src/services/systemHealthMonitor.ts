import { supabase } from '@/integrations/supabase/client';
import { enhancedPollingService } from './enhancedPollingService';
import { vehiclePositionSyncService } from './vehiclePosition/vehiclePositionSyncService';
import { unifiedVehicleDataService } from './unifiedVehicleData';

interface HealthMetric {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  value: number | string;
  threshold?: number;
  lastChecked: Date;
  message?: string;
}

interface SystemHealthStatus {
  overall: 'healthy' | 'warning' | 'critical';
  metrics: HealthMetric[];
  alerts: HealthAlert[];
  uptime: number;
  responseTime: number;
}

interface HealthAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  resolved: boolean;
}

export class SystemHealthMonitor {
  private metrics: HealthMetric[] = [];
  private alerts: HealthAlert[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private startTime = new Date();
  private subscribers: ((status: SystemHealthStatus) => void)[] = [];

  constructor() {
    this.initializeMonitoring();
  }

  private initializeMonitoring(): void {
    console.log('Initializing system health monitoring...');
    this.startMonitoring();
  }

  public startMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    // Monitor every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.performHealthChecks();
    }, 30000);

    // Perform initial check
    this.performHealthChecks();
  }

  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  private async performHealthChecks(): Promise<void> {
    const startTime = Date.now();

    try {
      // Check GP51 API health
      await this.checkGP51ApiHealth();
      
      // Check database connectivity
      await this.checkDatabaseHealth();
      
      // Check sync service health
      await this.checkSyncServiceHealth();
      
      // Check memory usage
      await this.checkMemoryUsage();
      
      // Check polling service health
      await this.checkPollingServiceHealth();

      const responseTime = Date.now() - startTime;
      this.updateMetric('system_response_time', responseTime, responseTime < 5000 ? 'healthy' : 'warning');

    } catch (error) {
      console.error('Health check failed:', error);
      this.addAlert('error', `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    this.notifySubscribers();
  }

  private async checkGP51ApiHealth(): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { action: 'get-gp51-status' }
      });

      if (error) {
        this.updateMetric('gp51_api', 'Error', 'critical', `API error: ${error.message}`);
        this.addAlert('error', `GP51 API health check failed: ${error.message}`);
        return;
      }

      const status = data?.connected ? 'healthy' : 'warning';
      this.updateMetric('gp51_api', data?.connected ? 'Connected' : 'Disconnected', status);

    } catch (error) {
      this.updateMetric('gp51_api', 'Error', 'critical', error instanceof Error ? error.message : 'Unknown error');
      this.addAlert('error', `GP51 API unreachable: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async checkDatabaseHealth(): Promise<void> {
    try {
      const startTime = Date.now();
      
      const { data, error } = await supabase
        .from('vehicles')
        .select('id')
        .limit(1);

      const queryTime = Date.now() - startTime;

      if (error) {
        this.updateMetric('database', 'Error', 'critical', error.message);
        this.addAlert('error', `Database health check failed: ${error.message}`);
        return;
      }

      const status = queryTime < 1000 ? 'healthy' : queryTime < 3000 ? 'warning' : 'critical';
      this.updateMetric('database', `${queryTime}ms`, status, `Query response time: ${queryTime}ms`);

    } catch (error) {
      this.updateMetric('database', 'Error', 'critical', error instanceof Error ? error.message : 'Unknown error');
      this.addAlert('error', `Database unreachable: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async checkSyncServiceHealth(): Promise<void> {
    try {
      const syncMetrics = vehiclePositionSyncService.getMetrics();
      const timeSinceLastSync = Date.now() - syncMetrics.lastSyncTime.getTime();
      
      // Consider sync healthy if last sync was within 2 minutes
      const status = timeSinceLastSync < 120000 ? 'healthy' : timeSinceLastSync < 300000 ? 'warning' : 'critical';
      
      this.updateMetric('sync_service', `${Math.round(timeSinceLastSync / 1000)}s ago`, status, 
        `Last sync: ${syncMetrics.lastSyncTime.toLocaleTimeString()}`);

      if (syncMetrics.errors > 0) {
        this.addAlert('warning', `Sync service has ${syncMetrics.errors} errors`);
      }

    } catch (error) {
      this.updateMetric('sync_service', 'Error', 'critical', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async checkMemoryUsage(): Promise<void> {
    try {
      // Estimate memory usage based on data service
      const vehicleCount = unifiedVehicleDataService.getAllVehicles().length;
      const estimatedMemory = vehicleCount * 0.5; // Rough estimate in KB
      
      const status = estimatedMemory < 1000 ? 'healthy' : estimatedMemory < 5000 ? 'warning' : 'critical';
      this.updateMetric('memory_usage', `~${estimatedMemory.toFixed(1)}KB`, status, 
        `Estimated usage for ${vehicleCount} vehicles`);

    } catch (error) {
      this.updateMetric('memory_usage', 'Error', 'warning', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async checkPollingServiceHealth(): Promise<void> {
    try {
      const pollingMetrics = enhancedPollingService.getMetrics();
      const successRate = pollingMetrics.totalPolls > 0 ? 
        (pollingMetrics.successfulPolls / pollingMetrics.totalPolls) * 100 : 100;
      
      const status = successRate >= 90 ? 'healthy' : successRate >= 70 ? 'warning' : 'critical';
      
      this.updateMetric('polling_service', `${successRate.toFixed(1)}%`, status, 
        `${pollingMetrics.successfulPolls}/${pollingMetrics.totalPolls} successful`);

    } catch (error) {
      this.updateMetric('polling_service', 'Error', 'critical', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private updateMetric(name: string, value: number | string, status: 'healthy' | 'warning' | 'critical', message?: string): void {
    const existingIndex = this.metrics.findIndex(m => m.name === name);
    const metric: HealthMetric = {
      name,
      value,
      status,
      lastChecked: new Date(),
      message
    };

    if (existingIndex >= 0) {
      this.metrics[existingIndex] = metric;
    } else {
      this.metrics.push(metric);
    }
  }

  private addAlert(type: 'error' | 'warning' | 'info', message: string): void {
    const alert: HealthAlert = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      message,
      timestamp: new Date(),
      resolved: false
    };

    this.alerts.unshift(alert);
    
    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(0, 50);
    }
  }

  public getHealthStatus(): SystemHealthStatus {
    const criticalCount = this.metrics.filter(m => m.status === 'critical').length;
    const warningCount = this.metrics.filter(m => m.status === 'warning').length;
    
    const overall = criticalCount > 0 ? 'critical' : warningCount > 0 ? 'warning' : 'healthy';
    
    const uptime = Date.now() - this.startTime.getTime();
    const responseTimeMetric = this.metrics.find(m => m.name === 'system_response_time');
    const responseTime = responseTimeMetric ? Number(responseTimeMetric.value) : 0;

    return {
      overall,
      metrics: [...this.metrics],
      alerts: this.alerts.filter(a => !a.resolved),
      uptime,
      responseTime
    };
  }

  public subscribe(callback: (status: SystemHealthStatus) => void): () => void {
    this.subscribers.push(callback);
    
    // Send initial status
    callback(this.getHealthStatus());
    
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  private notifySubscribers(): void {
    const status = this.getHealthStatus();
    this.subscribers.forEach(callback => callback(status));
  }

  public resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
  }

  public clearResolvedAlerts(): void {
    this.alerts = this.alerts.filter(a => !a.resolved);
  }
}

export const systemHealthMonitor = new SystemHealthMonitor();
