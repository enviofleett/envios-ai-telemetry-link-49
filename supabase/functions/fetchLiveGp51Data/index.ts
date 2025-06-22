
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getValidGp51Session } from "../_shared/gp51_session_utils.ts";
import { GP51UnifiedClient } from "../_shared/gp51_unified_client.ts";
import { createSuccessResponse, createErrorResponse, calculateLatency } from "../_shared/response_utils.ts";
import { getSupabaseClient } from "../_shared/supabase_client.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    console.log('🚀 [fetchLiveGp51Data] Starting GP51 live data fetch...');

    // Get valid GP51 session
    const { session, errorResponse } = await getValidGp51Session();
    if (errorResponse) {
      return errorResponse;
    }

    if (!session) {
      return createErrorResponse(
        'No valid GP51 session found',
        'Please configure GP51 credentials',
        401,
        calculateLatency(startTime)
      );
    }

    console.log(`🔑 Using token: ${session.gp51_token.substring(0, 8)}... (expires: ${session.token_expires_at})`);
    console.log(`👤 Associated with user: ${session.envio_user_id}`);

    // Get all devices from GP51
    const client = new GP51UnifiedClient();
    console.log('📱 Fetching all devices from GP51...');
    
    const devicesResponse = await client.getAllDevices(session.gp51_token);
    if (!devicesResponse.success || !devicesResponse.data) {
      console.error('❌ Failed to fetch devices from GP51:', devicesResponse.error);
      return createErrorResponse(
        'Failed to fetch devices from GP51',
        devicesResponse.error || 'Unknown error',
        500,
        calculateLatency(startTime)
      );
    }

    const devices = devicesResponse.data;
    console.log(`📊 Found ${devices.length} devices in GP51`);

    if (devices.length === 0) {
      console.log('ℹ️ No devices found in GP51 account');
      return createSuccessResponse({
        message: 'No devices found in GP51 account',
        total_devices: 0,
        total_positions: 0,
        devices_processed: 0,
        batches_processed: 0
      }, calculateLatency(startTime));
    }

    // Process devices in batches
    const BATCH_SIZE = 50;
    const deviceIds = devices.map(d => d.deviceid);
    const batches = [];
    
    for (let i = 0; i < deviceIds.length; i += BATCH_SIZE) {
      batches.push(deviceIds.slice(i, i + BATCH_SIZE));
    }

    console.log(`🔄 Processing ${devices.length} devices in ${batches.length} batches of max ${BATCH_SIZE}`);

    let allPositions: any[] = [];
    let batchIndex = 0;

    for (const batch of batches) {
      batchIndex++;
      console.log(`🔄 Processing batch ${batchIndex}/${batches.length} with ${batch.length} devices...`);
      
      try {
        const positionsResponse = await client.getLastPosition(batch, session.gp51_token);
        
        if (positionsResponse.success && positionsResponse.data) {
          const batchPositions = Array.isArray(positionsResponse.data) ? positionsResponse.data : [positionsResponse.data];
          allPositions = allPositions.concat(batchPositions);
          console.log(`✅ Batch ${batchIndex} completed: ${batchPositions.length} positions retrieved`);
        } else {
          console.warn(`⚠️ Batch ${batchIndex} failed: ${positionsResponse.error}`);
        }

        // Add delay between batches to avoid overwhelming the GP51 API
        if (batchIndex < batches.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`❌ Error processing batch ${batchIndex}:`, error);
      }
    }

    console.log(`📊 Total positions collected: ${allPositions.length}`);

    // Process and persist the vehicle position data
    if (allPositions.length > 0) {
      console.log('🔧 Processing positions for persistence...');
      
      const supabase = getSupabaseClient();
      const vehicleData = allPositions.map(position => ({
        gp51_device_id: position.deviceid,
        name: position.deviceid, // Use device ID as name, can be updated later
        user_id: session.envio_user_id, // Use the user ID from the GP51 session
        last_position: {
          lat: position.callat,
          lon: position.callon,
          speed: position.speed,
          course: position.course,
          timestamp: position.updatetime,
          status_text: position.strstatusen || position.strstatus
        },
        updated_at: new Date().toISOString()
      }));

      console.log(`🔧 Prepared ${vehicleData.length} vehicle records for upsert`);

      // Batch upsert vehicles
      const { data: upsertedVehicles, error: upsertError } = await supabase
        .from('vehicles')
        .upsert(vehicleData, { 
          onConflict: 'gp51_device_id',
          ignoreDuplicates: false 
        });

      if (upsertError) {
        console.error('❌ Error upserting vehicles:', upsertError);
        return createErrorResponse(
          'Failed to save vehicle data',
          upsertError.message,
          500,
          calculateLatency(startTime)
        );
      }

      console.log(`✅ Successfully upserted ${vehicleData.length} vehicles`);
    }

    const responseData = {
      message: 'GP51 live data fetch completed successfully',
      total_devices: devices.length,
      total_positions: allPositions.length,
      devices_processed: devices.length,
      batches_processed: batches.length,
      user_id: session.envio_user_id // Include user ID in response for confirmation
    };

    console.log('🏁 GP51 live data fetch completed successfully');

    return createSuccessResponse(responseData, calculateLatency(startTime));

  } catch (error) {
    console.error('❌ Unexpected error in fetchLiveGp51Data:', error);
    return createErrorResponse(
      'Internal server error during GP51 data fetch',
      error instanceof Error ? error.message : 'Unknown error',
      500,
      calculateLatency(startTime)
    );
  }
});
