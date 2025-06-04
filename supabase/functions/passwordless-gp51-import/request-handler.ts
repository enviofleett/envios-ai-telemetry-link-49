
import { serve } from 'std/server';
import { cors } from './cors.ts';
import { createClient } from '@supabase/supabase-js';
import { GP51User, GP51Vehicle } from './types.ts';
import { validate as uuidValidate } from 'uuid';
import { RateLimit, InMemoryStore } from 'https://esm.sh/@upstash/ratelimit@0.4.4';
import { KvRestApi } from 'https://esm.sh/@upstash/kv@1.0.1';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  GP51_ADMIN_TOKEN: string;
  UPSTASH_TOKEN: string;
  UPSTASH_URL: string;
}

const corsHandler = cors({
  allowOrigin: '*',
  allowHeaders: '*',
  allowMethods: ['POST', 'OPTIONS'],
});

// Create Rate Limit Instance
const rateLimit = new RateLimit({
  store: new InMemoryStore(),
  prefix: "passwordless-import",
  policy: "10 r/s",
  headers: {
    remaining: 'RateLimit-Remaining',
    limit: 'RateLimit-Limit',
    reset: 'RateLimit-Reset'
  }
});

// Supabase Admin Client
async function getSupabaseAdminClient() {
  const env: Env = Deno.env.toObject() as Env;
    
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
      },
    },
  });
}

// Initialize Upstash Kv Client
async function getUpstashKvClient() {
  const env: Env = Deno.env.toObject() as Env;
  return new KvRestApi({
    token: env.UPSTASH_TOKEN,
    url: env.UPSTASH_URL,
  });
}

interface JobStartResult {
  jobId: string;
  success: boolean;
  processedCount: number;
  successCount: number;
  failedCount: number;
  estimatedCompletion: Date;
}

interface JobProcessingContext {
  jobId: string;
  adminToken: string;
  supabase: any;
  kv: any;
  targetUsernames: string[];
  validator: {
    validateUsernames: (usernames: string[]) => { isValid: boolean; errors: string[] };
  };
  parallelProcessor: {
    processUsersInParallel: <T>(
      usernames: string[],
      processUser: (username: string) => Promise<T>,
      context: JobProcessingContext,
      onProgress?: (completed: number, total: number) => Promise<void>
    ) => Promise<T[]>;
  };
  errorRecovery: {
    rollbackTransaction: () => Promise<void>;
    addEnvioUser: (userId: string) => void;
    addVehicle: (vehicleId: string) => void;
  };
  monitoring: {
    incrementApiCall: () => void;
    incrementRetry: () => void;
    incrementRollback: () => void;
    updateUserProgress: (success: boolean, vehiclesCount: number, processingTimeMs: number) => void;
    getMetrics: () => any;
  };
}

export async function handlePasswordlessImportRequest(req: Request): Promise<Response> {
  console.log('=== Passwordless Import Request Started at', new Date().toISOString(), '===');
  
  try {
    const body = await req.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    // Handle both direct username imports and approved preview imports
    let targetUsernames: string[] = [];
    
    if (body.approvedPreviewIds && Array.isArray(body.approvedPreviewIds)) {
      // Handle approved import workflow
      console.log('Processing approved import request');
      
      const { handleApprovedImport } = await import('./approval-handler.ts');
      const context = await initializeJobContext(body.jobName || 'Approved Import', []);
      
      const approvalResult = await handleApprovedImport(body.approvedPreviewIds, context);
      if (!approvalResult.success) {
        throw new Error(approvalResult.error || 'Failed to process approved previews');
      }
      
      targetUsernames = approvalResult.processedUsernames;
      console.log(`Extracted ${targetUsernames.length} usernames from approved previews`);
      
    } else if (body.targetUsernames && Array.isArray(body.targetUsernames)) {
      // Handle direct username import
      targetUsernames = body.targetUsernames;
      console.log('Processing direct username import');
      
    } else {
      console.error('Invalid targetUsernames:', body.targetUsernames);
      throw new Error('Invalid request: targetUsernames must be a non-empty array or approvedPreviewIds must be provided');
    }

    if (targetUsernames.length === 0) {
      throw new Error('No valid usernames found for import');
    }

    // Validate job name
    const jobName = body.jobName;
    if (!jobName || typeof jobName !== 'string' || jobName.trim().length === 0) {
      throw new Error('Invalid job name provided');
    }

    // Initialize context with enhanced transaction support
    const context = await initializeJobContext(jobName, targetUsernames);
    
    // Start the import job with enhanced processing
    const { startEnhancedImportJob } = await import('./enhanced-job-manager.ts');
    const result = await startEnhancedImportJob(targetUsernames, context);

    console.log('=== Import Request Completed Successfully ===');
    return corsHandler.addCorsHeaders(new Response(JSON.stringify({
      success: true,
      jobId: result.jobId,
      message: `Import job initiated for ${targetUsernames.length} users`,
      targetUsernames,
      estimatedCompletion: result.estimatedCompletion
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }));

  } catch (error) {
    console.error('Import request failed:', error);
    
    return corsHandler.addCorsHeaders(new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    }));
  }
}

async function initializeJobContext(jobName: string, targetUsernames: string[]): Promise<JobProcessingContext> {
  const env: Env = Deno.env.toObject() as Env;
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

  // Username validator (example)
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

      // Process users in parallel with a limited number of concurrent operations
      const maxConcurrency = 10; // Adjust as needed
      const running: Promise<void>[] = [];

      for (const username of usernames) {
        const promise = processUser(username)
          .then(result => {
            results.push(result);
          })
          .catch(error => {
            console.error(`Error processing user ${username}:`, error);
            // Handle error as needed
            throw error;
          })
          .finally(() => {
            completedCount++;
            if (onProgress) {
              onProgress(completedCount, total);
            }
            running.splice(running.indexOf(promise), 1); // Remove from running promises
          }) as Promise<void>;

        running.push(promise);

        if (running.length >= maxConcurrency) {
          await Promise.race(running); // Wait for at least one to complete
        }
      }

      // Wait for all remaining promises to complete
      await Promise.all(running);

      return results;
    },
  };

  // Error recovery (rollback) - simplified for passwordless import
  const errorRecovery = {
    rollbackTransaction: async () => {
      console.log('Attempting rollback transaction (simplified)');
      // In passwordless import, rollback may involve deleting created users/vehicles
      // Implement rollback logic here if needed
    },
    addEnvioUser: (userId: string) => {
      console.log(`Adding Envio user ${userId} to rollback list`);
      // Implement logic to track created users for potential rollback
    },
    addVehicle: (vehicleId: string) => {
      console.log(`Adding vehicle ${vehicleId} to rollback list`);
      // Implement logic to track created vehicles for potential rollback
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return corsHandler.handle(req);
  }

  const { success, limit, reset, remaining } = await rateLimit.limit(req.ip);
  console.log('Rate Limit Info:', { success, limit, reset, remaining });

  if (!success) {
    const res = new Response("Rate limit exceeded", { status: 429 });
    res.headers.set("RateLimit-Limit", limit.toString());
    res.headers.set("RateLimit-Remaining", remaining.toString());
    res.headers.set("RateLimit-Reset", reset.toString());
    return corsHandler.addCorsHeaders(res);
  }

  // Handle passwordless import requests
  if (req.method === 'POST' && req.url.includes('/passwordless-gp51-import')) {
    return handlePasswordlessImportRequest(req);
  }

  // Respond with a 404 for any other request
  return corsHandler.addCorsHeaders(new Response('Not Found', { status: 404 }));
});
