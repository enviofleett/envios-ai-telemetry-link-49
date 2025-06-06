
import { ImportMetrics } from './import-metrics-types.ts';

export class MetricsCalculator {
  static calculateRates(metrics: ImportMetrics, startTime: number): ImportMetrics {
    const currentTime = Date.now();
    const elapsedMinutes = (currentTime - startTime) / (1000 * 60);
    
    if (elapsedMinutes > 0) {
      metrics.averageProcessingTimePerUser = elapsedMinutes / Math.max(metrics.processedUsers, 1);
      metrics.throughputUsersPerMinute = metrics.processedUsers / elapsedMinutes;
      metrics.throughputVehiclesPerMinute = metrics.totalVehicles / elapsedMinutes;
      metrics.errorRate = metrics.totalUsers > 0 ? (metrics.failedUsers / metrics.totalUsers) * 100 : 0;
    }
    
    return metrics;
  }
  
  static logFinalMetrics(metrics: ImportMetrics): void {
    console.log('=== Final Import Metrics ===');
    console.log('Job ID:', metrics.jobId);
    console.log('Total Users:', metrics.totalUsers);
    console.log('Processed Users:', metrics.processedUsers);
    console.log('Successful Users:', metrics.successfulUsers);
    console.log('Failed Users:', metrics.failedUsers);
    console.log('Total Vehicles:', metrics.totalVehicles);
    console.log('Average Processing Time per User (minutes):', metrics.averageProcessingTimePerUser);
    console.log('Throughput (users/minute):', metrics.throughputUsersPerMinute);
    console.log('Throughput (vehicles/minute):', metrics.throughputVehiclesPerMinute);
    console.log('Error Rate (%):', metrics.errorRate);
    console.log('API Call Count:', metrics.apiCallCount);
    console.log('Retry Count:', metrics.retryCount);
    console.log('Duration (minutes):', (Date.now() - metrics.startTime) / (1000 * 60));
    console.log('==========================');
  }
}
