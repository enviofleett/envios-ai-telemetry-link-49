
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

  for (const username of targetUsernames) {
    try {
      console.log(`Processing user ${processedCount + 1}/${targetUsernames.length}: ${username}`);
      
      // Add delay to respect rate limits
      if (processedCount > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      }

      const userResult = await importUserPasswordless(username, adminToken, jobId, supabase);
      results.push(userResult);
      
      if (!userResult.success) {
        failedCount++;
        errorLog.push({
          username: username,
          error: userResult.error,
          timestamp: new Date().toISOString()
        });
      } else {
        successCount++;
        totalVehicles += userResult.vehicles_count;
      }

      processedCount++;

      // Update job progress every 5 users
      if (processedCount % 5 === 0 || processedCount === targetUsernames.length) {
        await supabase
          .from('user_import_jobs')
          .update({
            processed_usernames: processedCount,
            successful_imports: successCount,
            failed_imports: failedCount,
            total_vehicles_imported: totalVehicles,
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
        timestamp: new Date().toISOString()
      });
      processedCount++;
    }
  }

  return {
    results,
    processedCount,
    successCount,
    failedCount,
    totalVehicles,
    errorLog
  };
}
