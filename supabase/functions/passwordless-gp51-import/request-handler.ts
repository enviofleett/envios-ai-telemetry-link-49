
import { corsHeaders, handleCorsPreflightRequest, createCorsResponse } from './cors-handler.ts';
import { validatePasswordlessImportInput } from './input-validator.ts';
import { initializeImportJob } from './job-initializer.ts';
import { finalizeImportJob, handleJobError } from './job-completion.ts';
import { processUsersWithRateLimit } from './job-manager.ts';

export { corsHeaders };

export async function handlePasswordlessImportRequest(
  requestBody: any,
  supabase: any
): Promise<Response> {
  const startTime = Date.now();
  console.log(`=== Passwordless Import Request Started at ${new Date().toISOString()} ===`);

  try {
    // Step 1: Validate input
    const validationResult = validatePasswordlessImportInput(requestBody);
    if (!validationResult.isValid) {
      return createCorsResponse({ error: validationResult.error }, 400);
    }

    const { jobName } = requestBody;
    const validUsernames = validationResult.validUsernames!;

    // Step 2: Initialize job and get credentials
    const initResult = await initializeImportJob(jobName, validUsernames, supabase);
    if (!initResult.success) {
      const errorResponse = {
        error: initResult.error,
        details: initResult.error === 'GP51 connection not configured' ? 'GP51 connection not configured' : initResult.error,
        action: initResult.error === 'GP51 connection not configured' ? 'Please configure GP51 credentials in Admin Settings' : undefined,
        timestamp: new Date().toISOString()
      };
      const statusCode = initResult.error === 'GP51 connection not configured' ? 401 : 500;
      return createCorsResponse(errorResponse, statusCode);
    }

    const { adminToken, adminUsername, jobRecord: job } = initResult;

    try {
      console.log('Starting user processing with rate limiting...');

      // Step 3: Process users with enhanced error handling and rate limiting
      const processingResults = await processUsersWithRateLimit(
        validUsernames,
        adminToken!,
        job.id,
        supabase
      );

      // Step 4: Finalize job
      const completionResult = await finalizeImportJob(
        job.id,
        processingResults,
        validUsernames,
        adminUsername!,
        startTime,
        supabase
      );

      return createCorsResponse({
        success: true,
        jobId: job.id,
        duration: Date.now() - startTime,
        summary: completionResult.summary,
        results: processingResults.results,
        adminUsername: adminUsername,
        status: completionResult.finalStatus,
        timestamp: completionResult.completedAt
      });

    } catch (importError) {
      await handleJobError(job.id, importError, supabase);
      
      return createCorsResponse({ 
        error: 'Import process failed',
        details: importError.message,
        jobId: job.id,
        timestamp: new Date().toISOString()
      }, 500);
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`=== Passwordless import error after ${duration}ms ===`, error);
    return createCorsResponse({ 
      error: 'Internal server error',
      details: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
}
