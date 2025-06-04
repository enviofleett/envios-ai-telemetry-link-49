
import { EnhancedUserImportResult, JobProcessingContext } from './enhanced-types.ts';
import { processUserWithEnhancedRecovery } from './user-processor.ts';

export interface BatchResult {
  results: EnhancedUserImportResult[];
  processedCount: number;
  successCount: number;
  failedCount: number;
  totalVehicles: number;
}

export async function processBatchOfUsers(
  usernames: string[],
  context: JobProcessingContext,
  onProgress?: (completed: number, total: number) => Promise<void>
): Promise<BatchResult> {
  const results: EnhancedUserImportResult[] = [];
  let processedCount = 0;
  let successCount = 0;
  let failedCount = 0;
  let totalVehicles = 0;

  console.log(`Processing batch of ${usernames.length} users`);

  try {
    const batchResults = await context.parallelProcessor.processUsersInParallel(
      usernames,
      async (username: string) => {
        return await processUserWithEnhancedRecovery(username, context);
      },
      context,
      onProgress
    );

    // Aggregate results
    for (const result of batchResults) {
      results.push(result);
      processedCount++;
      
      if (result.success) {
        successCount++;
        totalVehicles += result.vehicles_count;
        context.monitoring.updateUserProgress(true, result.vehicles_count, result.processingTimeMs || 0);
      } else {
        failedCount++;
        context.monitoring.updateUserProgress(false, 0, result.processingTimeMs || 0);
      }
    }

  } catch (error) {
    console.error('Critical error during batch processing:', error);
    await context.errorRecovery.rollbackTransaction();
    throw error;
  }

  return {
    results,
    processedCount,
    successCount,
    failedCount,
    totalVehicles
  };
}
