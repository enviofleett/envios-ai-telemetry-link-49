import { JobProcessingContext, JobStartResult } from './enhanced-types.ts';

interface UsernameValidationResult {
  validUsernames: string[];
  invalidUsernames: string[];
  validationErrors: string[];
}

async function initializeJobWithValidation(
  targetUsernames: string[],
  context: JobProcessingContext
): Promise<UsernameValidationResult> {
  const jobId = context.jobId;
  console.log(`Initializing job ${jobId} with ${targetUsernames.length} usernames`);

  try {
    // Validate usernames before starting the job
    const validationResult = context.validator.validateUsernames(targetUsernames);

    if (!validationResult.isValid) {
      console.error(`Job ${jobId} failed username validation:`, validationResult.errors);
      
      // Mark job as failed due to validation errors
      await markJobAsFailed(jobId, new Error(`Username validation failed: ${validationResult.errors.join(', ')}`), context.supabase);
      
      return {
        validUsernames: [],
        invalidUsernames: targetUsernames,
        validationErrors: validationResult.errors
      };
    }

    // Persist the validated usernames to the database
    const { error: updateError } = await context.supabase
      .from('user_import_jobs')
      .update({
        status: 'processing',
        total_usernames: targetUsernames.length,
        processed_usernames: 0,
        successful_imports: 0,
        failed_imports: 0,
        imported_usernames: targetUsernames,
        error_log: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    if (updateError) {
      console.error(`Failed to initialize job ${jobId}:`, updateError);
      throw updateError;
    }

    console.log(`Job ${jobId} initialized successfully with ${targetUsernames.length} valid usernames`);
    return {
      validUsernames: targetUsernames,
      invalidUsernames: [],
      validationErrors: []
    };

  } catch (error) {
    console.error(`Error initializing job ${jobId}:`, error);
    throw error;
  }
}

async function updateJobProgress(
  jobId: string,
  completed: number,
  total: number,
  supabase: any
): Promise<void> {
  try {
    const progress = Math.round((completed / total) * 100);
    console.log(`Updating job ${jobId} progress: ${completed}/${total} (${progress}%)`);

    const { error: updateError } = await supabase
      .from('user_import_jobs')
      .update({
        processed_usernames: completed,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    if (updateError) {
      console.error(`Failed to update job ${jobId} progress:`, updateError);
      throw updateError;
    }

  } catch (error) {
    console.error(`Error updating job ${jobId} progress:`, error);
    throw error;
  }
}

async function markJobAsFailed(
  jobId: string,
  error: Error,
  supabase: any
): Promise<void> {
  try {
    console.error(`Marking job ${jobId} as failed:`, error);

    const { error: updateError } = await supabase
      .from('user_import_jobs')
      .update({
        status: 'failed',
        error_log: {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        },
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    if (updateError) {
      console.error(`Failed to mark job ${jobId} as failed:`, updateError);
      throw updateError;
    }

  } catch (updateError) {
    console.error(`Error marking job ${jobId} as failed:`, updateError);
    throw updateError;
  }
}

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

async function completeJobWithResults(
  jobId: string,
  batchResult: any,
  context: JobProcessingContext
): Promise<void> {
  try {
    const { error: updateError } = await context.supabase
      .from('user_import_jobs')
      .update({
        status: 'completed',
        processed_usernames: batchResult.processedCount,
        successful_imports: batchResult.successCount,
        failed_imports: batchResult.failedCount,
        total_vehicles_imported: batchResult.totalVehicles,
        completed_at: new Date().toISOString(),
        import_results: {
          ...batchResult,
          transactionStats: batchResult.transactionStats,
          completedAt: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    if (updateError) {
      console.error(`Failed to complete job ${jobId}:`, updateError);
      throw updateError;
    }

    console.log(`Job ${jobId} completed with enhanced results`);
  } catch (error) {
    console.error(`Error completing job ${jobId}:`, error);
    throw error;
  }
}
