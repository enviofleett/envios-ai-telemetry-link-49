
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🕐 Starting scheduled GP51 sync...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if sync is already running
    const { data: runningSyncs } = await supabase
      .from('bulk_import_jobs')
      .select('id')
      .in('status', ['pending', 'running'])
      .eq('import_type', 'scheduled_gp51_sync')
      .limit(1);

    if (runningSyncs && runningSyncs.length > 0) {
      console.log('⚠️ Sync already running, skipping...');
      return new Response(JSON.stringify({
        success: true,
        message: 'Sync already in progress',
        skipped: true
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create sync job record
    const { data: syncJob } = await supabase
      .from('bulk_import_jobs')
      .insert({
        job_name: `Scheduled GP51 Sync - ${new Date().toISOString()}`,
        import_type: 'scheduled_gp51_sync',
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    console.log(`📋 Created sync job: ${syncJob.id}`);

    // Call the enhanced bulk import
    const importResponse = await supabase.functions.invoke('enhanced-bulk-import', {
      body: {
        action: 'start_import',
        importUsers: true,
        importDevices: true,
        conflictResolution: 'update',
        scheduledSync: true,
        jobId: syncJob.id
      }
    });

    if (importResponse.error) {
      console.error('❌ Scheduled sync failed:', importResponse.error);
      
      await supabase
        .from('bulk_import_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_log: [{ error: importResponse.error.message, timestamp: new Date().toISOString() }]
        })
        .eq('id', syncJob.id);

      return new Response(JSON.stringify({
        success: false,
        error: importResponse.error.message,
        jobId: syncJob.id
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Scheduled sync completed successfully');

    return new Response(JSON.stringify({
      success: true,
      message: 'Scheduled sync completed successfully',
      jobId: syncJob.id,
      importResult: importResponse.data
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Scheduled sync error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
