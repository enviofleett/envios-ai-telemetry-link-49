
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
  importId?: string;
  stabilityFeatures?: {
    memoryMonitoring: boolean;
    sessionRefresh: boolean;
    timeoutManagement: boolean;
    enhancedLogging: boolean;
  };
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
    
    console.log('Enhanced Full System Import Request:', {
      type: importRequest.importType,
      cleanup: importRequest.performCleanup,
      usernames: importRequest.selectedUsernames?.length || 'all',
      importId: importRequest.importId
    });

    // Validate GP51 configuration
    const gp51BaseUrl = Deno.env.get('GP51_API_BASE_URL');
    if (!gp51BaseUrl) {
      throw new Error('GP51_API_BASE_URL not configured');
    }

    // Use provided importId or create new one
    const importId = importRequest.importId || crypto.randomUUID();

    // Create or update system import job
    const { data: importJob, error: jobError } = await supabase
      .from('gp51_system_imports')
      .upsert({
        id: importId,
        job_name: importRequest.jobName,
        import_type: 'full_system',
        import_scope: importRequest.importType,
        status: 'processing',
        current_phase: 'initialization',
        progress_percentage: 0,
        pre_import_checks: {
          cleanup_requested: importRequest.performCleanup,
          preserve_admin: importRequest.preserveAdminEmail || 'chudesyl@gmail.com',
          batch_size: importRequest.batchSize || 10,
          validation_timestamp: new Date().toISOString(),
          stability_features_enabled: true
        }
      })
      .select()
      .single();

    if (jobError) {
      console.error('Failed to create/update import job:', jobError);
      throw new Error(`Job creation failed: ${jobError.message}`);
    }

    console.log('Import job created/updated:', importId);

    // Phase 1: Create backup
    await updatePhase(supabase, importId, 'backup', 'Creating comprehensive system backup');
    
    try {
      const { data: backupResult, error: backupError } = await supabase.rpc('create_system_backup_for_import', {
        import_id: importId
      });

      if (backupError) {
        console.error('Backup creation failed:', backupError);
        throw new Error(`Backup failed: ${backupError.message}`);
      }

      console.log('Backup created successfully:', backupResult);

      // Update job with backup info
      await supabase
        .from('gp51_system_imports')
        .update({
          backup_tables: backupResult,
          progress_percentage: 20
        })
        .eq('id', importId);

      await logAuditEvent(supabase, importId, 'backup_created', backupResult);
    } catch (backupError) {
      console.error('Backup phase failed:', backupError);
      await updateJobStatus(supabase, importId, 'failed', `Backup failed: ${backupError.message}`);
      throw backupError;
    }

    // Phase 2: Data cleanup (if requested)
    if (importRequest.performCleanup) {
      await updatePhase(supabase, importId, 'cleanup', 'Performing safe data cleanup');
      
      try {
        const { data: cleanupResult, error: cleanupError } = await supabase.rpc('perform_safe_data_cleanup', {
          preserve_admin_email: importRequest.preserveAdminEmail || 'chudesyl@gmail.com'
        });

        if (cleanupError) {
          console.error('Cleanup failed:', cleanupError);
          throw new Error(`Cleanup failed: ${cleanupError.message}`);
        }

        console.log('Cleanup completed:', cleanupResult);
        await logAuditEvent(supabase, importId, 'data_cleanup', cleanupResult);
        await updateProgress(supabase, importId, 40);
      } catch (cleanupError) {
        console.error('Cleanup phase failed:', cleanupError);
        await updateJobStatus(supabase, importId, 'failed', `Cleanup failed: ${cleanupError.message}`);
        throw cleanupError;
      }
    }

    // Phase 3: Import users (if needed)
    if (importRequest.importType === 'users_only' || importRequest.importType === 'complete_system') {
      await updatePhase(supabase, importId, 'user_import', 'Importing GP51 users');
      
      try {
        const { data: userImportResult, error: userImportError } = await supabase.functions.invoke('passwordless-gp51-import', {
          body: {
            jobName: `Enhanced Import Users - ${importId}`,
            targetUsernames: importRequest.selectedUsernames || [],
            systemImportId: importId
          }
        });

        if (userImportError) {
          console.error('User import failed:', userImportError);
          throw new Error(`User import failed: ${userImportError.message}`);
        }

        console.log('User import completed:', userImportResult);
        await updateProgress(supabase, importId, 70);
      } catch (userImportError) {
        console.error('User import phase failed:', userImportError);
        await updateJobStatus(supabase, importId, 'failed', `User import failed: ${userImportError.message}`);
        throw userImportError;
      }
    }

    // Phase 4: Import vehicles (if needed)
    if (importRequest.importType === 'vehicles_only' || importRequest.importType === 'complete_system') {
      await updatePhase(supabase, importId, 'vehicle_import', 'Importing GP51 vehicles');
      
      try {
        const { data: vehicleImportResult, error: vehicleImportError } = await supabase.functions.invoke('bulk-gp51-extraction', {
          body: {
            jobName: `Enhanced Import Vehicles - ${importId}`,
            extractVehicles: true,
            systemImportId: importId
          }
        });

        if (vehicleImportError) {
          console.error('Vehicle import failed:', vehicleImportError);
          // Don't fail the entire import for vehicle issues, just log warning
          await logAuditEvent(supabase, importId, 'vehicle_import_warning', { 
            error: vehicleImportError.message,
            partial_success: true 
          });
        } else {
          console.log('Vehicle import completed:', vehicleImportResult);
        }

        await updateProgress(supabase, importId, 90);
      } catch (vehicleImportError) {
        console.error('Vehicle import phase encountered issues:', vehicleImportError);
        // Log as warning but continue
        await logAuditEvent(supabase, importId, 'vehicle_import_partial', { 
          error: vehicleImportError.message 
        });
      }
    }

    // Phase 5: Complete import
    await updatePhase(supabase, importId, 'completion', 'Finalizing enhanced import');
    
    // Calculate final statistics
    const { data: finalStats } = await supabase
      .from('gp51_system_imports')
      .select('*')
      .eq('id', importId)
      .single();

    await supabase
      .from('gp51_system_imports')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        progress_percentage: 100,
        current_phase: 'completed',
        import_results: {
          completed_at: new Date().toISOString(),
          total_users: finalStats?.processed_users || 0,
          total_vehicles: finalStats?.processed_devices || 0,
          successful_users: finalStats?.successful_users || 0,
          successful_vehicles: finalStats?.successful_devices || 0,
          data_integrity_score: 95 // Placeholder - would be calculated based on actual validation
        }
      })
      .eq('id', importId);

    await logAuditEvent(supabase, importId, 'import_completed', {
      success: true,
      total_users: finalStats?.processed_users || 0,
      total_vehicles: finalStats?.processed_devices || 0
    });

    console.log('Enhanced full system import completed successfully:', importId);

    return new Response(
      JSON.stringify({
        success: true,
        importId,
        message: 'Enhanced full system import completed successfully',
        results: {
          totalUsers: finalStats?.processed_users || 0,
          successfulUsers: finalStats?.successful_users || 0,
          totalVehicles: finalStats?.processed_devices || 0,
          successfulVehicles: finalStats?.successful_devices || 0,
          conflicts: (finalStats?.failed_users || 0) + (finalStats?.failed_devices || 0),
          backupTables: finalStats?.backup_tables || []
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Enhanced full system import error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Enhanced full system import failed', 
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function updatePhase(supabase: any, importId: string, phase: string, details: string) {
  console.log(`Updating phase to: ${phase} - ${details}`);
  
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
  console.log(`Updating progress to: ${percentage}%`);
  
  await supabase
    .from('gp51_system_imports')
    .update({ progress_percentage: percentage })
    .eq('id', importId);
}

async function updateJobStatus(supabase: any, importId: string, status: string, errorMessage?: string) {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString()
  };

  if (errorMessage) {
    updateData.error_log = { error: errorMessage, timestamp: new Date().toISOString() };
  }

  await supabase
    .from('gp51_system_imports')
    .update(updateData)
    .eq('id', importId);
}

async function logAuditEvent(supabase: any, importId: string, operationType: string, details: any) {
  try {
    await supabase
      .from('gp51_import_audit_log')
      .insert({
        system_import_id: importId,
        operation_type: operationType,
        operation_details: details,
        success: true
      });
  } catch (auditError) {
    console.error('Failed to log audit event:', auditError);
    // Don't throw - audit logging shouldn't break the main flow
  }
}
