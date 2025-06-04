
import { ImportMetrics } from './import-metrics-types.ts';
import { PerformanceAlert, AlertManager } from './performance-alerts.ts';
import { MetricsCalculator } from './metrics-calculator.ts';

export { ImportMetrics, PerformanceAlert };

export class MonitoringMetrics {
  private metrics: ImportMetrics;
  private alertManager: AlertManager;

  constructor(jobId: string, totalUsers: number) {
    this.metrics = {
      jobId,
      startTime: Date.now(),
      totalUsers,
      processedUsers: 0,
      successfulUsers: 0,
      failedUsers: 0,
      totalVehicles: 0,
      averageVehiclesPerUser: 0,
      averageProcessingTimePerUser: 0,
      errorRate: 0,
      throughputUsersPerMinute: 0,
      throughputVehiclesPerMinute: 0,
      apiCallCount: 0,
      retryCount: 0,
      rollbackCount: 0
    };
    
    this.alertManager = new AlertManager();
  }

  updateUserProgress(successful: boolean, vehicleCount: number, processingTime: number) {
    this.metrics.processedUsers++;
    
    if (successful) {
      this.metrics.successfulUsers++;
      this.metrics.totalVehicles += vehicleCount;
    } else {
      this.metrics.failedUsers++;
    }

    this.recalculateMetrics(processingTime);
    this.alertManager.checkAlertThresholds(this.metrics);
  }

  incrementApiCall() {
    this.metrics.apiCallCount++;
  }

  incrementRetry() {
    this.metrics.retryCount++;
  }

  incrementRollback() {
    this.metrics.rollbackCount++;
  }

  private recalculateMetrics(lastProcessingTime: number) {
    this.metrics = MetricsCalculator.calculateAverages(this.metrics, lastProcessingTime);
    this.metrics = MetricsCalculator.calculateRates(this.metrics, this.metrics.startTime);
  }

  finalizeMetrics() {
    this.metrics.endTime = Date.now();
    MetricsCalculator.logFinalMetrics(this.metrics);
    console.log(`Alerts Generated: ${this.alertManager.getAlerts().length}`);
  }

  getMetrics(): ImportMetrics {
    return { ...this.metrics };
  }

  getAlerts(): PerformanceAlert[] {
    return this.alertManager.getAlerts();
  }

  getHealthScore(): number {
    return this.alertManager.getHealthScore(this.metrics);
  }
}
