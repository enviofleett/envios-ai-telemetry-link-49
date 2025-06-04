
export interface PerformanceAlert {
  type: 'warning' | 'error' | 'critical';
  message: string;
  timestamp: string;
  metrics: Partial<ImportMetrics>;
  threshold: number;
  actualValue: number;
}

export interface AlertThresholds {
  errorRateWarning: number;
  errorRateCritical: number;
  processingTimeWarning: number;
  processingTimeCritical: number;
  throughputWarning: number;
  throughputCritical: number;
  vehicleRatioWarning: number;
  vehicleRatioCritical: number;
}

export class AlertManager {
  private alerts: PerformanceAlert[] = [];
  private alertThresholds: AlertThresholds = {
    errorRateWarning: 0.1, // 10%
    errorRateCritical: 0.3, // 30%
    processingTimeWarning: 30000, // 30 seconds per user
    processingTimeCritical: 60000, // 1 minute per user
    throughputWarning: 1.0, // users per minute
    throughputCritical: 0.5, // users per minute
    vehicleRatioWarning: 50, // vehicles per user
    vehicleRatioCritical: 100 // vehicles per user
  };

  checkAlertThresholds(metrics: any) {
    // Check error rate
    if (metrics.errorRate >= this.alertThresholds.errorRateCritical) {
      this.addAlert('critical', 'Critical error rate detected', 
        this.alertThresholds.errorRateCritical, metrics.errorRate, metrics);
    } else if (metrics.errorRate >= this.alertThresholds.errorRateWarning) {
      this.addAlert('warning', 'High error rate detected', 
        this.alertThresholds.errorRateWarning, metrics.errorRate, metrics);
    }

    // Check processing time
    if (metrics.averageProcessingTimePerUser >= this.alertThresholds.processingTimeCritical) {
      this.addAlert('critical', 'Critical processing time detected', 
        this.alertThresholds.processingTimeCritical, metrics.averageProcessingTimePerUser, metrics);
    } else if (metrics.averageProcessingTimePerUser >= this.alertThresholds.processingTimeWarning) {
      this.addAlert('warning', 'Slow processing time detected', 
        this.alertThresholds.processingTimeWarning, metrics.averageProcessingTimePerUser, metrics);
    }

    // Check throughput
    if (metrics.throughputUsersPerMinute <= this.alertThresholds.throughputCritical && metrics.processedUsers > 5) {
      this.addAlert('critical', 'Critical throughput performance', 
        this.alertThresholds.throughputCritical, metrics.throughputUsersPerMinute, metrics);
    } else if (metrics.throughputUsersPerMinute <= this.alertThresholds.throughputWarning && metrics.processedUsers > 3) {
      this.addAlert('warning', 'Low throughput performance', 
        this.alertThresholds.throughputWarning, metrics.throughputUsersPerMinute, metrics);
    }

    // Check vehicle ratio
    if (metrics.averageVehiclesPerUser >= this.alertThresholds.vehicleRatioCritical) {
      this.addAlert('critical', 'Extremely high vehicle-to-user ratio', 
        this.alertThresholds.vehicleRatioCritical, metrics.averageVehiclesPerUser, metrics);
    } else if (metrics.averageVehiclesPerUser >= this.alertThresholds.vehicleRatioWarning) {
      this.addAlert('warning', 'High vehicle-to-user ratio detected', 
        this.alertThresholds.vehicleRatioWarning, metrics.averageVehiclesPerUser, metrics);
    }
  }

  private addAlert(type: PerformanceAlert['type'], message: string, threshold: number, actualValue: number, metrics: any) {
    const alert: PerformanceAlert = {
      type,
      message,
      timestamp: new Date().toISOString(),
      metrics: { ...metrics },
      threshold,
      actualValue
    };
    
    this.alerts.push(alert);
    console.log(`ALERT [${type.toUpperCase()}]: ${message} (threshold: ${threshold}, actual: ${actualValue})`);
  }

  getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  getHealthScore(metrics: any): number {
    // Calculate overall health score (0-100)
    let score = 100;
    
    // Deduct for error rate
    score -= metrics.errorRate * 50; // Max 50 points for errors
    
    // Deduct for slow processing
    if (metrics.averageProcessingTimePerUser > this.alertThresholds.processingTimeWarning) {
      score -= 20;
    }
    
    // Deduct for low throughput
    if (metrics.throughputUsersPerMinute < this.alertThresholds.throughputWarning) {
      score -= 15;
    }
    
    // Deduct for alerts
    score -= this.alerts.filter(a => a.type === 'critical').length * 10;
    score -= this.alerts.filter(a => a.type === 'warning').length * 5;
    
    return Math.max(0, Math.min(100, score));
  }
}
