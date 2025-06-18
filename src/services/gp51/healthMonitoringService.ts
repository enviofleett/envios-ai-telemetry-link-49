
interface HealthMetrics {
  isHealthy: boolean;
  lastCheck: Date;
  responseTime: number;
  successRate: number;
  errorCount: number;
  totalRequests: number;
  status: 'healthy' | 'degraded' | 'unhealthy';
  issues: string[];
}

interface HealthCheck {
  timestamp: Date;
  success: boolean;
  responseTime: number;
  error?: string;
}

export class HealthMonitoringService {
  private static instance: HealthMonitoringService;
  private healthHistory: HealthCheck[] = [];
  private maxHistorySize = 100;
  private listeners: Set<(metrics: HealthMetrics) => void> = new Set();

  static getInstance(): HealthMonitoringService {
    if (!HealthMonitoringService.instance) {
      HealthMonitoringService.instance = new HealthMonitoringService();
    }
    return HealthMonitoringService.instance;
  }

  recordHealthCheck(success: boolean, responseTime: number, error?: string): void {
    const check: HealthCheck = {
      timestamp: new Date(),
      success,
      responseTime,
      error
    };

    this.healthHistory.push(check);

    // Maintain history size
    if (this.healthHistory.length > this.maxHistorySize) {
      this.healthHistory.shift();
    }

    // Notify listeners
    this.notifyListeners();
  }

  getHealthMetrics(): HealthMetrics {
    if (this.healthHistory.length === 0) {
      return {
        isHealthy: false,
        lastCheck: new Date(),
        responseTime: 0,
        successRate: 0,
        errorCount: 0,
        totalRequests: 0,
        status: 'unhealthy',
        issues: ['No health checks recorded']
      };
    }

    const recent = this.healthHistory.slice(-10); // Last 10 checks
    const successful = recent.filter(check => check.success);
    const successRate = (successful.length / recent.length) * 100;
    const avgResponseTime = recent.reduce((sum, check) => sum + check.responseTime, 0) / recent.length;
    const errorCount = recent.filter(check => !check.success).length;

    const issues: string[] = [];
    let status: 'healthy' | 'degraded' | 'unhealthy';

    if (successRate >= 95) {
      status = 'healthy';
    } else if (successRate >= 70) {
      status = 'degraded';
      issues.push('Success rate below 95%');
    } else {
      status = 'unhealthy';
      issues.push('Success rate below 70%');
    }

    if (avgResponseTime > 10000) {
      issues.push('High response times detected');
      if (status === 'healthy') status = 'degraded';
    }

    if (errorCount >= 3) {
      issues.push('Multiple recent errors');
      status = 'unhealthy';
    }

    return {
      isHealthy: status === 'healthy',
      lastCheck: recent[recent.length - 1].timestamp,
      responseTime: Math.round(avgResponseTime),
      successRate: Math.round(successRate),
      errorCount,
      totalRequests: this.healthHistory.length,
      status,
      issues
    };
  }

  subscribe(callback: (metrics: HealthMetrics) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    const metrics = this.getHealthMetrics();
    this.listeners.forEach(callback => {
      try {
        callback(metrics);
      } catch (error) {
        console.error('Error in health monitoring listener:', error);
      }
    });
  }

  getHealthHistory(): HealthCheck[] {
    return [...this.healthHistory];
  }

  clearHistory(): void {
    this.healthHistory = [];
    this.notifyListeners();
  }
}

export const healthMonitoringService = HealthMonitoringService.getInstance();
