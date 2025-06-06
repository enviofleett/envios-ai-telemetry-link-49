
import { JobContext } from './context-initializer.ts';
import { MetricsCalculator } from './metrics-calculator.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getEnvironment } from './environment.ts';

export interface ImportResult {
  jobId: string;
  success: boolean;
  processedUsers: number;
  successfulUsers: number;
  failedUsers: number;
  totalVehicles: number;
  estimatedCompletion?: Date;
  error?: string;
}

export async function startEnhancedImportJob(
  targetUsernames: string[], 
  context: JobContext
): Promise<ImportResult> {
  const env = getEnvironment();
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  
  console.log(`Starting enhanced import job ${context.jobId} for ${targetUsernames.length} users`);
  
  try {
    // Create database job record with comprehensive details
    const { data: jobRecord, error: jobError } = await supabase
      .from('user_import_jobs')
      .insert({
        id: context.jobId,
        job_name: context.jobName,
        status: 'processing',
        total_usernames: targetUsernames.length,
        processed_usernames: 0,
        successful_imports: 0,
        failed_imports: 0,
        total_vehicles_imported: 0,
        import_type: 'passwordless',
        progress_percentage: 0,
        current_step: 'Initializing import job',
        step_details: `Processing ${targetUsernames.length} users with enhanced monitoring`,
        imported_usernames: targetUsernames
      })
      .select()
      .single();

    if (jobError) {
      console.error('Failed to create job record:', jobError);
      throw new Error(`Failed to create job record: ${jobError.message}`);
    }

    console.log('Job record created successfully:', jobRecord.id);

    // Start processing users in background with enhanced error handling
    processUsersInBackground(targetUsernames, context, supabase);

    // Return immediate response with better estimation
    const estimatedTimePerUser = 30; // seconds
    const estimatedCompletion = new Date(Date.now() + (targetUsernames.length * estimatedTimePerUser * 1000));

    return {
      jobId: context.jobId,
      success: true,
      processedUsers: 0,
      successfulUsers: 0,
      failedUsers: 0,
      totalVehicles: 0,
      estimatedCompletion
    };

  } catch (error) {
    console.error('Enhanced import job failed:', error);
    
    // Update job status to failed with detailed error info
    await supabase
      .from('user_import_jobs')
      .update({
        status: 'failed',
        current_step: 'Job initialization failed',
        error_log: { 
          error: error.message, 
          timestamp: new Date().toISOString(),
          phase: 'initialization',
          stack: error.stack
        }
      })
      .eq('id', context.jobId);

    return {
      jobId: context.jobId,
      success: false,
      processedUsers: 0,
      successfulUsers: 0,
      failedUsers: targetUsernames.length,
      totalVehicles: 0,
      error: error.message
    };
  }
}

async function processUsersInBackground(
  targetUsernames: string[], 
  context: JobContext, 
  supabase: any
) {
  console.log('Starting background processing of', targetUsernames.length, 'users');
  let processedCount = 0;
  let successfulCount = 0;
  let failedCount = 0;
  
  for (let i = 0; i < targetUsernames.length; i++) {
    const username = targetUsernames[i];
    console.log(`Processing user ${i + 1}/${targetUsernames.length}: ${username}`);
    
    try {
      // Update progress with detailed step information
      const progress = Math.round(((i + 1) / targetUsernames.length) * 100);
      await supabase
        .from('user_import_jobs')
        .update({
          processed_usernames: i + 1,
          progress_percentage: progress,
          current_step: `Processing user: ${username}`,
          step_details: `${i + 1} of ${targetUsernames.length} users processed. Success: ${successfulCount}, Failed: ${failedCount}`
        })
        .eq('id', context.jobId);

      // Simulate user processing with realistic timing
      // In production, this would call actual GP51 APIs
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000)); // 1-3 seconds
      
      // Simulate success/failure (90% success rate for testing)
      const success = Math.random() > 0.1;
      
      if (success) {
        successfulCount++;
        console.log(`Successfully processed user: ${username}`);
      } else {
        failedCount++;
        console.log(`Failed to process user: ${username}`);
        
        // Log individual user failure
        await supabase
          .from('user_import_jobs')
          .update({
            error_log: { 
              username, 
              error: 'Simulated processing failure', 
              timestamp: new Date().toISOString(),
              phase: 'user_processing'
            }
          })
          .eq('id', context.jobId);
      }
      
      processedCount++;
      
      // Update metrics
      context.metrics.processedUsers = processedCount;
      context.metrics.successfulUsers = successfulCount;
      context.metrics.failedUsers = failedCount;
      
      // Calculate updated rates
      const updatedMetrics = MetricsCalculator.calculateRates(context.metrics, context.startTime);
      context.metrics = updatedMetrics;

    } catch (error) {
      console.error(`Failed to process user ${username}:`, error);
      failedCount++;
      context.metrics.failedUsers = failedCount;
      
      // Log detailed error for this user
      await supabase
        .from('user_import_jobs')
        .update({
          error_log: { 
            username, 
            error: error.message, 
            timestamp: new Date().toISOString(),
            phase: 'user_processing',
            stack: error.stack
          }
        })
        .eq('id', context.jobId);
    }
  }

  // Complete the job with comprehensive final status
  const finalStatus = failedCount === 0 ? 'completed' : (successfulCount > 0 ? 'completed_with_errors' : 'failed');
  
  await supabase
    .from('user_import_jobs')
    .update({
      status: finalStatus,
      completed_at: new Date().toISOString(),
      progress_percentage: 100,
      current_step: 'Import completed',
      step_details: `Final results: ${successfulCount} successful, ${failedCount} failed out of ${targetUsernames.length} total users`,
      successful_imports: successfulCount,
      failed_imports: failedCount,
      total_vehicles_imported: successfulCount * 2 // Simulate 2 vehicles per successful user
    })
    .eq('id', context.jobId);

  console.log('Background processing completed with results:', {
    total: targetUsernames.length,
    successful: successfulCount,
    failed: failedCount,
    status: finalStatus
  });
  
  MetricsCalculator.logFinalMetrics(context.metrics);
}
