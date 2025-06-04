
export class MetricsCalculator {
  static calculateAverages(metrics: any, lastProcessingTime: number) {
    // Calculate averages
    if (metrics.successfulUsers > 0) {
      metrics.averageVehiclesPerUser = metrics.totalVehicles / metrics.successfulUsers;
    }
    
    // Update average processing time (rolling average)
    if (metrics.processedUsers > 0) {
      const currentAverage = metrics.averageProcessingTimePerUser || 0;
      metrics.averageProcessingTimePerUser = 
        (currentAverage * (metrics.processedUsers - 1) + lastProcessingTime) / metrics.processedUsers;
    }
    
    return metrics;
  }

  static calculateRates(metrics: any, startTime: number) {
    const currentTime = Date.now();
    const elapsedMinutes = (currentTime - startTime) / (1000 * 60);
    
    // Calculate error rate
    metrics.errorRate = metrics.processedUsers > 0 
      ? metrics.failedUsers / metrics.processedUsers 
      : 0;
    
    // Calculate throughput
    if (elapsedMinutes > 0) {
      metrics.throughputUsersPerMinute = metrics.processedUsers / elapsedMinutes;
      metrics.throughputVehiclesPerMinute = metrics.totalVehicles / elapsedMinutes;
    }
    
    return metrics;
  }

  static logFinalMetrics(metrics: any) {
    console.log('=== FINAL IMPORT METRICS ===');
    console.log(`Job ID: ${metrics.jobId}`);
    
    if (metrics.endTime) {
      console.log(`Duration: ${((metrics.endTime - metrics.startTime) / 1000).toFixed(2)} seconds`);
    }
    
    console.log(`Users: ${metrics.successfulUsers}/${metrics.totalUsers} successful (${(metrics.errorRate * 100).toFixed(1)}% error rate)`);
    console.log(`Vehicles: ${metrics.totalVehicles} (avg ${metrics.averageVehiclesPerUser.toFixed(1)} per user)`);
    console.log(`Throughput: ${metrics.throughputUsersPerMinute.toFixed(2)} users/min, ${metrics.throughputVehiclesPerMinute.toFixed(2)} vehicles/min`);
    console.log(`API Calls: ${metrics.apiCallCount}, Retries: ${metrics.retryCount}, Rollbacks: ${metrics.rollbackCount}`);
    console.log('========================');
  }
}
