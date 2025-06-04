
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

  // Update job to processing status
  await supabase
    .from('user_import_jobs')
    .update({
      status: 'processing',
      current_step: 'Starting import process...',
      step_details: `Preparing to import ${targetUsernames.length} users`,
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId);

  for (let i = 0; i < targetUsernames.length; i++) {
    const username = targetUsernames[i];
    let retryCount = 0;
    const maxRetries = 3;
    let userResult: UserImportResult | null = null;
    
    while (retryCount <= maxRetries && !userResult?.success) {
      try {
        console.log(`Processing user ${i + 1}/${targetUsernames.length}: ${username} (attempt ${retryCount + 1})`);
        
        // Update current processing step with retry info
        const retryInfo = retryCount > 0 ? ` (retry ${retryCount})` : '';
        await supabase
          .from('user_import_jobs')
          .update({
            current_step: `Processing user: ${username}${retryInfo}`,
            step_details: `Processing user ${i + 1} of ${targetUsernames.length}: ${username}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId);
        
        // Add progressive delay between attempts and users
        const baseDelay = retryCount > 0 ? Math.pow(2, retryCount) * 1000 : 2000; // Exponential backoff
        if (i > 0 || retryCount > 0) {
          console.log(`Waiting ${baseDelay}ms before processing...`);
          await new Promise(resolve => setTimeout(resolve, baseDelay));
        }

        userResult = await importUserPasswordless(username, adminToken, jobId, supabase);
        
        if (userResult.success) {
          console.log(`Successfully imported ${username} on attempt ${retryCount + 1}`);
          break; // Success, exit retry loop
        } else {
          console.warn(`Attempt ${retryCount + 1} failed for ${username}: ${userResult.error}`);
          retryCount++;
        }

      } catch (error) {
        console.error(`Attempt ${retryCount + 1} failed for ${username}:`, error);
        retryCount++;
        
        if (retryCount > maxRetries) {
          // Final failure after all retries
          userResult = {
            gp51_username: username,
            vehicles_count: 0,
            success: false,
            error: `Failed after ${maxRetries + 1} attempts: ${error.message}`
          };
        }
      }
    }

    if (userResult) {
      results.push(userResult);
      
      if (!userResult.success) {
        failedCount++;
        errorLog.push({
          username: username,
          error: userResult.error,
          timestamp: new Date().toISOString(),
          step: 'user_import',
          attempts: retryCount + 1
        });
      } else {
        successCount++;
        totalVehicles += userResult.vehicles_count;
      }
    }

    processedCount++;

    // Update job progress more frequently for better monitoring
    const shouldUpdate = processedCount === targetUsernames.length || 
                        processedCount % Math.min(2, Math.max(1, Math.floor(targetUsernames.length / 20))) === 0;
    
    if (shouldUpdate) {
      const progressPercentage = Math.round((processedCount / targetUsernames.length) * 100);
      await supabase
        .from('user_import_jobs')
        .update({
          processed_usernames: processedCount,
          successful_imports: successCount,
          failed_imports: failedCount,
          total_vehicles_imported: totalVehicles,
          progress_percentage: progressPercentage,
          step_details: `Processed ${processedCount}/${targetUsernames.length} users. Success: ${successCount}, Failed: ${failedCount}, Vehicles: ${totalVehicles}`,
          error_log: errorLog,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);
    }
  }

  // Final status update
  const finalStatus = failedCount === targetUsernames.length ? 'failed' : 'completed';
  await supabase
    .from('user_import_jobs')
    .update({
      status: finalStatus,
      current_step: finalStatus === 'completed' ? 'Import completed successfully' : 'Import completed with errors',
      step_details: `Final results: ${processedCount} processed, ${successCount} successful, ${failedCount} failed, ${totalVehicles} vehicles imported`,
      progress_percentage: 100,
      error_log: errorLog,
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
