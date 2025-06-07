import { enhancedCachingService } from './EnhancedCachingService';
import { databasePerformanceAnalyzer } from './DatabasePerformanceAnalyzer';

export interface SLAMetrics {
  uptime: number;
  responseTime: number;
  errorRate: number;
  throughput: number;
  availability: number;
}

export interface PerformanceAlert {
  id: string;
  type: 'sla_breach' | 'performance_regression' | 'resource_exhaustion' | 'custom';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  metrics: any;
  acknowledged: boolean;
  resolved: boolean;
}

export interface PerformanceBaseline {
  metric: string;
  baseline: number;
  tolerance: number;
  lastUpdated: Date;
}

export class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private alerts: PerformanceAlert[] = [];
  private baselines: Map<string, PerformanceBaseline> = new Map();
  private slaTargets = {
    uptime: 99.9, // 99.9%
    responseTime: 2000, // 2 seconds
    errorRate: 1, // 1%
    throughput: 100 // requests per minute
  };
  
  private metrics = {
    requests: 0,
    successfulRequests: 0,
    totalResponseTime: 0,
    errors: 0,
    startTime: Date.now()
  };

  static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  constructor() {
    this.initializeBaselines();
    this.startMonitoring();
  }

  private initializeBaselines(): void {
    // Set initial performance baselines
    this.baselines.set('response_time', {
      metric: 'response_time',
      baseline: 1000, // 1 second
      tolerance: 0.2, // 20% deviation
      lastUpdated: new Date()
    });

    this.baselines.set('memory_usage', {
      metric: 'memory_usage',
      baseline: 50, // 50MB
      tolerance: 0.3, // 30% deviation
      lastUpdated: new Date()
    });

    this.baselines.set('cache_hit_rate', {
      metric: 'cache_hit_rate',
      baseline: 80, // 80%
      tolerance: 0.1, // 10% deviation
      lastUpdated: new Date()
    });
  }

  private startMonitoring(): void {
    // Monitor SLA metrics every minute
    setInterval(() => {
      this.checkSLAMetrics();
    }, 60000);

    // Check for performance regressions every 5 minutes
    setInterval(() => {
      this.detectPerformanceRegression();
    }, 300000);

    // Update baselines every hour
    setInterval(() => {
      this.updateBaselines();
    }, 3600000);
  }

  public trackRequest(startTime: number): (success: boolean, responseSize?: number) => void {
    return (success: boolean, responseSize?: number) => {
      const responseTime = Date.now() - startTime;
      
      this.metrics.requests++;
      this.metrics.totalResponseTime += responseTime;
      
      if (success) {
        this.metrics.successfulRequests++;
      } else {
        this.metrics.errors++;
      }

      // Check for immediate performance issues
      if (responseTime > this.slaTargets.responseTime) {
        this.createAlert({
          type: 'sla_breach',
          severity: responseTime > this.slaTargets.responseTime * 2 ? 'critical' : 'high',
          message: `Slow response time: ${responseTime}ms (target: ${this.slaTargets.responseTime}ms)`,
          metrics: { responseTime, target: this.slaTargets.responseTime }
        });
      }
    };
  }

  private checkSLAMetrics(): void {
    const slaMetrics = this.getSLAMetrics();
    
    // Check uptime
    if (slaMetrics.uptime < this.slaTargets.uptime) {
      this.createAlert({
        type: 'sla_breach',
        severity: 'critical',
        message: `Uptime SLA breach: ${slaMetrics.uptime.toFixed(2)}% (target: ${this.slaTargets.uptime}%)`,
        metrics: { uptime: slaMetrics.uptime, target: this.slaTargets.uptime }
      });
    }

    // Check error rate
    if (slaMetrics.errorRate > this.slaTargets.errorRate) {
      this.createAlert({
        type: 'sla_breach',
        severity: slaMetrics.errorRate > this.slaTargets.errorRate * 2 ? 'critical' : 'high',
        message: `Error rate SLA breach: ${slaMetrics.errorRate.toFixed(2)}% (target: ${this.slaTargets.errorRate}%)`,
        metrics: { errorRate: slaMetrics.errorRate, target: this.slaTargets.errorRate }
      });
    }

    // Check throughput
    if (slaMetrics.throughput < this.slaTargets.throughput * 0.8) {
      this.createAlert({
        type: 'sla_breach',
        severity: 'medium',
        message: `Low throughput: ${slaMetrics.throughput.toFixed(0)} req/min (target: ${this.slaTargets.throughput})`,
        metrics: { throughput: slaMetrics.throughput, target: this.slaTargets.throughput }
      });
    }
  }

  private detectPerformanceRegression(): void {
    const currentMetrics = this.getCurrentPerformanceMetrics();
    
    for (const [metricName, baseline] of this.baselines) {
      const currentValue = currentMetrics[metricName];
      if (currentValue === undefined) continue;

      const deviation = Math.abs(currentValue - baseline.baseline) / baseline.baseline;
      
      if (deviation > baseline.tolerance) {
        this.createAlert({
          type: 'performance_regression',
          severity: deviation > baseline.tolerance * 2 ? 'high' : 'medium',
          message: `Performance regression in ${metricName}: ${currentValue} vs baseline ${baseline.baseline} (${(deviation * 100).toFixed(1)}% deviation)`,
          metrics: { 
            metric: metricName, 
            current: currentValue, 
            baseline: baseline.baseline, 
            deviation 
          }
        });
      }
    }
  }

  private getCurrentPerformanceMetrics(): Record<string, number> {
    const dbMetrics = databasePerformanceAnalyzer.getPerformanceMetrics();
    const cacheStats = enhancedCachingService.getStats();
    const averageResponseTime = this.metrics.requests > 0 
      ? this.metrics.totalResponseTime / this.metrics.requests 
      : 0;

    return {
      response_time: averageResponseTime,
      memory_usage: this.estimateMemoryUsage(),
      cache_hit_rate: cacheStats.hitRate,
      db_query_time: dbMetrics.averageQueryTime,
      error_rate: this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests) * 100 : 0
    };
  }

  private estimateMemoryUsage(): number {
    // Estimate memory usage based on cache size and application state
    const cacheStats = enhancedCachingService.getStats();
    return cacheStats.totalSize * 0.1; // Rough estimate in MB
  }

  private updateBaselines(): void {
    const currentMetrics = this.getCurrentPerformanceMetrics();
    
    for (const [metricName, baseline] of this.baselines) {
      const currentValue = currentMetrics[metricName];
      if (currentValue === undefined) continue;

      // Update baseline with exponential moving average
      const alpha = 0.1; // Smoothing factor
      const newBaseline = alpha * currentValue + (1 - alpha) * baseline.baseline;
      
      this.baselines.set(metricName, {
        ...baseline,
        baseline: newBaseline,
        lastUpdated: new Date()
      });
    }

    console.debug('Updated performance baselines');
  }

  private createAlert(alertData: Omit<PerformanceAlert, 'id' | 'timestamp' | 'acknowledged' | 'resolved'>): void {
    const alert: PerformanceAlert = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      acknowledged: false,
      resolved: false,
      ...alertData
    };

    this.alerts.unshift(alert);
    
    // Keep only recent alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(0, 100);
    }

    console.warn(`Performance Alert [${alert.severity}]:`, alert.message);
    
    // Auto-escalate critical alerts
    if (alert.severity === 'critical') {
      this.escalateAlert(alert);
    }
  }

  private escalateAlert(alert: PerformanceAlert): void {
    console.error('CRITICAL PERFORMANCE ALERT - ESCALATING:', alert);
    
    // In a real implementation, this would:
    // - Send notifications to on-call engineers
    // - Create incident tickets
    // - Trigger automated recovery procedures
  }

  public getSLAMetrics(): SLAMetrics {
    const uptime = Date.now() - this.metrics.startTime;
    const uptimeHours = uptime / (1000 * 60 * 60);
    const errorRate = this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests) * 100 : 0;
    const averageResponseTime = this.metrics.requests > 0 ? this.metrics.totalResponseTime / this.metrics.requests : 0;
    const throughput = this.metrics.requests / (uptime / (1000 * 60)); // requests per minute

    return {
      uptime: Math.min(99.9, 100 - (errorRate * 0.1)), // Simplified uptime calculation
      responseTime: averageResponseTime,
      errorRate,
      throughput,
      availability: 100 - errorRate
    };
  }

  public getAlerts(filter?: { severity?: string; resolved?: boolean }): PerformanceAlert[] {
    let filteredAlerts = this.alerts;

    if (filter?.severity) {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === filter.severity);
    }

    if (filter?.resolved !== undefined) {
      filteredAlerts = filteredAlerts.filter(alert => alert.resolved === filter.resolved);
    }

    return filteredAlerts;
  }

  public acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  public resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  public getPerformanceDashboardData() {
    const slaMetrics = this.getSLAMetrics();
    const dbMetrics = databasePerformanceAnalyzer.getPerformanceMetrics();
    const cacheStats = enhancedCachingService.getStats();
    const currentMetrics = this.getCurrentPerformanceMetrics();

    return {
      sla: slaMetrics,
      database: dbMetrics,
      cache: cacheStats,
      alerts: this.getAlerts({ resolved: false }),
      baselines: Array.from(this.baselines.values()),
      trends: currentMetrics
    };
  }
}

export const performanceMonitoringService = PerformanceMonitoringService.getInstance();
