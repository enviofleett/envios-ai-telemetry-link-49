import { supabase } from '@/integrations/supabase/client';
import { enhancedPollingService } from './enhancedPollingService';
import { vehiclePositionSyncService } from './vehiclePosition/vehiclePositionSyncService';
import { unifiedVehicleDataService } from './unifiedVehicleData';
import { gp51HealthMonitor } from './gp51HealthMonitor';

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
      // Check GP51 platform health (enhanced)
      await this.checkGP51PlatformHealth();
      
      // Check database connectivity
      await this.checkDatabaseHealth();
      
      // Check sync service health
      await this.checkSyncServiceHealth();
      
      // Check memory usage
      await this.checkMemoryUsage();
      
      // Check polling service health
      await this.checkPollingServiceHealth();

      // Check vehicle data integrity
      await this.checkVehicleDataIntegrity();

      const responseTime = Date.now() - startTime;
      this.updateMetric('system_response_time', responseTime, responseTime < 5000 ? 'healthy' : 'warning');

    } catch (error) {
      console.error('Health check failed:', error);
      this.addAlert('error', `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    this.notifySubscribers();
  }

  private async checkGP51PlatformHealth(): Promise<void> {
    try {
      const healthResult = await gp51HealthMonitor.performHealthCheck();
      
      // Update GP51 connection status
      const connectionStatus = healthResult.checks.sessionValidity && healthResult.checks.gp51Connection ? 'healthy' : 'critical';
      this.updateMetric('gp51_connection', healthResult.overall, connectionStatus, 
        `Session: ${healthResult.checks.sessionValidity}, API: ${healthResult.checks.gp51Connection}`);

      // Update vehicle sync status
      const syncStatus = healthResult.checks.vehicleSync ? 'healthy' : 'warning';
      this.updateMetric('gp51_vehicle_sync', `${healthResult.metrics.activeVehicles} active`, syncStatus,
        `${healthResult.metrics.totalVehicles} total vehicles`);

      // Add alerts for critical issues
      if (healthResult.overall === 'critical') {
        this.addAlert('error', `GP51 platform critical: ${healthResult.errors.join(', ')}`);
      } else if (healthResult.overall === 'warning') {
        this.addAlert('warning', `GP51 platform warning: ${healthResult.errors.join(', ')}`);
      }

    } catch (error) {
      this.updateMetric('gp51_connection', 'Error', 'critical', error instanceof Error ? error.message : 'Unknown error');
      this.addAlert('error', `GP51 platform health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async checkVehicleDataIntegrity(): Promise<void> {
    try {
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('id, is_active, last_update, device_status')
        .limit(1000);

      if (error) {
        this.updateMetric('vehicle_data_integrity', 'Error', 'critical', error.message);
        return;
      }

      const totalVehicles = vehicles?.length || 0;
      const activeVehicles = vehicles?.filter(v => v.is_active)?.length || 0;
      const recentlyUpdated = vehicles?.filter(v => {
        const lastUpdate = new Date(v.last_update);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return lastUpdate > oneHourAgo;
      })?.length || 0;

      const integrityScore = totalVehicles > 0 ? (recentlyUpdated / totalVehicles) * 100 : 0;
      const status = integrityScore >= 80 ? 'healthy' : integrityScore >= 50 ? 'warning' : 'critical';
      
      this.updateMetric('vehicle_data_integrity', `${integrityScore.toFixed(1)}%`, status,
        `${recentlyUpdated}/${totalVehicles} recently updated`);

      if (integrityScore < 50 && totalVehicles > 0) {
        this.addAlert('warning', `Low vehicle data freshness: ${integrityScore.toFixed(1)}%`);
      }

    } catch (error) {
      this.updateMetric('vehicle_data_integrity', 'Error', 'warning', error instanceof Error ? error.message : 'Unknown error');
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
