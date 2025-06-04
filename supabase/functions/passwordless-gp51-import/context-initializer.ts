
import { JobProcessingContext } from './enhanced-types.ts';
import { getSupabaseAdminClient } from './supabase-client.ts';
import { getUpstashKvClient } from './upstash-client.ts';
import { getEnvironment } from './environment.ts';

export async function initializeJobContext(jobName: string, targetUsernames: string[]): Promise<JobProcessingContext> {
  const env = getEnvironment();
  const jobId = crypto.randomUUID();
  const adminToken = env.GP51_ADMIN_TOKEN;
  const supabase = await getSupabaseAdminClient();
  const kv = await getUpstashKvClient();

  // Initialize job in database
  await supabase
    .from('user_import_jobs')
    .insert({
      id: jobId,
      job_name: jobName,
      status: 'initialized',
      total_usernames: targetUsernames.length,
      processed_usernames: 0,
      successful_imports: 0,
      failed_imports: 0,
      total_vehicles_imported: 0,
      import_type: 'passwordless_import',
      admin_gp51_username: 'system',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

  // Username validator
  const usernameValidator = {
    validateUsernames: (usernames: string[]) => {
      const errors: string[] = [];
      const isValid = usernames.every(username => {
        if (typeof username !== 'string' || username.length < 3) {
          errors.push(`Invalid username: ${username}`);
          return false;
        }
        return true;
      });
      return { isValid, errors };
    },
  };

  // Parallel processor
  const parallelProcessor = {
    processUsersInParallel: async <T>(
      usernames: string[],
      processUser: (username: string) => Promise<T>,
      context: JobProcessingContext,
      onProgress?: (completed: number, total: number) => Promise<void>
    ): Promise<T[]> => {
      const results: T[] = [];
      let completedCount = 0;
      const total = usernames.length;

      const maxConcurrency = 10;
      const running: Promise<void>[] = [];

      for (const username of usernames) {
        const promise = processUser(username)
          .then(result => {
            results.push(result);
          })
          .catch(error => {
            console.error(`Error processing user ${username}:`, error);
            throw error;
          })
          .finally(() => {
            completedCount++;
            if (onProgress) {
              onProgress(completedCount, total);
            }
            running.splice(running.indexOf(promise), 1);
          }) as Promise<void>;

        running.push(promise);

        if (running.length >= maxConcurrency) {
          await Promise.race(running);
        }
      }

      await Promise.all(running);
      return results;
    },
  };

  // Error recovery
  const errorRecovery = {
    rollbackTransaction: async () => {
      console.log('Attempting rollback transaction (simplified)');
    },
    addEnvioUser: (userId: string) => {
      console.log(`Adding Envio user ${userId} to rollback list`);
    },
    addVehicle: (vehicleId: string) => {
      console.log(`Adding vehicle ${vehicleId} to rollback list`);
    },
  };

  // Monitoring
  const monitoring = {
    apiCallCount: 0,
    retryCount: 0,
    rollbackCount: 0,
    successfulUsers: 0,
    failedUsers: 0,
    totalVehiclesImported: 0,
    totalProcessingTimeMs: 0,
    incrementApiCall: () => {
      monitoring.apiCallCount++;
    },
    incrementRetry: () => {
      monitoring.retryCount++;
    },
    incrementRollback: () => {
      monitoring.rollbackCount++;
    },
    updateUserProgress: (success: boolean, vehiclesCount: number, processingTimeMs: number) => {
      if (success) {
        monitoring.successfulUsers++;
        monitoring.totalVehiclesImported += vehiclesCount;
      } else {
        monitoring.failedUsers++;
      }
      monitoring.totalProcessingTimeMs += processingTimeMs;
    },
    getMetrics: () => ({
      apiCallCount: monitoring.apiCallCount,
      retryCount: monitoring.retryCount,
      rollbackCount: monitoring.rollbackCount,
      successfulUsers: monitoring.successfulUsers,
      failedUsers: monitoring.failedUsers,
      totalVehiclesImported: monitoring.totalVehiclesImported,
      averageProcessingTimePerUser: monitoring.successfulUsers > 0 ? monitoring.totalProcessingTimeMs / monitoring.successfulUsers : 0,
    }),
  };

  return {
    jobId,
    adminToken,
    supabase,
    kv,
    targetUsernames,
    validator: usernameValidator,
    parallelProcessor: parallelProcessor,
    errorRecovery: errorRecovery,
    monitoring: monitoring,
  };
}
