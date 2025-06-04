
import { EnhancedUserImportResult, JobProcessingContext } from './enhanced-types.ts';
import { ErrorRecoveryManager } from './error-recovery.ts';
import { MonitoringMetrics } from './monitoring-metrics.ts';
import { DataValidator } from './data-validator.ts';
import { createRateLimiterForJob } from './enhanced-rate-limiter.ts';
import { ParallelProcessor, createOptimalProcessingConfig } from './parallel-processor.ts';
import { JobStatusManager } from './job-status-manager.ts';
import { PhaseManager } from './phase-manager.ts';
import { processBatchOfUsers } from './batch-processor.ts';

export async function processUsersWithEnhancedCapabilities(
  targetUsernames: string[],
  adminToken: string,
  jobId: string,
  supabase: any
): Promise<{
  results: EnhancedUserImportResult[];
  processedCount: number;
  successCount: number;
  failedCount: number;
  totalVehicles: number;
  errorLog: any[];
  performanceMetrics: any;
  consistencyReport: any;
  healthScore: number;
}> {
  console.log(`=== Starting Enhanced Processing for ${targetUsernames.length} users ===`);
  
  // Initialize all systems
  const errorRecovery = new ErrorRecoveryManager(supabase);
  const monitoring = new MonitoringMetrics(jobId, targetUsernames.length);
  const validator = new DataValidator(supabase);
  const rateLimiter = createRateLimiterForJob(targetUsernames.length);
  const statusManager = new JobStatusManager(supabase);
  const phaseManager = new PhaseManager(statusManager, validator);
  
  const processingConfig = createOptimalProcessingConfig(targetUsernames.length);
  const parallelProcessor = new ParallelProcessor(processingConfig);
  
  const context: JobProcessingContext = {
    jobId,
    adminToken,
    supabase,
    errorRecovery,
    monitoring,
    validator,
    rateLimiter,
    parallelProcessor
  };

  // Phase 1: Pre-import validation
  const validUsernames = await phaseManager.executePreImportValidation(jobId, targetUsernames);

  // Phase 2: Parallel processing with monitoring
  await phaseManager.executeParallelProcessing(jobId, validUsernames, processingConfig.maxConcurrency);

  const batchResult = await processBatchOfUsers(
    validUsernames,
    context,
    async (progress) => {
      await statusManager.updateJobProgress(supabase, jobId, progress.completed, validUsernames.length, monitoring);
    }
  );

  // Phase 3: Post-import consistency check
  const consistencyReport = await phaseManager.executeConsistencyCheck(jobId);
  
  // Phase 4: Finalization and reporting
  await phaseManager.executeFinalization(jobId);
  monitoring.finalizeMetrics();
  
  const performanceMetrics = monitoring.getMetrics();
  const healthScore = monitoring.getHealthScore();
  const alerts = monitoring.getAlerts();

  // Final job update
  await statusManager.finalizeJob(
    jobId,
    batchResult.successCount,
    batchResult.failedCount,
    validUsernames.length,
    batchResult.totalVehicles,
    healthScore,
    performanceMetrics.endTime! - performanceMetrics.startTime,
    alerts
  );

  console.log(`=== Enhanced Processing Complete ===`);
  console.log(`Health Score: ${healthScore}%`);
  console.log(`Alerts Generated: ${alerts.length}`);
  console.log(`Consistency Issues: ${consistencyReport.issues.length}`);
  
  return {
    results: batchResult.results,
    processedCount: batchResult.processedCount,
    successCount: batchResult.successCount,
    failedCount: batchResult.failedCount,
    totalVehicles: batchResult.totalVehicles,
    errorLog: alerts,
    performanceMetrics,
    consistencyReport,
    healthScore
  };
}
