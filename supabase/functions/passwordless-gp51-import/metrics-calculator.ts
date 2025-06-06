
import { ImportMetrics } from './import-metrics-types.ts';

export class MetricsCalculator {
  static calculateAverages(metrics: ImportMetrics, lastProcessingTime: number): ImportMetrics {
    const updatedMetrics = { ...metrics };
    
    // Calculate average vehicles per user
    if (updatedMetrics.successfulUsers > 0) {
      updatedMetrics.averageVehiclesPerUser = updatedMetrics.totalVehicles / updatedMetrics.successfulUsers;
    }
    
    // Calculate average processing time per user
    if (updatedMetrics.processedUsers > 0) {
      const totalTime = Date.now() - updatedMetrics.startTime;
      updatedMetrics.averageProcessingTimePerUser = totalTime / updatedMetrics.processedUsers;
    }
    
    // Calculate error rate
    if (updatedMetrics.processedUsers > 0) {
      updatedMetrics.errorRate = updatedMetrics.failedUsers / updatedMetrics.processedUsers;
    }
    
    return updatedMetrics;
  }
  
  static calculateRates(metrics: ImportMetrics, startTime: number): ImportMetrics {
    const updatedMetrics = { ...metrics };
    const elapsedMinutes = (Date.now() - startTime) / (1000 * 60);
    
    if (elapsedMinutes > 0) {
      updatedMetrics.throughputUsersPerMinute = updatedMetrics.processedUsers / elapsedMinutes;
      updatedMetrics.throughputVehiclesPerMinute = updatedMetrics.totalVehicles / elapsedMinutes;
    }
    
    return updatedMetrics;
  }
  
  static logFinalMetrics(metrics: ImportMetrics) {
    const duration = metrics.endTime ? (metrics.endTime - metrics.startTime) / 1000 : 0;
    
    console.log('=== FINAL IMPORT METRICS ===');
    console.log(`Job ID: ${metrics.jobId}`);
    console.log(`Total Duration: ${duration.toFixed(2)} seconds`);
    console.log(`Total Users: ${metrics.totalUsers}`);
    console.log(`Successful: ${metrics.successfulUsers}`);
    console.log(`Failed: ${metrics.failedUsers}`);
    console.log(`Success Rate: ${((metrics.successfulUsers / metrics.totalUsers) * 100).toFixed(2)}%`);
    console.log(`Total Vehicles: ${metrics.totalVehicles}`);
    console.log(`Avg Vehicles/User: ${metrics.averageVehiclesPerUser.toFixed(2)}`);
    console.log(`Processing Speed: ${metrics.throughputUsersPerMinute.toFixed(2)} users/min`);
    console.log(`API Calls: ${metrics.apiCallCount}`);
    console.log(`Retries: ${metrics.retryCount}`);
    console.log(`Rollbacks: ${metrics.rollbackCount}`);
    console.log('=== END METRICS ===');
  }
}
