
import { EnhancedUserImportResult, JobProcessingContext } from './enhanced-types.ts';
import { importUserPasswordless } from './user-service.ts';
import { RetryManager } from './error-recovery.ts';
import { TransactionManager } from './transaction-manager.ts';

export async function processUserWithTransaction(
  username: string, 
  context: JobProcessingContext
): Promise<EnhancedUserImportResult> {
  const startTime = Date.now();
  let retryCount = 0;
  const transactionManager = new TransactionManager(context);
  
  context.monitoring.incrementApiCall();
  
  const result = await transactionManager.executeUserTransaction(
    async () => {
      return await RetryManager.withExponentialBackoff(
        async () => {
          if (retryCount > 0) {
            context.monitoring.incrementRetry();
          }
          retryCount++;
          
          // Pre-validate user before processing
          const userValidation = context.validator.validateUsernames([username]);
          if (!userValidation.isValid) {
            throw new Error(`User validation failed: ${userValidation.errors.join(', ')}`);
          }
          
          // Process user with enhanced monitoring and transaction tracking
          const importResult = await importUserPasswordless(username, context.adminToken, context.jobId, context.supabase);
          
          // Track created entities for potential rollback
          if (importResult.success && importResult.envio_user_id) {
            transactionManager.trackCreatedUser(importResult.envio_user_id);
          }
          
          return importResult;
        },
        3, // max retries
        2000, // base delay
        15000 // max delay
      );
    },
    username
  );

  const processingTime = Date.now() - startTime;
  
  // Enhanced result with transaction information
  const enhancedResult: EnhancedUserImportResult = {
    ...result.data,
    success: result.success,
    processingTimeMs: processingTime,
    retryCount: retryCount - 1,
    rollbackPerformed: result.rollbackPerformed || false,
    metricsSnapshot: {
      averageProcessingTimePerUser: processingTime,
      apiCallCount: context.monitoring.getMetrics().apiCallCount
    }
  };

  // Update monitoring based on transaction result
  if (result.success) {
    context.monitoring.updateUserProgress(true, enhancedResult.vehicles_count || 0, processingTime);
  } else {
    context.monitoring.updateUserProgress(false, 0, processingTime);
    if (result.rollbackPerformed) {
      context.monitoring.incrementRollback();
    }
    enhancedResult.validationErrors = [result.error || 'Transaction failed'];
  }

  return enhancedResult;
}
