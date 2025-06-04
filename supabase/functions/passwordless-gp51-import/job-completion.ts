
export interface JobCompletionResult {
  finalStatus: string;
  summary: any;
  completedAt: string;
}

export async function finalizeImportJob(
  jobId: string,
  processingResults: any,
  validUsernames: string[],
  adminUsername: string,
  startTime: number,
  supabase: any
): Promise<JobCompletionResult> {
  // Determine final status
  const finalStatus = processingResults.failedCount === validUsernames.length ? 'failed' : 
                     processingResults.successCount === 0 ? 'failed' : 'completed';

  // Final job update
  const completedAt = new Date().toISOString();
  const { error: finalUpdateError } = await supabase
    .from('user_import_jobs')
    .update({
      status: finalStatus,
      processed_usernames: processingResults.processedCount,
      successful_imports: processingResults.successCount,
      failed_imports: processingResults.failedCount,
      total_vehicles_imported: processingResults.totalVehicles,
      import_results: processingResults.results,
      error_log: processingResults.errorLog,
      completed_at: completedAt,
      updated_at: completedAt,
      progress_percentage: 100
    })
    .eq('id', jobId);

  if (finalUpdateError) {
    console.error('Failed to update final job status:', finalUpdateError);
  }

  const duration = Date.now() - startTime;
  console.log(`=== Passwordless import completed in ${duration}ms ===`);
  console.log(`Results: ${processingResults.successCount} successful, ${processingResults.failedCount} failed, ${processingResults.totalVehicles} vehicles`);

  const summary = {
    totalUsers: validUsernames.length,
    processedUsers: processingResults.processedCount,
    successfulImports: processingResults.successCount,
    failedImports: processingResults.failedCount,
    totalVehicles: processingResults.totalVehicles
  };

  return {
    finalStatus,
    summary,
    completedAt
  };
}

export async function handleJobError(
  jobId: string,
  error: any,
  supabase: any
): Promise<void> {
  console.error('Import process failed:', error);
  
  // Update job status to failed
  await supabase
    .from('user_import_jobs')
    .update({
      status: 'failed',
      error_log: [{ 
        error: `Import process failed: ${error.message}`, 
        timestamp: new Date().toISOString(),
        step: 'import_process'
      }],
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId);
}
