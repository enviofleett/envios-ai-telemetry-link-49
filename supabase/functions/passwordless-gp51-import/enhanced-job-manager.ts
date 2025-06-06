
import { JobContext } from './types.ts';
import { JobStatusManager } from './job-status-manager.ts';
import { MonitoringMetrics } from './monitoring-metrics.ts';
import { MetricsCalculator } from './metrics-calculator.ts';
import { processUsersWithRateLimit } from './job-manager.ts';

export async function startEnhancedImportJob(
  targetUsernames: string[], 
  context: JobContext
): Promise<{
  jobId: string;
  estimatedCompletion: string;
}> {
  console.log('=== Starting Enhanced Import Job ===');
  console.log('Job ID:', context.jobId);
  console.log('Target usernames:', targetUsernames.length);
  
  const { supabase, adminToken } = context;
  const jobStatusManager = new JobStatusManager(supabase);
  const monitoring = new MonitoringMetrics();
  
  try {
    // Initialize job with detailed status
    await jobStatusManager.updateJobStatus(
      context.jobId,
      'processing',
      'Enhanced import initialization',
      `Starting enhanced import for ${targetUsernames.length} users with atomic operations and comprehensive monitoring`
    );

    console.log('Starting user processing with rate limiting...');
    const startTime = Date.now();
    
    // Process users with enhanced monitoring
    const processingResult = await processUsersWithRateLimit(
      targetUsernames,
      adminToken,
      context.jobId,
      supabase
    );

    const endTime = Date.now();
    const totalProcessingTime = endTime - startTime;
    
    console.log('User processing completed. Results:', processingResult);

    // Calculate final metrics
    const finalMetrics = monitoring.getMetrics();
    MetricsCalculator.calculateRates(finalMetrics, startTime);
    
    // Calculate health score based on success rate and performance
    const successRate = processingResult.successCount / targetUsernames.length;
    const errorRate = processingResult.failedCount / targetUsernames.length;
    const avgProcessingTime = totalProcessingTime / targetUsernames.length;
    
    // Health score: weighted combination of success rate (70%) and performance (30%)
    const performanceScore = Math.max(0, 100 - (avgProcessingTime / 1000)); // Penalty for slow processing
    const healthScore = Math.round((successRate * 70) + (performanceScore * 0.3));

    console.log('Finalizing job with comprehensive results...');
    await jobStatusManager.finalizeJob(
      context.jobId,
      processingResult.successCount,
      processingResult.failedCount,
      targetUsernames.length,
      processingResult.totalVehicles,
      healthScore,
      totalProcessingTime,
      processingResult.errorLog
    );

    // Log final metrics for monitoring
    MetricsCalculator.logFinalMetrics(finalMetrics);

    // Calculate estimated completion (for future jobs)
    const avgTimePerUser = totalProcessingTime / targetUsernames.length;
    const estimatedCompletion = new Date(Date.now() + (avgTimePerUser * targetUsernames.length)).toISOString();

    console.log('=== Enhanced Import Job Completed Successfully ===');
    console.log('Success Rate:', `${(successRate * 100).toFixed(1)}%`);
    console.log('Health Score:', `${healthScore}%`);
    console.log('Total Processing Time:', `${(totalProcessingTime / 1000).toFixed(2)}s`);
    
    return {
      jobId: context.jobId,
      estimatedCompletion
    };

  } catch (error) {
    console.error('Enhanced import job failed:', error);
    
    await jobStatusManager.updateJobStatus(
      context.jobId,
      'failed',
      'Enhanced import failed',
      `Import job failed: ${error.message}`
    );
    
    throw error;
  }
}
