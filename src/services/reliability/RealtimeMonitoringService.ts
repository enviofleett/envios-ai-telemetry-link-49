import { circuitBreakerService, CircuitBreakerStats } from './CircuitBreakerService';
import { degradationService, ServiceStatus } from './DegradationService';
import { errorRecoveryService } from './ErrorRecoveryService';
import { SecurityService } from '../security/SecurityService';

export interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'critical';
  service: string;
  message: string;
  timestamp: number;
  data?: any;
  acknowledged: boolean;
  resolved: boolean;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  threshold?: number;
  status: 'healthy' | 'warning' | 'critical';
  timestamp: number;
}

export interface SystemHealthSummary {
  overall: 'healthy' | 'warning' | 'critical' | 'offline';
  services: ServiceStatus[];
  circuitBreakers: Record<string, CircuitBreakerStats>;
  alerts: SystemAlert[];
  metrics: PerformanceMetric[];
  uptime: number;
  lastUpdated: number;
}

export class RealtimeMonitoringService {
  private static instance: RealtimeMonitoringService;
  private alerts: SystemAlert[] = [];
  private metrics: PerformanceMetric[] = [];
  private subscribers: ((summary: SystemHealthSummary) => void)[] = [];
  private monitoringInterval?: NodeJS.Timeout;
  private startTime = Date.now();
  private isMonitoring = false;

  private readonly ALERT_THRESHOLDS = {
    circuitBreaker: {
      failureRate: 50, // 50% failure rate triggers warning
      criticalFailureRate: 80 // 80% failure rate triggers critical
    },
    degradation: {
      warningLevel: 'degraded',
      criticalLevel: 'minimal'
    },
    response: {
      warning: 5000, // 5 seconds
      critical: 10000 // 10 seconds
    }
  };

  static getInstance(): RealtimeMonitoringService {
    if (!RealtimeMonitoringService.instance) {
      RealtimeMonitoringService.instance = new RealtimeMonitoringService();
    }
    return RealtimeMonitoringService.instance;
  }

  startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) {
      console.log('Realtime monitoring already started');
      return;
    }

    this.isMonitoring = true;
    console.log(`Starting realtime monitoring with ${intervalMs}ms interval`);

    // Initial health check
    this.performHealthCheck();

    // Set up periodic monitoring
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, intervalMs);

    // Subscribe to service degradation events
    this.setupDegradationSubscriptions();
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
    console.log('Realtime monitoring stopped');
  }

  private async performHealthCheck(): Promise<void> {
    try {
      const startTime = Date.now();

      // Check circuit breaker states
      const circuitBreakers = circuitBreakerService.getAllStats();
      this.analyzeCircuitBreakers(circuitBreakers);

      // Check service degradation levels
      const services = degradationService.getAllServiceStatuses();
      this.analyzeServiceDegradation(services);

      // Update performance metrics
      this.updatePerformanceMetrics(Date.now() - startTime);

      // Notify subscribers
      this.notifySubscribers();

    } catch (error) {
      console.error('Health check failed:', error);
      this.createAlert('critical', 'monitoring', 'Health check system failure', { error });
    }
  }

  private analyzeCircuitBreakers(circuitBreakers: Record<string, CircuitBreakerStats>): void {
    Object.entries(circuitBreakers).forEach(([name, stats]) => {
      // Check failure rates
      if (stats.failureRate >= this.ALERT_THRESHOLDS.circuitBreaker.criticalFailureRate) {
        this.createAlert('critical', name, 
          `Circuit breaker ${name} has critical failure rate: ${stats.failureRate.toFixed(1)}%`, 
          stats
        );
      } else if (stats.failureRate >= this.ALERT_THRESHOLDS.circuitBreaker.failureRate) {
        this.createAlert('warning', name,
          `Circuit breaker ${name} has high failure rate: ${stats.failureRate.toFixed(1)}%`,
          stats
        );
      }

      // Check circuit breaker state
      if (stats.state === 'OPEN') {
        this.createAlert('error', name,
          `Circuit breaker ${name} is OPEN - service calls are being blocked`,
          stats
        );
      } else if (stats.state === 'HALF_OPEN') {
        this.createAlert('info', name,
          `Circuit breaker ${name} is in HALF_OPEN state - testing recovery`,
          stats
        );
      }

      // Update metrics
      this.updateMetric(`${name}_failure_rate`, stats.failureRate, '%', 50);
      this.updateMetric(`${name}_total_calls`, stats.totalCalls, 'calls');
    });
  }

  private analyzeServiceDegradation(services: ServiceStatus[]): void {
    services.forEach(service => {
      if (service.level === 'offline') {
        this.createAlert('critical', service.name,
          `Service ${service.name} is OFFLINE`,
          service
        );
      } else if (service.level === 'minimal') {
        this.createAlert('error', service.name,
          `Service ${service.name} is in MINIMAL mode`,
          service
        );
      } else if (service.level === 'degraded') {
        this.createAlert('warning', service.name,
          `Service ${service.name} is in DEGRADED mode`,
          service
        );
      }

      // Check consecutive failures
      if (service.consecutiveFailures >= 10) {
        this.createAlert('critical', service.name,
          `Service ${service.name} has ${service.consecutiveFailures} consecutive failures`,
          service
        );
      } else if (service.consecutiveFailures >= 5) {
        this.createAlert('warning', service.name,
          `Service ${service.name} has ${service.consecutiveFailures} consecutive failures`,
          service
        );
      }
    });
  }

  private updatePerformanceMetrics(responseTime: number): void {
    // Health check response time
    const responseStatus = responseTime > this.ALERT_THRESHOLDS.response.critical ? 'critical' :
                          responseTime > this.ALERT_THRESHOLDS.response.warning ? 'warning' : 'healthy';
    
    this.updateMetric('health_check_response_time', responseTime, 'ms', this.ALERT_THRESHOLDS.response.warning);

    // System uptime
    const uptime = Date.now() - this.startTime;
    this.updateMetric('system_uptime', uptime, 'ms');

    // Alert statistics
    const activeAlerts = this.alerts.filter(alert => !alert.resolved).length;
    const criticalAlerts = this.alerts.filter(alert => !alert.resolved && alert.type === 'critical').length;
    
    this.updateMetric('active_alerts', activeAlerts, 'count', 5);
    this.updateMetric('critical_alerts', criticalAlerts, 'count', 1);

    // Recovery statistics
    const recoveryStats = errorRecoveryService.getRecoveryStats();
    this.updateMetric('active_recoveries', recoveryStats.activeRecoveries, 'count');
  }

  private updateMetric(name: string, value: number, unit: string, threshold?: number): void {
    const existing = this.metrics.find(m => m.name === name);
    const status = threshold ? 
      (value >= threshold * 2 ? 'critical' : value >= threshold ? 'warning' : 'healthy') : 
      'healthy';

    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      threshold,
      status,
      timestamp: Date.now()
    };

    if (existing) {
      Object.assign(existing, metric);
    } else {
      this.metrics.push(metric);
    }

    // Keep only recent metrics
    this.metrics = this.metrics.filter(m => Date.now() - m.timestamp < 3600000); // 1 hour
  }

  private createAlert(type: SystemAlert['type'], service: string, message: string, data?: any): void {
    // Check for duplicate alerts
    const isDuplicate = this.alerts.some(alert => 
      !alert.resolved && 
      alert.service === service && 
      alert.message === message &&
      Date.now() - alert.timestamp < 300000 // 5 minutes
    );

    if (isDuplicate) return;

    const alert: SystemAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      type,
      service,
      message,
      timestamp: Date.now(),
      data,
      acknowledged: false,
      resolved: false
    };

    this.alerts.push(alert);

    // Log security event for critical alerts
    if (type === 'critical') {
      SecurityService.logSecurityEvent({
        type: 'suspicious_activity',
        severity: 'critical',
        description: `Critical system alert: ${message}`,
        additionalData: { service, alertData: data }
      });
    }

    // Auto-resolve certain types of alerts
    if (type === 'info') {
      setTimeout(() => this.resolveAlert(alert.id), 60000); // 1 minute
    }

    console.log(`[${type.toUpperCase()}] ${service}: ${message}`);

    // Keep only recent alerts
    this.alerts = this.alerts.filter(alert => Date.now() - alert.timestamp < 86400000); // 24 hours
  }

  private setupDegradationSubscriptions(): void {
    // Subscribe to all registered services
    const services = degradationService.getAllServiceStatuses();
    
    services.forEach(service => {
      degradationService.subscribe(service.name, (status) => {
        this.handleServiceStatusChange(status);
      });
    });
  }

  private handleServiceStatusChange(status: ServiceStatus): void {
    if (status.fallbackActive) {
      this.createAlert('warning', status.name,
        `Service ${status.name} activated fallback mode (${status.level})`,
        status
      );
    }

    if (status.isHealthy && status.level === 'full') {
      // Resolve previous alerts for this service
      this.alerts
        .filter(alert => alert.service === status.name && !alert.resolved)
        .forEach(alert => this.resolveAlert(alert.id));
    }
  }

  // Public API
  getSystemHealthSummary(): SystemHealthSummary {
    const services = degradationService.getAllServiceStatuses();
    const circuitBreakers = circuitBreakerService.getAllStats();
    const activeAlerts = this.alerts.filter(alert => !alert.resolved);

    // Determine overall system health
    const criticalAlerts = activeAlerts.filter(alert => alert.type === 'critical').length;
    const offlineServices = services.filter(service => service.level === 'offline').length;
    const openCircuits = Object.values(circuitBreakers).filter(cb => cb.state === 'OPEN').length;

    let overall: SystemHealthSummary['overall'] = 'healthy';
    
    if (criticalAlerts > 0 || offlineServices > 0 || openCircuits > 0) {
      overall = 'critical';
    } else if (activeAlerts.length > 0 || services.some(s => s.level !== 'full')) {
      overall = 'warning';
    }

    return {
      overall,
      services,
      circuitBreakers,
      alerts: activeAlerts.slice(-50), // Last 50 alerts
      metrics: this.metrics.slice(-20), // Last 20 metrics
      uptime: Date.now() - this.startTime,
      lastUpdated: Date.now()
    };
  }

  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      console.log(`Alert acknowledged: ${alertId}`);
      this.notifySubscribers();
      return true;
    }
    return false;
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.acknowledged = true;
      console.log(`Alert resolved: ${alertId}`);
      this.notifySubscribers();
      return true;
    }
    return false;
  }

  subscribe(callback: (summary: SystemHealthSummary) => void): () => void {
    this.subscribers.push(callback);
    
    // Send initial state
    callback(this.getSystemHealthSummary());

    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  private notifySubscribers(): void {
    const summary = this.getSystemHealthSummary();
    this.subscribers.forEach(callback => {
      try {
        callback(summary);
      } catch (error) {
        console.error('Error notifying monitoring subscriber:', error);
      }
    });
  }

  // Force system health check
  async triggerHealthCheck(): Promise<SystemHealthSummary> {
    await this.performHealthCheck();
    return this.getSystemHealthSummary();
  }

  // Emergency controls
  emergencyReset(): void {
    console.log('EMERGENCY RESET: Resetting all reliability systems');
    
    // Reset all circuit breakers
    circuitBreakerService.resetAllBreakers();
    
    // Reset all services to full operation
    const services = degradationService.getAllServiceStatuses();
    services.forEach(service => {
      degradationService.resetService(service.name);
    });
    
    // Clear all alerts
    this.alerts.forEach(alert => alert.resolved = true);
    
    this.createAlert('info', 'system', 'Emergency reset completed - all systems restored');
    this.notifySubscribers();
  }
}

export const realtimeMonitoringService = RealtimeMonitoringService.getInstance();
