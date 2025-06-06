
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
    // Create database job record
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
        step_details: `Processing ${targetUsernames.length} users`
      })
      .select()
      .single();

    if (jobError) {
      console.error('Failed to create job record:', jobError);
      throw new Error(`Failed to create job record: ${jobError.message}`);
    }

    console.log('Job record created:', jobRecord.id);

    // Start processing users in background
    processUsersInBackground(targetUsernames, context, supabase);

    // Return immediate response
    return {
      jobId: context.jobId,
      success: true,
      processedUsers: 0,
      successfulUsers: 0,
      failedUsers: 0,
      totalVehicles: 0,
      estimatedCompletion: new Date(Date.now() + (targetUsernames.length * 30000)) // Estimate 30s per user
    };

  } catch (error) {
    console.error('Enhanced import job failed:', error);
    
    // Update job status to failed
    await supabase
      .from('user_import_jobs')
      .update({
        status: 'failed',
        error_log: { error: error.message, timestamp: new Date().toISOString() }
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
  console.log('Starting background processing of users');
  
  for (let i = 0; i < targetUsernames.length; i++) {
    const username = targetUsernames[i];
    console.log(`Processing user ${i + 1}/${targetUsernames.length}: ${username}`);
    
    try {
      // Update progress
      const progress = Math.round(((i + 1) / targetUsernames.length) * 100);
      await supabase
        .from('user_import_jobs')
        .update({
          processed_usernames: i + 1,
          progress_percentage: progress,
          current_step: `Processing user: ${username}`,
          step_details: `${i + 1} of ${targetUsernames.length} users processed`
        })
        .eq('id', context.jobId);

      // Simulate user processing (replace with actual GP51 API calls)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update metrics
      context.metrics.processedUsers = i + 1;
      context.metrics.successfulUsers++;
      
      // Calculate rates
      const updatedMetrics = MetricsCalculator.calculateRates(context.metrics, context.startTime);
      context.metrics = updatedMetrics;

    } catch (error) {
      console.error(`Failed to process user ${username}:`, error);
      context.metrics.failedUsers++;
      
      // Log error
      await supabase
        .from('user_import_jobs')
        .update({
          error_log: { 
            username, 
            error: error.message, 
            timestamp: new Date().toISOString() 
          }
        })
        .eq('id', context.jobId);
    }
  }

  // Complete the job
  await supabase
    .from('user_import_jobs')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      progress_percentage: 100,
      current_step: 'Import completed',
      successful_imports: context.metrics.successfulUsers,
      failed_imports: context.metrics.failedUsers,
      total_vehicles_imported: context.metrics.totalVehicles
    })
    .eq('id', context.jobId);

  console.log('Background processing completed');
  MetricsCalculator.logFinalMetrics(context.metrics);
}
