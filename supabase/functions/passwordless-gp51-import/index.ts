
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log(`=== Passwordless Import Request Started at ${new Date().toISOString()} ===`);

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method !== 'POST') {
      console.error('Invalid method:', req.method);
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const requestBody = await req.json();
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const { jobName, targetUsernames }: { jobName: string; targetUsernames: string[] } = requestBody;

    // Enhanced input validation
    if (!jobName || typeof jobName !== 'string' || jobName.trim().length === 0) {
      console.error('Invalid jobName:', jobName);
      return new Response(JSON.stringify({ 
        error: 'Invalid job name. Must be a non-empty string.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!targetUsernames || !Array.isArray(targetUsernames) || targetUsernames.length === 0) {
      console.error('Invalid targetUsernames:', targetUsernames);
      return new Response(JSON.stringify({ 
        error: 'Invalid target usernames. Must be a non-empty array.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Filter and validate usernames
    const validUsernames = targetUsernames
      .filter(username => username && typeof username === 'string' && username.trim().length > 0)
      .map(username => username.trim());

    if (validUsernames.length === 0) {
      console.error('No valid usernames found');
      return new Response(JSON.stringify({ 
        error: 'No valid usernames provided.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Starting automated passwordless import job: "${jobName}" for ${validUsernames.length} users: [${validUsernames.join(', ')}]`);

    // Clean up any stuck jobs first
    console.log('Cleaning up stuck jobs...');
    await cleanupStuckJobs(supabase);

    // Get stored GP51 credentials
    console.log('Retrieving stored GP51 credentials...');
    const credentialsResult = await getStoredGP51Credentials(supabase);
    
    if (!credentialsResult.success) {
      console.error('Failed to get stored GP51 credentials:', credentialsResult.error);
      return new Response(JSON.stringify({ 
        error: 'GP51 connection not configured',
        details: credentialsResult.error,
        action: 'Please configure GP51 credentials in Admin Settings',
        timestamp: new Date().toISOString()
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
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
      return new Response(JSON.stringify({ 
        error: 'Failed to create import job',
        details: jobError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Created import job ${job.id} for ${validUsernames.length} users`);

    try {
      console.log('Starting user processing with rate limiting...');

      // Process users with enhanced error handling and rate limiting
      const processingResults = await processUsersWithRateLimit(
        validUsernames,
        adminToken!,
        job.id,
        supabase
      );

      // Determine final status
      const finalStatus = processingResults.failedCount === validUsernames.length ? 'failed' : 
                         processingResults.successCount === 0 ? 'failed' : 'completed';

      // Final job update
      const completedAt = new Date().toISOString();
      const { error: finalUpdateError } = await supabase
        .from('user_import_jobs')
        .update({
          status: finalStatus,
          processed_usernames: processingResults.processedCount,
          successful_imports: processingResults.successCount,
          failed_imports: processingResults.failedCount,
          total_vehicles_imported: processingResults.totalVehicles,
          import_results: processingResults.results,
          error_log: processingResults.errorLog,
          completed_at: completedAt,
          updated_at: completedAt,
          progress_percentage: 100
        })
        .eq('id', job.id);

      if (finalUpdateError) {
        console.error('Failed to update final job status:', finalUpdateError);
      }

      const duration = Date.now() - startTime;
      console.log(`=== Passwordless import completed in ${duration}ms ===`);
      console.log(`Results: ${processingResults.successCount} successful, ${processingResults.failedCount} failed, ${processingResults.totalVehicles} vehicles`);

      return new Response(JSON.stringify({
        success: true,
        jobId: job.id,
        duration: duration,
        summary: {
          totalUsers: validUsernames.length,
          processedUsers: processingResults.processedCount,
          successfulImports: processingResults.successCount,
          failedImports: processingResults.failedCount,
          totalVehicles: processingResults.totalVehicles
        },
        results: processingResults.results,
        adminUsername: adminUsername,
        status: finalStatus,
        timestamp: completedAt
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
            timestamp: new Date().toISOString(),
            step: 'import_process'
          }],
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id);

      return new Response(JSON.stringify({ 
        error: 'Import process failed',
        details: importError.message,
        jobId: job.id,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`=== Passwordless import error after ${duration}ms ===`, error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
