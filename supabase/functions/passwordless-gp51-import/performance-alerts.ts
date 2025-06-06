
import { ImportMetrics } from './import-metrics-types.ts';

export interface PerformanceAlert {
  type: 'warning' | 'error' | 'info';
  message: string;
  threshold?: number;
  actualValue?: number;
  timestamp: number;
}

export class AlertManager {
  private alerts: PerformanceAlert[] = [];

  checkAlertThresholds(metrics: ImportMetrics) {
    // Check error rate
    if (metrics.errorRate > 0.1) { // 10% error rate
      this.addAlert({
        type: 'error',
        message: 'High error rate detected',
        threshold: 0.1,
        actualValue: metrics.errorRate,
        timestamp: Date.now()
      });
    }

    // Check processing speed
    if (metrics.throughputUsersPerMinute < 1) {
      this.addAlert({
        type: 'warning',
        message: 'Low processing throughput',
        threshold: 1,
        actualValue: metrics.throughputUsersPerMinute,
        timestamp: Date.now()
      });
    }

    // Check retry count
    if (metrics.retryCount > metrics.totalUsers * 0.5) {
      this.addAlert({
        type: 'warning',
        message: 'High retry count indicates API issues',
        threshold: metrics.totalUsers * 0.5,
        actualValue: metrics.retryCount,
        timestamp: Date.now()
      });
    }
  }

  private addAlert(alert: PerformanceAlert) {
    this.alerts.push(alert);
    console.warn(`ALERT [${alert.type}]: ${alert.message}`, alert);
  }

  getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  getHealthScore(metrics: ImportMetrics): number {
    let score = 100;
    
    // Deduct for error rate
    score -= metrics.errorRate * 100;
    
    // Deduct for low throughput
    if (metrics.throughputUsersPerMinute < 1) {
      score -= 20;
    }
    
    // Deduct for high retry rate
    const retryRate = metrics.retryCount / metrics.totalUsers;
    if (retryRate > 0.3) {
      score -= 30;
    }
    
    return Math.max(0, Math.min(100, score));
  }
}
