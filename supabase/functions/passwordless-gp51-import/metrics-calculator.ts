
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
  
  static createHealthReport(metrics: ImportMetrics): {
    score: number;
    status: 'excellent' | 'good' | 'fair' | 'poor';
    details: string[];
  } {
    const details: string[] = [];
    let score = 100;
    
    // Success rate impact (50% of score)
    const successRate = metrics.totalUsers > 0 ? (metrics.successfulUsers / metrics.totalUsers) * 100 : 0;
    const successScore = successRate * 0.5;
    score = successScore;
    
    if (successRate < 50) {
      details.push(`Low success rate: ${successRate.toFixed(1)}%`);
    } else if (successRate < 80) {
      details.push(`Moderate success rate: ${successRate.toFixed(1)}%`);
    } else {
      details.push(`Good success rate: ${successRate.toFixed(1)}%`);
    }
    
    // Performance impact (30% of score)
    const avgTimeSeconds = metrics.averageProcessingTimePerUser * 60;
    let performanceScore = 30;
    if (avgTimeSeconds > 60) {
      performanceScore = Math.max(0, 30 - ((avgTimeSeconds - 60) / 10));
      details.push(`Slow processing: ${avgTimeSeconds.toFixed(1)}s per user`);
    } else if (avgTimeSeconds > 30) {
      performanceScore = 25;
      details.push(`Moderate processing speed: ${avgTimeSeconds.toFixed(1)}s per user`);
    } else {
      details.push(`Fast processing: ${avgTimeSeconds.toFixed(1)}s per user`);
    }
    score += performanceScore;
    
    // Error rate impact (20% of score)
    let errorScore = 20;
    if (metrics.errorRate > 20) {
      errorScore = Math.max(0, 20 - metrics.errorRate);
      details.push(`High error rate: ${metrics.errorRate.toFixed(1)}%`);
    } else if (metrics.errorRate > 10) {
      errorScore = 15;
      details.push(`Moderate error rate: ${metrics.errorRate.toFixed(1)}%`);
    } else {
      details.push(`Low error rate: ${metrics.errorRate.toFixed(1)}%`);
    }
    score += errorScore;
    
    let status: 'excellent' | 'good' | 'fair' | 'poor';
    if (score >= 90) status = 'excellent';
    else if (score >= 75) status = 'good';
    else if (score >= 60) status = 'fair';
    else status = 'poor';
    
    return {
      score: Math.round(score),
      status,
      details
    };
  }
}
