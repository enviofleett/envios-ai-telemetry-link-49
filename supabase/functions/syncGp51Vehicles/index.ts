
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase_client.ts";
import { getValidGp51Session } from "../_shared/gp51_session_utils.ts";
import { createErrorResponse } from "../_shared/response_utils.ts";

serve(async (req) => {
  const startTime = Date.now();
  console.log('🚀 GP51 Vehicle Sync Started');

  try {
    const supabase = getSupabaseClient();
    
    // Create sync status record
    const { data: syncStatus, error: syncError } = await supabase
      .from('gp51_sync_status')
      .insert({
        sync_type: 'vehicle_sync',
        status: 'running',
        sync_details: { started_at: new Date().toISOString() }
      })
      .select()
      .single();

    if (syncError) {
      console.error('❌ Failed to create sync status:', syncError);
      return createErrorResponse('Failed to initialize sync', syncError.message, 500);
    }

    const syncId = syncStatus.id;

    try {
      // Validate GP51 session
      const { session, errorResponse } = await getValidGp51Session();
      if (errorResponse) {
        await updateSyncStatus(supabase, syncId, 'failed', 0, 0, 1, 'No valid GP51 session');
        return errorResponse;
      }

      console.log('✅ GP51 session validated');

      // Fetch vehicles from GP51
      const devicesResponse = await fetch(`${session.api_url}/webapi?operation=get_devices&login_token=${session.gp51_token}&user_id=${session.envio_user_id}`);
      
      if (!devicesResponse.ok) {
        const errorText = await devicesResponse.text();
        console.error('❌ GP51 API error:', errorText);
        await updateSyncStatus(supabase, syncId, 'failed', 0, 0, 1, `GP51 API error: ${errorText}`);
        return createErrorResponse('GP51 API error', errorText, devicesResponse.status);
      }

      const devicesData = await devicesResponse.json();
      
      if (!devicesData.success || !devicesData.devices) {
        console.error('❌ Invalid GP51 response:', devicesData);
        await updateSyncStatus(supabase, syncId, 'failed', 0, 0, 1, 'Invalid GP51 response');
        return createErrorResponse('Invalid GP51 response', 'No devices data returned', 400);
      }

      const devices = devicesData.devices;
      console.log(`📊 Processing ${devices.length} devices from GP51`);

      // Update total devices count
      await supabase
        .from('gp51_sync_status')
        .update({ total_devices: devices.length })
        .eq('id', syncId);

      let successfulSyncs = 0;
      let failedSyncs = 0;
      const errorLog = [];

      // Process each device
      for (const device of devices) {
        try {
          // Check if vehicle exists
          const { data: existingVehicle } = await supabase
            .from('vehicles')
            .select('id')
            .eq('gp51_device_id', device.device_id)
            .single();

          const vehicleData = {
            gp51_device_id: device.device_id,
            device_name: device.device_name || device.device_id,
            device_type: device.device_type,
            sim_number: device.sim_number,
            latitude: device.latitude,
            longitude: device.longitude,
            last_active_time: device.last_active_time ? new Date(device.last_active_time * 1000).toISOString() : null,
            expire_notify_time: device.expire_notify_time ? new Date(device.expire_notify_time * 1000).toISOString() : null,
            is_free: device.is_free === 1,
            allow_edit: device.allow_edit === 1,
            icon: device.icon,
            starred: device.starred === 1,
            login_name: device.login_name,
            gp51_group_id: device.group_id,
            total_distance: device.total_distance || 0,
            total_oil: device.total_oil || 0,
            altitude: device.altitude || 0,
            course: device.course || 0,
            device_time: device.device_time ? new Date(device.device_time * 1000).toISOString() : null,
            arrived_time: device.arrived_time ? new Date(device.arrived_time * 1000).toISOString() : null,
            valid_position_time: device.valid_position_time ? new Date(device.valid_position_time * 1000).toISOString() : null,
            gp51_status: device.status,
            gp51_status_text: device.status_text,
            gp51_alarm: device.alarm,
            last_sync_time: new Date().toISOString()
          };

          if (existingVehicle) {
            // Update existing vehicle
            const { error: updateError } = await supabase
              .from('vehicles')
              .update(vehicleData)
              .eq('id', existingVehicle.id);

            if (updateError) {
              console.error(`❌ Failed to update vehicle ${device.device_id}:`, updateError);
              failedSyncs++;
              errorLog.push(`Update failed for ${device.device_id}: ${updateError.message}`);
            } else {
              successfulSyncs++;
            }
          } else {
            // Create new vehicle (only if we have valid location data)
            if (device.latitude && device.longitude) {
              const newVehicleData = {
                ...vehicleData,
                vehicle_name: device.device_name || `Vehicle ${device.device_id}`,
                license_plate: `GP51-${device.device_id}`,
                user_id: session.envio_user_id
              };

              const { error: insertError } = await supabase
                .from('vehicles')
                .insert(newVehicleData);

              if (insertError) {
                console.error(`❌ Failed to create vehicle ${device.device_id}:`, insertError);
                failedSyncs++;
                errorLog.push(`Create failed for ${device.device_id}: ${insertError.message}`);
              } else {
                successfulSyncs++;
              }
            } else {
              console.warn(`⚠️ Skipping vehicle ${device.device_id} - no location data`);
              failedSyncs++;
              errorLog.push(`Skipped ${device.device_id}: No location data`);
            }
          }
        } catch (error) {
          console.error(`❌ Error processing device ${device.device_id}:`, error);
          failedSyncs++;
          errorLog.push(`Error processing ${device.device_id}: ${error.message}`);
        }
      }

      // Update final sync status
      await updateSyncStatus(
        supabase, 
        syncId, 
        'completed', 
        successfulSyncs, 
        failedSyncs, 
        0,
        null,
        {
          duration_ms: Date.now() - startTime,
          total_devices: devices.length,
          error_log: errorLog
        }
      );

      console.log(`✅ Sync completed: ${successfulSyncs} successful, ${failedSyncs} failed`);

      return new Response(JSON.stringify({
        success: true,
        message: 'Vehicle sync completed',
        stats: {
          total_devices: devices.length,
          successful_syncs: successfulSyncs,
          failed_syncs: failedSyncs,
          duration_ms: Date.now() - startTime
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('❌ Sync error:', error);
      await updateSyncStatus(supabase, syncId, 'failed', 0, 0, 1, error.message);
      return createErrorResponse('Sync failed', error.message, 500);
    }

  } catch (error) {
    console.error('❌ Critical sync error:', error);
    return createErrorResponse('Critical sync error', error.message, 500);
  }
});

async function updateSyncStatus(
  supabase: any,
  syncId: string,
  status: string,
  successfulSyncs: number,
  failedSyncs: number,
  errorCount: number,
  errorMessage?: string,
  additionalDetails?: any
) {
  const updateData: any = {
    status,
    successful_syncs: successfulSyncs,
    failed_syncs: failedSyncs,
    sync_details: {
      ...additionalDetails,
      completed_at: new Date().toISOString()
    }
  };

  if (status === 'completed' || status === 'failed') {
    updateData.completed_at = new Date().toISOString();
  }

  if (errorMessage) {
    updateData.error_log = [{ message: errorMessage, timestamp: new Date().toISOString() }];
  }

  await supabase
    .from('gp51_sync_status')
    .update(updateData)
    .eq('id', syncId);
}
