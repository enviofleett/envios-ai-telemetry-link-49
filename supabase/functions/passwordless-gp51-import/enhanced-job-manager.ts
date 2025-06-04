
import { EnhancedUserImportResult, JobProcessingContext, BatchProcessingResult } from './enhanced-types.ts';
import { ErrorRecoveryManager, RetryManager } from './error-recovery.ts';
import { ParallelProcessor, createOptimalProcessingConfig } from './parallel-processor.ts';
import { MonitoringMetrics } from './monitoring-metrics.ts';
import { DataValidator } from './data-validator.ts';
import { createRateLimiterForJob } from './enhanced-rate-limiter.ts';
import { importUserPasswordless } from './user-service.ts';

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
  console.log('Phase 1: Pre-import validation...');
  await updateJobStatus(supabase, jobId, 'processing', 'Phase 1: Pre-import validation', 
    'Validating usernames and GP51 connectivity');
  
  const validationResult = validator.validateUsernames(targetUsernames);
  if (!validationResult.isValid) {
    console.error('Pre-import validation failed:', validationResult.errors);
    throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
  }

  const validUsernames = [...new Set(targetUsernames.filter(u => u?.trim()))];
  console.log(`Validation passed: ${validUsernames.length} valid usernames`);

  // Phase 2: Parallel processing with monitoring
  console.log('Phase 2: Parallel processing with enhanced monitoring...');
  await updateJobStatus(supabase, jobId, 'processing', 'Phase 2: Parallel user processing', 
    `Processing ${validUsernames.length} users with ${processingConfig.maxConcurrency} concurrent workers`);

  const results: EnhancedUserImportResult[] = [];
  let processedCount = 0;
  let successCount = 0;
  let failedCount = 0;
  let totalVehicles = 0;

  try {
    const batchResults = await parallelProcessor.processUsersInParallel(
      validUsernames,
      async (username: string) => {
        return await processUserWithEnhancedRecovery(username, context);
      },
      context,
      async (progress) => {
        // Real-time progress updates
        await updateJobProgress(supabase, jobId, progress.completed, validUsernames.length, monitoring);
      }
    );

    // Aggregate results
    for (const result of batchResults) {
      results.push(result);
      processedCount++;
      
      if (result.success) {
        successCount++;
        totalVehicles += result.vehicles_count;
        monitoring.updateUserProgress(true, result.vehicles_count, result.processingTimeMs || 0);
      } else {
        failedCount++;
        monitoring.updateUserProgress(false, 0, result.processingTimeMs || 0);
      }
    }

  } catch (error) {
    console.error('Critical error during parallel processing:', error);
    await errorRecovery.rollbackTransaction();
    throw error;
  }

  // Phase 3: Post-import consistency check
  console.log('Phase 3: Post-import consistency verification...');
  await updateJobStatus(supabase, jobId, 'processing', 'Phase 3: Data consistency verification', 
    'Performing post-import data integrity checks');

  const consistencyReport = await validator.performConsistencyAudit();
  
  // Phase 4: Finalization and reporting
  console.log('Phase 4: Finalizing metrics and generating reports...');
  monitoring.finalizeMetrics();
  
  const performanceMetrics = monitoring.getMetrics();
  const healthScore = monitoring.getHealthScore();
  const alerts = monitoring.getAlerts();

  // Final job update
  const finalStatus = failedCount === validUsernames.length ? 'failed' : 'completed';
  await updateJobStatus(supabase, jobId, finalStatus, 
    finalStatus === 'completed' ? 'Enhanced import completed successfully' : 'Enhanced import completed with errors',
    `Final results: ${successCount}/${validUsernames.length} users successful, ${totalVehicles} vehicles imported. Health Score: ${healthScore}%`);

  console.log(`=== Enhanced Processing Complete ===`);
  console.log(`Health Score: ${healthScore}%`);
  console.log(`Alerts Generated: ${alerts.length}`);
  console.log(`Consistency Issues: ${consistencyReport.issues.length}`);
  
  return {
    results,
    processedCount,
    successCount,
    failedCount,
    totalVehicles,
    errorLog: alerts,
    performanceMetrics,
    consistencyReport,
    healthScore
  };
}

async function processUserWithEnhancedRecovery(
  username: string, 
  context: JobProcessingContext
): Promise<EnhancedUserImportResult> {
  const startTime = Date.now();
  let retryCount = 0;
  
  context.monitoring.incrementApiCall();
  
  const result = await RetryManager.withExponentialBackoff(
    async () => {
      if (retryCount > 0) {
        context.monitoring.incrementRetry();
      }
      retryCount++;
      
      // Pre-validate user before processing
      const userValidation = context.validator.validateUsernames([username]);
      if (!userValidation.isValid) {
        throw new Error(`User validation failed: ${userValidation.errors.join(', ')}`);
      }
      
      // Process user with enhanced monitoring
      return await importUserPasswordless(username, context.adminToken, context.jobId, context.supabase);
    },
    3, // max retries
    2000, // base delay
    15000 // max delay
  );

  const processingTime = Date.now() - startTime;
  
  // Enhanced result with additional metadata
  const enhancedResult: EnhancedUserImportResult = {
    ...result,
    processingTimeMs: processingTime,
    retryCount: retryCount - 1,
    rollbackPerformed: false,
    metricsSnapshot: {
      averageProcessingTimePerUser: processingTime,
      apiCallCount: context.monitoring.getMetrics().apiCallCount
    }
  };

  // Handle failure with potential rollback
  if (!result.success && result.envio_user_id) {
    console.log(`Attempting rollback for failed user: ${username}`);
    try {
      if (result.envio_user_id) {
        context.errorRecovery.addEnvioUser(result.envio_user_id);
      }
      await context.errorRecovery.rollbackTransaction();
      enhancedResult.rollbackPerformed = true;
      context.monitoring.incrementRollback();
    } catch (rollbackError) {
      console.error(`Rollback failed for user ${username}:`, rollbackError);
      enhancedResult.validationErrors = [`Rollback failed: ${rollbackError.message}`];
    }
  }

  return enhancedResult;
}

async function updateJobStatus(
  supabase: any, 
  jobId: string, 
  status: string, 
  currentStep: string, 
  stepDetails: string
) {
  await supabase
    .from('user_import_jobs')
    .update({
      status,
      current_step: currentStep,
      step_details: stepDetails,
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId);
}

async function updateJobProgress(
  supabase: any, 
  jobId: string, 
  processed: number, 
  total: number, 
  monitoring: MonitoringMetrics
) {
  const progressPercentage = Math.round((processed / total) * 100);
  const metrics = monitoring.getMetrics();
  
  await supabase
    .from('user_import_jobs')
    .update({
      processed_usernames: processed,
      successful_imports: metrics.successfulUsers,
      failed_imports: metrics.failedUsers,
      total_vehicles_imported: metrics.totalVehicles,
      progress_percentage: progressPercentage,
      step_details: `Processed ${processed}/${total} users. Success rate: ${((metrics.successfulUsers / Math.max(1, processed)) * 100).toFixed(1)}%. Avg time: ${Math.round(metrics.averageProcessingTimePerUser)}ms/user`,
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId);
}
