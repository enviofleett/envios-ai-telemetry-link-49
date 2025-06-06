
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SystemImportRequest {
  importType: 'users_only' | 'vehicles_only' | 'complete_system' | 'selective';
  selectedUsernames?: string[];
  performCleanup?: boolean;
  preserveAdminEmail?: string;
  batchSize?: number;
  jobName: string;
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

    const importRequest: SystemImportRequest = await req.json();
    
    console.log('Full System Import Request:', {
      type: importRequest.importType,
      cleanup: importRequest.performCleanup,
      usernames: importRequest.selectedUsernames?.length || 'all'
    });

    // Validate GP51 configuration
    const gp51BaseUrl = Deno.env.get('GP51_API_BASE_URL');
    if (!gp51BaseUrl) {
      throw new Error('GP51_API_BASE_URL not configured');
    }

    // Create system import job
    const { data: importJob, error: jobError } = await supabase
      .from('gp51_system_imports')
      .insert({
        job_name: importRequest.jobName,
        import_type: 'full_system',
        import_scope: importRequest.importType,
        status: 'processing',
        current_phase: 'initialization',
        pre_import_checks: {
          cleanup_requested: importRequest.performCleanup,
          preserve_admin: importRequest.preserveAdminEmail,
          batch_size: importRequest.batchSize
        }
      })
      .select()
      .single();

    if (jobError) {
      console.error('Failed to create import job:', jobError);
      throw jobError;
    }

    const importId = importJob.id;
    console.log('Created system import job:', importId);

    // Phase 1: Create backup
    await updatePhase(supabase, importId, 'backup', 'Creating system backup');
    const { data: backupResult, error: backupError } = await supabase.rpc('create_system_backup_for_import', {
      import_id: importId
    });

    if (backupError) {
      throw new Error(`Backup failed: ${backupError.message}`);
    }

    // Update job with backup info
    await supabase
      .from('gp51_system_imports')
      .update({
        backup_tables: backupResult,
        progress_percentage: 20
      })
      .eq('id', importId);

    // Phase 2: Data cleanup (if requested)
    if (importRequest.performCleanup) {
      await updatePhase(supabase, importId, 'cleanup', 'Cleaning existing data');
      
      const { data: cleanupResult, error: cleanupError } = await supabase.rpc('perform_safe_data_cleanup', {
        preserve_admin_email: importRequest.preserveAdminEmail || 'chudesyl@gmail.com'
      });

      if (cleanupError) {
        throw new Error(`Cleanup failed: ${cleanupError.message}`);
      }

      await logAuditEvent(supabase, importId, 'data_cleanup', cleanupResult);
      await updateProgress(supabase, importId, 40);
    }

    // Phase 3: Import users (if needed)
    if (importRequest.importType === 'users_only' || importRequest.importType === 'complete_system') {
      await updatePhase(supabase, importId, 'user_import', 'Importing GP51 users');
      
      // Use supabase.functions.invoke instead of fetch
      const { data: userImportResult, error: userImportError } = await supabase.functions.invoke('passwordless-gp51-import', {
        body: {
          jobName: `System Import Users - ${importId}`,
          targetUsernames: importRequest.selectedUsernames || [],
          systemImportId: importId
        }
      });

      if (userImportError) {
        console.error('User import failed:', userImportError);
        throw new Error(`User import failed: ${userImportError.message}`);
      }

      await updateProgress(supabase, importId, 70);
    }

    // Phase 4: Import vehicles (if needed)
    if (importRequest.importType === 'vehicles_only' || importRequest.importType === 'complete_system') {
      await updatePhase(supabase, importId, 'vehicle_import', 'Importing GP51 vehicles');
      
      // Use supabase.functions.invoke for vehicle extraction
      const { data: vehicleImportResult, error: vehicleImportError } = await supabase.functions.invoke('bulk-gp51-extraction', {
        body: {
          jobName: `System Import Vehicles - ${importId}`,
          extractVehicles: true,
          systemImportId: importId
        }
      });

      if (vehicleImportError) {
        console.error('Vehicle import failed:', vehicleImportError);
        // Don't fail the entire import for vehicle issues, just log
        await logAuditEvent(supabase, importId, 'vehicle_import_warning', { error: vehicleImportError.message });
      }

      await updateProgress(supabase, importId, 90);
    }

    // Phase 5: Complete import
    await updatePhase(supabase, importId, 'completion', 'Finalizing import');
    
    await supabase
      .from('gp51_system_imports')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        progress_percentage: 100,
        current_phase: 'completed'
      })
      .eq('id', importId);

    console.log('Full system import completed successfully:', importId);

    return new Response(
      JSON.stringify({
        success: true,
        importId,
        message: 'Full system import completed successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Full system import error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Full system import failed', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function updatePhase(supabase: any, importId: string, phase: string, details: string) {
  await supabase
    .from('gp51_system_imports')
    .update({
      current_phase: phase,
      phase_details: details
    })
    .eq('id', importId);

  await supabase
    .from('gp51_import_progress_phases')
    .upsert({
      system_import_id: importId,
      phase_name: phase,
      phase_status: 'running',
      started_at: new Date().toISOString(),
      phase_details: { details }
    });
}

async function updateProgress(supabase: any, importId: string, percentage: number) {
  await supabase
    .from('gp51_system_imports')
    .update({ progress_percentage: percentage })
    .eq('id', importId);
}

async function logAuditEvent(supabase: any, importId: string, operationType: string, details: any) {
  await supabase
    .from('gp51_import_audit_log')
    .insert({
      system_import_id: importId,
      operation_type: operationType,
      operation_details: details,
      success: true
    });
}
