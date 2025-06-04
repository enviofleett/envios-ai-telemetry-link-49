
import { JobProcessingContext } from './enhanced-types.ts';

interface UsernameValidationResult {
  validUsernames: string[];
  invalidUsernames: string[];
  validationErrors: string[];
}

export async function initializeJobWithValidation(
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

export async function markJobAsFailed(
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
