
import { UserImportResult } from './types.ts';
import { importUserPasswordless } from './user-service.ts';

export async function processUsersWithRateLimit(
  targetUsernames: string[],
  adminToken: string,
  jobId: string,
  supabase: any
): Promise<{
  results: UserImportResult[];
  processedCount: number;
  successCount: number;
  failedCount: number;
  totalVehicles: number;
  errorLog: any[];
}> {
  const results: UserImportResult[] = [];
  let processedCount = 0;
  let successCount = 0;
  let failedCount = 0;
  let totalVehicles = 0;
  const errorLog: any[] = [];

  // Update job to processing status with detailed tracking
  await supabase
    .from('user_import_jobs')
    .update({
      status: 'processing',
      current_step: 'authenticating',
      step_details: 'Starting user import process...',
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId);

  for (let i = 0; i < targetUsernames.length; i++) {
    const username = targetUsernames[i];
    
    try {
      console.log(`Processing user ${i + 1}/${targetUsernames.length}: ${username}`);
      
      // Update current processing step
      await supabase
        .from('user_import_jobs')
        .update({
          current_step: 'processing_user',
          step_details: `Processing user: ${username} (${i + 1}/${targetUsernames.length})`,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);
      
      // Add delay to respect rate limits
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      }

      const userResult = await importUserPasswordless(username, adminToken, jobId, supabase);
      results.push(userResult);
      
      if (!userResult.success) {
        failedCount++;
        errorLog.push({
          username: username,
          error: userResult.error,
          timestamp: new Date().toISOString(),
          step: 'user_import'
        });
      } else {
        successCount++;
        totalVehicles += userResult.vehicles_count;
      }

      processedCount++;

      // Update job progress every user or every 3 users for large batches
      const shouldUpdate = processedCount === targetUsernames.length || 
                          processedCount % Math.min(3, Math.max(1, Math.floor(targetUsernames.length / 10))) === 0;
      
      if (shouldUpdate) {
        await supabase
          .from('user_import_jobs')
          .update({
            processed_usernames: processedCount,
            successful_imports: successCount,
            failed_imports: failedCount,
            total_vehicles_imported: totalVehicles,
            progress_percentage: Math.round((processedCount / targetUsernames.length) * 100),
            step_details: `Processed ${processedCount}/${targetUsernames.length} users. Success: ${successCount}, Failed: ${failedCount}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId);
      }

    } catch (error) {
      console.error(`Failed to process ${username}:`, error);
      failedCount++;
      errorLog.push({
        username: username,
        error: error.message,
        timestamp: new Date().toISOString(),
        step: 'processing_error'
      });
      processedCount++;
    }
  }

  // Final status update
  await supabase
    .from('user_import_jobs')
    .update({
      current_step: 'completed',
      step_details: `Import completed. Processed: ${processedCount}, Success: ${successCount}, Failed: ${failedCount}`,
      progress_percentage: 100,
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId);

  return {
    results,
    processedCount,
    successCount,
    failedCount,
    totalVehicles,
    errorLog
  };
}
