
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnhancedCSVRowData {
  user_name: string;
  user_email: string;
  user_phone?: string;
  gp51_username?: string;
  device_id: string;
  device_name: string;
  device_type?: string;
  sim_number?: string;
  assignment_type?: 'assigned' | 'owner' | 'operator';
  notes?: string;
  generated_username?: string;
  validation_flags?: string[];
}

interface ImportPreviewData {
  valid_rows: EnhancedCSVRowData[];
  summary: {
    total_rows: number;
    valid_rows: number;
    unique_users: number;
    unique_devices: number;
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

    const { jobId, previewData, gp51SyncEnabled = true } = await req.json();

    if (!jobId || !previewData) {
      return new Response(
        JSON.stringify({ error: 'Missing jobId or previewData' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting enhanced CSV import for job: ${jobId}`);

    // Update job status to processing
    await supabase
      .from('csv_import_jobs')
      .update({
        status: 'processing',
        progress_percentage: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    const validRows: EnhancedCSVRowData[] = previewData.valid_rows;
    let successCount = 0;
    let failureCount = 0;
    const errors = [];
    const processedUsers = new Map<string, string>(); // email -> user_id
    const userVehicleRelationships = [];

    // Phase 1: Create or update users
    console.log('Phase 1: Processing users...');
    await supabase
      .from('csv_import_jobs')
      .update({
        progress_percentage: 10,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      
      try {
        let userId: string;
        
        // Check if user exists
        const { data: existingUser } = await supabase
          .from('envio_users')
          .select('id')
          .eq('email', row.user_email)
          .single();

        if (existingUser) {
          userId = existingUser.id;
          console.log(`User exists: ${row.user_email} -> ${userId}`);
        } else {
          // Create new user
          const { data: newUser, error: userError } = await supabase
            .from('envio_users')
            .insert({
              name: row.user_name,
              email: row.user_email,
              phone_number: row.user_phone || null,
              gp51_username: row.generated_username || row.gp51_username,
              import_source: 'enhanced_csv_import',
              is_gp51_imported: gp51SyncEnabled,
              registration_status: 'completed',
              registration_type: 'admin',
              needs_password_set: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select('id')
            .single();

          if (userError) {
            throw new Error(`Failed to create user: ${userError.message}`);
          }

          userId = newUser.id;
          console.log(`Created user: ${row.user_email} -> ${userId}`);

          // Track sync status for new users
          if (gp51SyncEnabled) {
            await supabase
              .from('gp51_sync_status')
              .insert({
                import_job_id: jobId,
                entity_type: 'user',
                entity_id: userId,
                sync_status: 'pending'
              });
          }
        }

        processedUsers.set(row.user_email, userId);

        // Store relationship data for Phase 2
        userVehicleRelationships.push({
          userId,
          row,
          rowIndex: i
        });

      } catch (error) {
        console.error(`Error processing user ${row.user_email}:`, error);
        failureCount++;
        errors.push({
          row_number: i + 1,
          field_name: 'user',
          error_message: error.message || 'Unknown error during user creation',
          raw_data: row
        });
      }
    }

    // Phase 2: Create vehicles and assignments
    console.log('Phase 2: Processing vehicles and assignments...');
    await supabase
      .from('csv_import_jobs')
      .update({
        progress_percentage: 50,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    for (const { userId, row, rowIndex } of userVehicleRelationships) {
      try {
        // Check if vehicle exists
        const { data: existingVehicle } = await supabase
          .from('vehicles')
          .select('id')
          .eq('device_id', row.device_id)
          .single();

        let vehicleId: string;

        if (existingVehicle) {
          vehicleId = existingVehicle.id;
          
          // Update assignment
          await supabase
            .from('vehicles')
            .update({
              assigned_user_id: userId,
              updated_at: new Date().toISOString()
            })
            .eq('id', vehicleId);
            
          console.log(`Updated vehicle assignment: ${row.device_id} -> ${userId}`);
        } else {
          // Create new vehicle
          const { data: newVehicle, error: vehicleError } = await supabase
            .from('vehicles')
            .insert({
              device_id: row.device_id,
              device_name: row.device_name,
              device_type: row.device_type || 'GPS Tracker',
              sim_number: row.sim_number || null,
              status: 'active',
              notes: row.notes || null,
              assigned_user_id: userId,
              is_active: true,
              import_source: 'enhanced_csv_import',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select('id')
            .single();

          if (vehicleError) {
            throw new Error(`Failed to create vehicle: ${vehicleError.message}`);
          }

          vehicleId = newVehicle.id;
          console.log(`Created vehicle: ${row.device_id} -> ${vehicleId}`);

          // Track sync status for new vehicles
          if (gp51SyncEnabled) {
            await supabase
              .from('gp51_sync_status')
              .insert({
                import_job_id: jobId,
                entity_type: 'vehicle',
                entity_id: vehicleId,
                sync_status: 'pending'
              });
          }
        }

        // Create relationship record
        await supabase
          .from('csv_import_relationships')
          .insert({
            import_job_id: jobId,
            user_identifier: row.user_email,
            device_id: row.device_id,
            relationship_type: row.assignment_type || 'assigned',
            row_number: rowIndex + 1,
            sync_status: 'synced'
          });

        successCount++;

      } catch (error) {
        console.error(`Error processing vehicle ${row.device_id}:`, error);
        failureCount++;
        errors.push({
          row_number: rowIndex + 1,
          field_name: 'vehicle',
          error_message: error.message || 'Unknown error during vehicle creation',
          raw_data: row
        });
      }

      // Update progress
      const progress = Math.round(50 + ((rowIndex + 1) / userVehicleRelationships.length) * 40);
      await supabase
        .from('csv_import_jobs')
        .update({
          processed_rows: rowIndex + 1,
          successful_imports: successCount,
          failed_imports: failureCount,
          progress_percentage: progress,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);
    }

    // Phase 3: GP51 Synchronization (if enabled)
    if (gp51SyncEnabled) {
      console.log('Phase 3: GP51 synchronization...');
      await supabase
        .from('csv_import_jobs')
        .update({
          progress_percentage: 90,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      // Here you would implement GP51 API calls
      // For now, we'll mark as pending sync
      console.log('GP51 sync marked as pending - implement actual sync logic here');
    }

    // Final job update
    const finalStatus = failureCount === 0 ? 'completed' : 'completed';
    const uniqueUsers = processedUsers.size;
    const uniqueDevices = new Set(validRows.map(r => r.device_id)).size;

    await supabase
      .from('csv_import_jobs')
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString(),
        progress_percentage: 100,
        error_log: errors,
        import_results: {
          total_processed: validRows.length,
          successful: successCount,
          failed: failureCount,
          unique_users: uniqueUsers,
          unique_devices: uniqueDevices,
          gp51_sync_enabled: gp51SyncEnabled,
          completion_time: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    // Log validation errors if any
    if (errors.length > 0) {
      const validationLogs = errors.map(error => ({
        import_job_id: jobId,
        row_number: error.row_number,
        validation_type: 'import_error',
        field_name: error.field_name,
        error_message: error.error_message,
        raw_data: error.raw_data,
        created_at: new Date().toISOString()
      }));

      await supabase
        .from('csv_validation_logs')
        .insert(validationLogs);
    }

    console.log(`Enhanced CSV import completed for job: ${jobId}. Users: ${uniqueUsers}, Vehicles: ${uniqueDevices}, Success: ${successCount}, Failed: ${failureCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        results: {
          total_processed: validRows.length,
          successful: successCount,
          failed: failureCount,
          unique_users: uniqueUsers,
          unique_devices: uniqueDevices,
          gp51_sync_enabled: gp51SyncEnabled,
          errors: errors
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Enhanced CSV import error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
