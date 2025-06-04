
export interface ImportMetrics {
  jobId: string;
  startTime: number;
  endTime?: number;
  totalUsers: number;
  processedUsers: number;
  successfulUsers: number;
  failedUsers: number;
  totalVehicles: number;
  averageVehiclesPerUser: number;
  averageProcessingTimePerUser: number;
  errorRate: number;
  throughputUsersPerMinute: number;
  throughputVehiclesPerMinute: number;
  memoryUsage?: number;
  apiCallCount: number;
  retryCount: number;
  rollbackCount: number;
}

export interface PerformanceAlert {
  type: 'warning' | 'error' | 'critical';
  message: string;
  timestamp: string;
  metrics: Partial<ImportMetrics>;
  threshold: number;
  actualValue: number;
}

export class MonitoringMetrics {
  private metrics: ImportMetrics;
  private alerts: PerformanceAlert[] = [];
  private alertThresholds = {
    errorRateWarning: 0.1, // 10%
    errorRateCritical: 0.3, // 30%
    processingTimeWarning: 30000, // 30 seconds per user
    processingTimeCritical: 60000, // 1 minute per user
    throughputWarning: 1.0, // users per minute
    throughputCritical: 0.5, // users per minute
    vehicleRatioWarning: 50, // vehicles per user
    vehicleRatioCritical: 100 // vehicles per user
  };

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
    this.checkAlertThresholds();
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
    const currentTime = Date.now();
    const elapsedMinutes = (currentTime - this.metrics.startTime) / (1000 * 60);
    
    // Calculate averages
    if (this.metrics.successfulUsers > 0) {
      this.metrics.averageVehiclesPerUser = this.metrics.totalVehicles / this.metrics.successfulUsers;
    }
    
    // Update average processing time (rolling average)
    if (this.metrics.processedUsers > 0) {
      const currentAverage = this.metrics.averageProcessingTimePerUser || 0;
      this.metrics.averageProcessingTimePerUser = 
        (currentAverage * (this.metrics.processedUsers - 1) + lastProcessingTime) / this.metrics.processedUsers;
    }
    
    // Calculate error rate
    this.metrics.errorRate = this.metrics.processedUsers > 0 
      ? this.metrics.failedUsers / this.metrics.processedUsers 
      : 0;
    
    // Calculate throughput
    if (elapsedMinutes > 0) {
      this.metrics.throughputUsersPerMinute = this.metrics.processedUsers / elapsedMinutes;
      this.metrics.throughputVehiclesPerMinute = this.metrics.totalVehicles / elapsedMinutes;
    }
  }

  private checkAlertThresholds() {
    // Check error rate
    if (this.metrics.errorRate >= this.alertThresholds.errorRateCritical) {
      this.addAlert('critical', 'Critical error rate detected', 
        this.alertThresholds.errorRateCritical, this.metrics.errorRate);
    } else if (this.metrics.errorRate >= this.alertThresholds.errorRateWarning) {
      this.addAlert('warning', 'High error rate detected', 
        this.alertThresholds.errorRateWarning, this.metrics.errorRate);
    }

    // Check processing time
    if (this.metrics.averageProcessingTimePerUser >= this.alertThresholds.processingTimeCritical) {
      this.addAlert('critical', 'Critical processing time detected', 
        this.alertThresholds.processingTimeCritical, this.metrics.averageProcessingTimePerUser);
    } else if (this.metrics.averageProcessingTimePerUser >= this.alertThresholds.processingTimeWarning) {
      this.addAlert('warning', 'Slow processing time detected', 
        this.alertThresholds.processingTimeWarning, this.metrics.averageProcessingTimePerUser);
    }

    // Check throughput
    if (this.metrics.throughputUsersPerMinute <= this.alertThresholds.throughputCritical && this.metrics.processedUsers > 5) {
      this.addAlert('critical', 'Critical throughput performance', 
        this.alertThresholds.throughputCritical, this.metrics.throughputUsersPerMinute);
    } else if (this.metrics.throughputUsersPerMinute <= this.alertThresholds.throughputWarning && this.metrics.processedUsers > 3) {
      this.addAlert('warning', 'Low throughput performance', 
        this.alertThresholds.throughputWarning, this.metrics.throughputUsersPerMinute);
    }

    // Check vehicle ratio
    if (this.metrics.averageVehiclesPerUser >= this.alertThresholds.vehicleRatioCritical) {
      this.addAlert('critical', 'Extremely high vehicle-to-user ratio', 
        this.alertThresholds.vehicleRatioCritical, this.metrics.averageVehiclesPerUser);
    } else if (this.metrics.averageVehiclesPerUser >= this.alertThresholds.vehicleRatioWarning) {
      this.addAlert('warning', 'High vehicle-to-user ratio detected', 
        this.alertThresholds.vehicleRatioWarning, this.metrics.averageVehiclesPerUser);
    }
  }

  private addAlert(type: PerformanceAlert['type'], message: string, threshold: number, actualValue: number) {
    const alert: PerformanceAlert = {
      type,
      message,
      timestamp: new Date().toISOString(),
      metrics: { ...this.metrics },
      threshold,
      actualValue
    };
    
    this.alerts.push(alert);
    console.log(`ALERT [${type.toUpperCase()}]: ${message} (threshold: ${threshold}, actual: ${actualValue})`);
  }

  finalizeMetrics() {
    this.metrics.endTime = Date.now();
    
    console.log('=== FINAL IMPORT METRICS ===');
    console.log(`Job ID: ${this.metrics.jobId}`);
    console.log(`Duration: ${((this.metrics.endTime - this.metrics.startTime) / 1000).toFixed(2)} seconds`);
    console.log(`Users: ${this.metrics.successfulUsers}/${this.metrics.totalUsers} successful (${(this.metrics.errorRate * 100).toFixed(1)}% error rate)`);
    console.log(`Vehicles: ${this.metrics.totalVehicles} (avg ${this.metrics.averageVehiclesPerUser.toFixed(1)} per user)`);
    console.log(`Throughput: ${this.metrics.throughputUsersPerMinute.toFixed(2)} users/min, ${this.metrics.throughputVehiclesPerMinute.toFixed(2)} vehicles/min`);
    console.log(`API Calls: ${this.metrics.apiCallCount}, Retries: ${this.metrics.retryCount}, Rollbacks: ${this.metrics.rollbackCount}`);
    console.log(`Alerts Generated: ${this.alerts.length}`);
    console.log('========================');
  }

  getMetrics(): ImportMetrics {
    return { ...this.metrics };
  }

  getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  getHealthScore(): number {
    // Calculate overall health score (0-100)
    let score = 100;
    
    // Deduct for error rate
    score -= this.metrics.errorRate * 50; // Max 50 points for errors
    
    // Deduct for slow processing
    if (this.metrics.averageProcessingTimePerUser > this.alertThresholds.processingTimeWarning) {
      score -= 20;
    }
    
    // Deduct for low throughput
    if (this.metrics.throughputUsersPerMinute < this.alertThresholds.throughputWarning) {
      score -= 15;
    }
    
    // Deduct for alerts
    score -= this.alerts.filter(a => a.type === 'critical').length * 10;
    score -= this.alerts.filter(a => a.type === 'warning').length * 5;
    
    return Math.max(0, Math.min(100, score));
  }
}
