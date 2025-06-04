
import { getStoredGP51Credentials } from './credential-manager.ts';
import { cleanupStuckJobs } from './cleanup-jobs.ts';

export interface JobInitializationResult {
  success: boolean;
  error?: string;
  adminToken?: string;
  adminUsername?: string;
  jobRecord?: any;
}

export async function initializeImportJob(
  jobName: string,
  validUsernames: string[],
  supabase: any
): Promise<JobInitializationResult> {
  try {
    console.log(`Starting automated passwordless import job: "${jobName}" for ${validUsernames.length} users: [${validUsernames.join(', ')}]`);

    // Clean up any stuck jobs first
    console.log('Cleaning up stuck jobs...');
    await cleanupStuckJobs(supabase);

    // Get stored GP51 credentials
    console.log('Retrieving stored GP51 credentials...');
    const credentialsResult = await getStoredGP51Credentials(supabase);
    
    if (!credentialsResult.success) {
      console.error('Failed to get stored GP51 credentials:', credentialsResult.error);
      return {
        success: false,
        error: 'GP51 connection not configured'
      };
    }

    const { token: adminToken, username: adminUsername } = credentialsResult;
    console.log(`Using stored credentials for admin: ${adminUsername}`);

    // Create import job record
    console.log('Creating import job record...');
    const { data: job, error: jobError } = await supabase
      .from('user_import_jobs')
      .insert({
        job_name: jobName.trim(),
        import_type: 'passwordless',
        total_usernames: validUsernames.length,
        admin_gp51_username: adminUsername,
        imported_usernames: validUsernames,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (jobError) {
      console.error('Failed to create import job record:', jobError);
      return {
        success: false,
        error: 'Failed to create import job'
      };
    }

    console.log(`Created import job ${job.id} for ${validUsernames.length} users`);

    return {
      success: true,
      adminToken: adminToken!,
      adminUsername: adminUsername!,
      jobRecord: job
    };

  } catch (error) {
    console.error('Job initialization failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
