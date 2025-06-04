
import { JobProcessingContext, JobStartResult } from './enhanced-types.ts';
import { initializeJobWithValidation, markJobAsFailed } from './job-validator.ts';
import { completeJobWithResults, updateJobProgress } from './job-completion.ts';

export async function startEnhancedImportJob(
  targetUsernames: string[],
  context: JobProcessingContext
): Promise<JobStartResult> {
  const jobId = context.jobId;
  console.log(`Starting enhanced import job ${jobId} for ${targetUsernames.length} users`);

  try {
    // Initialize job with enhanced tracking
    await initializeJobWithValidation(targetUsernames, context);

    // Process users with transaction support
    const { processBatchWithTransactions } = await import('./enhanced-batch-manager.ts');
    
    const batchResult = await processBatchWithTransactions(
      targetUsernames,
      context,
      async (completed: number, total: number) => {
        // Update job progress with enhanced statistics
        await updateJobProgress(jobId, completed, total, context.supabase);
      }
    );

    // Complete job with enhanced results
    await completeJobWithResults(jobId, batchResult, context);

    console.log(`Enhanced import job ${jobId} completed successfully`);
    
    return {
      jobId,
      success: true,
      processedCount: batchResult.processedCount,
      successCount: batchResult.successCount,
      failedCount: batchResult.failedCount,
      estimatedCompletion: new Date(Date.now() + (targetUsernames.length * 2000)) // Rough estimate
    };

  } catch (error) {
    console.error(`Enhanced import job ${jobId} failed:`, error);
    
    // Mark job as failed with detailed error information
    await markJobAsFailed(jobId, error, context.supabase);
    
    throw error;
  }
}
