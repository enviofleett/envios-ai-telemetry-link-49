
import { EnhancedUserImportResult, JobProcessingContext } from './enhanced-types.ts';
import { importUserPasswordless } from './user-service.ts';
import { RetryManager } from './error-recovery.ts';

export async function processUserWithEnhancedRecovery(
  username: string, 
  context: JobProcessingContext
): Promise<EnhancedUserImportResult> {
  const startTime = Date.now();
  let retryCount = 0;
  
  context.monitoring.incrementApiCall();
  
  const result = await RetryManager.withExponentialBackoff(
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
      
      // Process user with enhanced monitoring
      return await importUserPasswordless(username, context.adminToken, context.jobId, context.supabase);
    },
    3, // max retries
    2000, // base delay
    15000 // max delay
  );

  const processingTime = Date.now() - startTime;
  
  // Enhanced result with additional metadata
  const enhancedResult: EnhancedUserImportResult = {
    ...result,
    processingTimeMs: processingTime,
    retryCount: retryCount - 1,
    rollbackPerformed: false,
    metricsSnapshot: {
      averageProcessingTimePerUser: processingTime,
      apiCallCount: context.monitoring.getMetrics().apiCallCount
    }
  };

  // Handle failure with potential rollback
  if (!result.success && result.envio_user_id) {
    console.log(`Attempting rollback for failed user: ${username}`);
    try {
      if (result.envio_user_id) {
        context.errorRecovery.addEnvioUser(result.envio_user_id);
      }
      await context.errorRecovery.rollbackTransaction();
      enhancedResult.rollbackPerformed = true;
      context.monitoring.incrementRollback();
    } catch (rollbackError) {
      console.error(`Rollback failed for user ${username}:`, rollbackError);
      enhancedResult.validationErrors = [`Rollback failed: ${rollbackError.message}`];
    }
  }

  return enhancedResult;
}
