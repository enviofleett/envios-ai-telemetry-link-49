
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PasswordlessImportJob } from './types.ts';
import { processUsersWithRateLimit } from './job-manager.ts';
import { cleanupStuckJobs } from './cleanup-jobs.ts';
import { getStoredGP51Credentials } from './credential-manager.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { jobName, targetUsernames }: { jobName: string; targetUsernames: string[] } = await req.json();

    if (!jobName || !targetUsernames || !Array.isArray(targetUsernames)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid request. jobName and targetUsernames array required.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Starting automated passwordless import job: ${jobName} for ${targetUsernames.length} users`);

    // Clean up any stuck jobs first
    await cleanupStuckJobs(supabase);

    // Get stored GP51 credentials instead of requiring manual input
    const credentialsResult = await getStoredGP51Credentials(supabase);
    
    if (!credentialsResult.success) {
      console.error('Failed to get stored GP51 credentials:', credentialsResult.error);
      return new Response(JSON.stringify({ 
        error: 'GP51 connection not configured',
        details: credentialsResult.error,
        action: 'Please configure GP51 credentials in Admin Settings'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { token: adminToken, username: adminUsername } = credentialsResult;

    // Create import job record
    const { data: job, error: jobError } = await supabase
      .from('user_import_jobs')
      .insert({
        job_name: jobName,
        import_type: 'passwordless',
        total_usernames: targetUsernames.length,
        admin_gp51_username: adminUsername,
        imported_usernames: targetUsernames,
        status: 'processing'
      })
      .select()
      .single();

    if (jobError) {
      console.error('Failed to create import job record:', jobError);
      throw new Error('Failed to create import job');
    }

    console.log(`Created import job ${job.id} using stored credentials for admin ${adminUsername}`);

    try {
      console.log('Using stored GP51 credentials for data import...');

      // Process users with rate limiting using the stored admin token
      const processingResults = await processUsersWithRateLimit(
        targetUsernames,
        adminToken!,
        job.id,
        supabase
      );

      // Final job update
      const finalStatus = processingResults.failedCount === targetUsernames.length ? 'failed' : 'completed';
      await supabase
        .from('user_import_jobs')
        .update({
          status: finalStatus,
          processed_usernames: processingResults.processedCount,
          successful_imports: processingResults.successCount,
          failed_imports: processingResults.failedCount,
          total_vehicles_imported: processingResults.totalVehicles,
          import_results: processingResults.results,
          error_log: processingResults.errorLog,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id);

      console.log(`Automated passwordless import completed. Success: ${processingResults.successCount}, Failed: ${processingResults.failedCount}, Total Vehicles: ${processingResults.totalVehicles}`);

      return new Response(JSON.stringify({
        success: true,
        jobId: job.id,
        summary: {
          totalUsers: targetUsernames.length,
          processedUsers: processingResults.processedCount,
          successfulImports: processingResults.successCount,
          failedImports: processingResults.failedCount,
          totalVehicles: processingResults.totalVehicles
        },
        results: processingResults.results,
        adminUsername: adminUsername
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (importError) {
      console.error('Import process failed:', importError);
      
      // Update job status to failed
      await supabase
        .from('user_import_jobs')
        .update({
          status: 'failed',
          error_log: [{ 
            error: `Import process failed: ${importError.message}`, 
            timestamp: new Date().toISOString() 
          }],
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id);

      return new Response(JSON.stringify({ 
        error: 'Import process failed',
        details: importError.message,
        jobId: job.id
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Passwordless import error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
