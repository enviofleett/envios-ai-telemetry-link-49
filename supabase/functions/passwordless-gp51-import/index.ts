
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PasswordlessImportJob } from './types.ts';
import { authenticateGP51 } from './gp51-auth.ts';
import { processUsersWithRateLimit } from './job-manager.ts';

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

    const { jobName, adminGp51Username, adminGp51Password, targetUsernames }: PasswordlessImportJob = await req.json();

    if (!jobName || !adminGp51Username || !adminGp51Password || !targetUsernames || !Array.isArray(targetUsernames)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid request. jobName, adminGp51Username, adminGp51Password, and targetUsernames array required.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Starting passwordless import job: ${jobName} for ${targetUsernames.length} users`);

    // Create import job record
    const { data: job, error: jobError } = await supabase
      .from('user_import_jobs')
      .insert({
        job_name: jobName,
        import_type: 'passwordless',
        total_usernames: targetUsernames.length,
        admin_gp51_username: adminGp51Username,
        imported_usernames: targetUsernames,
        status: 'processing'
      })
      .select()
      .single();

    if (jobError) {
      console.error('Failed to create import job record:', jobError);
      throw new Error('Failed to create import job');
    }

    console.log(`Created import job ${job.id} for ${targetUsernames.length} users`);

    // Get admin GP51 token for data access
    const adminToken = await authenticateGP51({ username: adminGp51Username, password: adminGp51Password });

    // Process users with rate limiting
    const processingResults = await processUsersWithRateLimit(
      targetUsernames,
      adminToken,
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

    console.log(`Passwordless import completed. Success: ${processingResults.successCount}, Failed: ${processingResults.failedCount}, Total Vehicles: ${processingResults.totalVehicles}`);

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
      results: processingResults.results
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

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
