
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { jsonResponse, errorResponse } from "../_shared/response_utils.ts";
import { getValidGp51Session } from "../_shared/gp51_session_utils.ts";
import { fetchFromGP51 } from "../_shared/gp51_api_client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🚀 Starting GP51 live data fetch operation...");
    
    // Get valid GP51 session using shared utility
    const { session, errorResponse: sessionError } = await getValidGp51Session();
    
    if (sessionError) {
      console.error("❌ Session validation failed");
      return sessionError;
    }

    if (!session) {
      console.error("❌ No valid session available");
      return errorResponse("No valid GP51 session available", 401);
    }

    console.log(`✅ Found GP51 session for user: ${session.username}`);

    // Parse request body for force sync option
    const body = await req.json().catch(() => ({}));
    const forceFullSync = body.forceFullSync || false;
    
    console.log(`🔄 Starting ${forceFullSync ? 'full sync' : 'incremental sync'} with GP51...`);

    // Step 1: Get device list from querymonitorlist
    console.log(`📡 Making GP51 API request for querymonitorlist`);
    console.log(`📝 Request parameters: action=querymonitorlist, username=${session.username}`);

    const gp51Result = await fetchFromGP51({
      action: 'querymonitorlist',
      session: session,
      additionalParams: {
        username: session.username
      }
    });

    if (gp51Result.error) {
      console.error(`❌ GP51 API request failed: ${gp51Result.error}`);
      return errorResponse(
        `GP51 API request failed: ${gp51Result.error}`, 
        gp51Result.status || 500
      );
    }

    const gp51Data = gp51Result.data;
    console.log("📊 GP51 API response received:", {
      hasGroups: !!gp51Data.groups,
      groupCount: gp51Data.groups?.length || 0
    });

    // Extract devices and device IDs from response
    const devices = gp51Data.groups?.flatMap((group: any) => group.devices || []) || [];
    const deviceIds = devices.map((device: any) => device.deviceid).filter(Boolean);

    console.log(`📈 Device summary: ${devices.length} devices found, ${deviceIds.length} device IDs extracted`);

    // Step 2: Validate and refresh token before position data retrieval
    let allPositions: any[] = [];
    let tokenWasRefreshed = false;
    
    if (deviceIds.length > 0) {
      console.log(`🔍 Validating GP51 token before position data retrieval...`);
      
      // Check token expiration
      const now = new Date();
      const tokenExpiresAt = new Date(session.token_expires_at || 0);
      const timeUntilExpiry = tokenExpiresAt.getTime() - now.getTime();
      const minutesUntilExpiry = Math.round(timeUntilExpiry / (1000 * 60));
      
      console.log(`🔑 Token status: expires in ${minutesUntilExpiry} minutes (${tokenExpiresAt.toISOString()})`);
      console.log(`🔑 Current time: ${now.toISOString()}`);
      
      // If token expires in less than 5 minutes, try to refresh it
      if (timeUntilExpiry <= 5 * 60 * 1000) {
        console.log(`⚠️ Token expires soon (${minutesUntilExpiry} minutes), attempting refresh...`);
        tokenWasRefreshed = true;
        
        try {
          // Import the Enhanced GP51 Session Manager
          const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.50.0");
          const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
          );
          
          // Try to refresh the session via the gp51-service-management function
          const { data: refreshData, error: refreshError } = await supabase.functions.invoke('gp51-service-management', {
            body: { action: 'refresh_session' }
          });
          
          if (refreshError || !refreshData?.success) {
            console.error(`❌ Token refresh failed: ${refreshError?.message || refreshData?.error || 'Unknown error'}`);
            return errorResponse(
              `GP51 token expired and refresh failed: ${refreshError?.message || refreshData?.error || 'Unknown error'}`,
              401
            );
          }
          
          // Update the session with the new token
          session.gp51_token = refreshData.token;
          session.token_expires_at = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
          
          console.log(`✅ Token refreshed successfully, new expiry: ${session.token_expires_at}`);
          
        } catch (refreshException) {
          console.error(`❌ Exception during token refresh: ${refreshException}`);
          return errorResponse(
            `GP51 token expired and refresh failed: ${refreshException instanceof Error ? refreshException.message : 'Unknown error'}`,
            401
          );
        }
      } else {
        console.log(`✅ Token is valid for ${minutesUntilExpiry} minutes, proceeding with position retrieval`);
      }
      
      console.log(`🎯 Starting position data retrieval for ${deviceIds.length} devices...`);
      
      // Split device IDs into batches to avoid overwhelming the API
      const BATCH_SIZE = 50;
      const batches = [];
      for (let i = 0; i < deviceIds.length; i += BATCH_SIZE) {
        batches.push(deviceIds.slice(i, i + BATCH_SIZE));
      }
      
      console.log(`📦 Split devices into ${batches.length} batches of up to ${BATCH_SIZE} devices each`);
      
      // Process each batch
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        console.log(`🔄 Processing batch ${batchIndex + 1}/${batches.length} with ${batch.length} devices...`);
        console.log(`🔑 Using token: ${session.gp51_token.substring(0, 8)}... (expires: ${session.token_expires_at})`);
        
        try {
          const positionsResult = await fetchFromGP51({
            action: 'lastposition',
            session: session,
            additionalParams: {
              deviceids: batch,
              lastquerypositiontime: "" // Empty to get all latest positions
            }
          });
          
          if (positionsResult.error) {
            console.error(`❌ Error fetching positions for batch ${batchIndex + 1}:`, positionsResult.error);
            continue; // Continue with next batch
          }
          
          const positionsData = positionsResult.data;
          
          // Log raw response for debugging (first batch only to avoid spam)
          if (batchIndex === 0) {
            console.log('🔍 Raw GP51 LastPosition Response (first 2000 chars):', 
              JSON.stringify(positionsData, null, 2).substring(0, 2000));
          }
          
          // Extract positions from response
          const batchPositions = positionsData.records || [];
          allPositions.push(...batchPositions);
          
          console.log(`✅ Batch ${batchIndex + 1} completed: ${batchPositions.length} positions retrieved`);
          
          // Small delay between batches to be respectful to the API
          if (batchIndex < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
        } catch (batchError) {
          console.error(`❌ Exception processing batch ${batchIndex + 1}:`, batchError);
          continue; // Continue with next batch
        }
      }
      
      console.log(`🎉 Position data retrieval completed: ${allPositions.length} total positions collected`);
    } else {
      console.log("⚠️ No device IDs found, skipping position retrieval");
    }

    console.log(`📈 Final data summary: ${devices.length} devices, ${allPositions.length} positions`);

    // Determine sync type based on data volume and force flag
    const syncType = forceFullSync || devices.length > 100 ? 'fullSync' : 'batchedUpdate';
    
    const responseData = {
      type: syncType,
      devices: syncType === 'fullSync' ? devices : undefined,
      positions: allPositions,
      telemetry: allPositions, // Include positions as telemetry for compatibility
      statistics: {
        totalDevices: devices.length,
        totalPositions: allPositions.length,
        responseTime: Date.now()
      },
      metadata: {
        fetchedAt: new Date().toISOString(),
        source: 'gp51-api',
        syncType: syncType,
        sessionUsername: session.username,
        batchesProcessed: Math.ceil(deviceIds.length / 50),
        deviceBatches: deviceIds.length > 0 ? Math.ceil(deviceIds.length / 50) : 0,
        tokenRefreshed: tokenWasRefreshed
      }
    };

    console.log(`✅ Successfully processed ${syncType} - returning ${allPositions.length} positions`);

    return jsonResponse({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error("💥 Critical error in fetchLiveGp51Data:", error);
    return errorResponse(
      `Internal server error: ${error.message}`, 
      500, 
      error.stack
    );
  }
});
