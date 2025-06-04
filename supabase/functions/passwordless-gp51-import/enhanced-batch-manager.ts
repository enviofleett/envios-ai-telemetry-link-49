
import { EnhancedUserImportResult, JobProcessingContext } from './enhanced-types.ts';
import { processUserWithTransaction } from './enhanced-user-processor.ts';

export interface EnhancedBatchResult {
  results: EnhancedUserImportResult[];
  processedCount: number;
  successCount: number;
  failedCount: number;
  totalVehicles: number;
  transactionStats: {
    successfulTransactions: number;
    failedTransactions: number;
    rollbacksPerformed: number;
  };
}

export async function processBatchWithTransactions(
  usernames: string[],
  context: JobProcessingContext,
  onProgress?: (completed: number, total: number) => Promise<void>
): Promise<EnhancedBatchResult> {
  const results: EnhancedUserImportResult[] = [];
  let processedCount = 0;
  let successCount = 0;
  let failedCount = 0;
  let totalVehicles = 0;
  let successfulTransactions = 0;
  let failedTransactions = 0;
  let rollbacksPerformed = 0;

  console.log(`Processing batch of ${usernames.length} users with transaction support`);

  try {
    const batchResults = await context.parallelProcessor.processUsersInParallel(
      usernames,
      async (username: string) => {
        return await processUserWithTransaction(username, context);
      },
      context,
      onProgress
    );

    // Aggregate results with transaction statistics
    for (const result of batchResults) {
      results.push(result);
      processedCount++;
      
      if (result.success) {
        successCount++;
        successfulTransactions++;
        totalVehicles += result.vehicles_count || 0;
        context.monitoring.updateUserProgress(true, result.vehicles_count || 0, result.processingTimeMs || 0);
      } else {
        failedCount++;
        failedTransactions++;
        
        if (result.rollbackPerformed) {
          rollbacksPerformed++;
        }
        
        context.monitoring.updateUserProgress(false, 0, result.processingTimeMs || 0);
      }
    }

    console.log(`Batch processing completed: ${successCount} successful, ${failedCount} failed, ${rollbacksPerformed} rollbacks performed`);

  } catch (error) {
    console.error('Critical error during batch processing:', error);
    throw error;
  }

  return {
    results,
    processedCount,
    successCount,
    failedCount,
    totalVehicles,
    transactionStats: {
      successfulTransactions,
      failedTransactions,
      rollbacksPerformed
    }
  };
}
