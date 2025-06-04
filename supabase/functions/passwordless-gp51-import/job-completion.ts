
import { JobProcessingContext } from './enhanced-types.ts';

export async function completeJobWithResults(
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

export async function updateJobProgress(
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
