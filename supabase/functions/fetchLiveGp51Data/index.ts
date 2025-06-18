
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GP51Session {
  id: string;
  username: string;
  gp51_token: string;
  token_expires_at: string;
  api_url: string;
}

interface GP51Device {
  deviceid: string;
  devicename: string;
  devicetype: number;
  simnum?: string;
  createtime: number;
  creater: string;
  lastactivetime?: number;
  isfree?: number;
}

interface GP51Position {
  deviceid: string;
  callat: number;
  callon: number;
  speed: number;
  course: number;
  updatetime: number;
  strstatusen?: string;
}

serve(async (req) => {
  console.log(`🚀 [fetchLiveGp51Data] Request received: ${req.method} ${req.url}`);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔍 Fetching latest GP51 session from database...');

    // Get the most recent valid GP51 session
    const { data: session, error: sessionError } = await supabase
      .from('gp51_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (sessionError || !session) {
      console.error('❌ No valid GP51 session found:', sessionError);
      return new Response(JSON.stringify({
        success: false,
        error: 'No valid GP51 session found'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate token expiry
    const expiresAt = new Date(session.token_expires_at);
    const now = new Date();
    if (expiresAt <= now) {
      console.error('❌ GP51 session token has expired');
      return new Response(JSON.stringify({
        success: false,
        error: 'GP51 session token has expired'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const apiUrl = session.api_url || 'https://www.gps51.com';
    console.log(`✅ Using GP51 session for user: ${session.username}`);
    console.log(`🔑 Token expires at: ${session.token_expires_at}`);

    // Make API call to get device list
    console.log('📱 Fetching device list from GP51...');
    const deviceListResponse = await makeGP51ApiCall(apiUrl, 'querymonitorlist', session.gp51_token, session.username);
    
    if (!deviceListResponse.success) {
      throw new Error(`Failed to fetch device list: ${deviceListResponse.error}`);
    }

    const deviceData = deviceListResponse.data;
    if (!deviceData.groups || !Array.isArray(deviceData.groups) || deviceData.groups.length === 0) {
      console.warn('⚠️ No device groups found in GP51 response');
      return new Response(JSON.stringify({
        success: true,
        data: {
          type: 'fullSync',
          devices: [],
          positions: [],
          statistics: {
            totalDevices: 0,
            totalPositions: 0,
            responseTime: Date.now()
          },
          metadata: {
            fetchedAt: new Date().toISOString(),
            source: 'GP51',
            syncType: 'fullSync'
          }
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extract devices from the first group
    const devices: GP51Device[] = deviceData.groups[0].devices || [];
    console.log(`📱 Found ${devices.length} devices in GP51`);

    // Get device IDs for position fetching
    const deviceIds = devices.map(device => device.deviceid);
    
    // Fetch positions using specialized batching function
    console.log('📍 Fetching positions with batching...');
    const positions = await fetchPositionsWithBatching(apiUrl, session.gp51_token, session.username, deviceIds);
    
    console.log(`📍 Successfully fetched ${positions.length} position records`);

    // Transform devices for our system
    const transformedDevices = devices.map(device => ({
      gp51_device_id: device.deviceid,
      name: device.devicename || device.deviceid,
      sim_number: device.simnum || null,
      last_position: null // Will be populated from positions
    }));

    return new Response(JSON.stringify({
      success: true,
      data: {
        type: 'fullSync',
        devices: transformedDevices,
        positions: positions,
        statistics: {
          totalDevices: devices.length,
          totalPositions: positions.length,
          responseTime: Date.now()
        },
        metadata: {
          fetchedAt: new Date().toISOString(),
          source: 'GP51',
          syncType: 'fullSync'
        }
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ [fetchLiveGp51Data] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

/**
 * Makes a generic GP51 API call (for device list, etc.)
 */
async function makeGP51ApiCall(apiUrl: string, action: string, token: string, username: string): Promise<{ success: boolean; data?: any; error?: string }> {
  console.log(`📡 [GP51Client] Making API call for action: ${action}`);
  
  // Try Format 2: Token as URL parameter (this worked for querymonitorlist)
  const urlWithToken = `${apiUrl}/webapi?action=${action}&token=${encodeURIComponent(token)}&username=${encodeURIComponent(username)}`;
  
  try {
    console.log(`📤 [GP51Client] URL: ${urlWithToken}`);
    
    const response = await fetch(urlWithToken, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'EnvioFleet/1.0'
      },
      body: JSON.stringify({})
    });

    console.log(`📊 [GP51Client] Response status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const responseText = await response.text();
    console.log(`📊 [GP51Client] Response length: ${responseText.length}`);

    // Check if response is HTML (error page)
    if (responseText.trim().startsWith('<!doctype') || responseText.trim().startsWith('<html')) {
      console.error('❌ [GP51Client] Received HTML instead of JSON');
      return { success: false, error: 'Received HTML error page from GP51' };
    }

    // Parse JSON response
    const jsonResponse = JSON.parse(responseText);
    
    if (jsonResponse.status === 0) {
      console.log('✅ [GP51Client] API call successful');
      return { success: true, data: jsonResponse };
    } else {
      console.error(`❌ [GP51Client] API error: ${jsonResponse.cause}`);
      return { success: false, error: jsonResponse.cause || 'Unknown GP51 API error' };
    }

  } catch (error: any) {
    console.error(`❌ [GP51Client] Exception during API call: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Specialized function for fetching positions with batching to avoid 414 errors
 */
async function fetchPositionsWithBatching(apiUrl: string, token: string, username: string, deviceIds: string[]): Promise<GP51Position[]> {
  const BATCH_SIZE = 200; // Reduced batch size to avoid URL length issues
  const MAX_CONCURRENT_BATCHES = 3;
  const allPositions: GP51Position[] = [];
  
  console.log(`📍 Starting position fetch for ${deviceIds.length} devices in batches of ${BATCH_SIZE}`);
  
  // Split device IDs into batches
  const batches: string[][] = [];
  for (let i = 0; i < deviceIds.length; i += BATCH_SIZE) {
    batches.push(deviceIds.slice(i, i + BATCH_SIZE));
  }
  
  console.log(`📍 Created ${batches.length} batches for position fetching`);
  
  // Process batches with controlled concurrency
  for (let i = 0; i < batches.length; i += MAX_CONCURRENT_BATCHES) {
    const batchGroup = batches.slice(i, i + MAX_CONCURRENT_BATCHES);
    const batchPromises = batchGroup.map((batch, index) => 
      makeGP51PositionCall(apiUrl, token, username, batch, i + index + 1)
    );
    
    try {
      const batchResults = await Promise.allSettled(batchPromises);
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled' && result.value.success) {
          allPositions.push(...result.value.positions);
        } else if (result.status === 'rejected') {
          console.error('❌ Batch failed:', result.reason);
        } else {
          console.error('❌ Batch returned error:', result.value.error);
        }
      }
      
      // Add delay between batch groups to avoid overwhelming the API
      if (i + MAX_CONCURRENT_BATCHES < batches.length) {
        console.log('⏱️ Waiting 2 seconds before next batch group...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
    } catch (error) {
      console.error(`❌ Batch group ${Math.floor(i / MAX_CONCURRENT_BATCHES) + 1} failed:`, error);
    }
  }
  
  console.log(`✅ Position fetching completed. Retrieved ${allPositions.length} positions`);
  return allPositions;
}

/**
 * Makes a specialized GP51 position API call using POST with deviceids in body
 */
async function makeGP51PositionCall(apiUrl: string, token: string, username: string, deviceIds: string[], batchNumber: number): Promise<{ success: boolean; positions: GP51Position[]; error?: string }> {
  console.log(`📍 [GP51Client] Making position call for batch ${batchNumber} with ${deviceIds.length} devices`);
  
  const positionUrl = `${apiUrl}/webapi?action=lastposition`;
  
  // Construct request body with deviceids array - this avoids 414 URL length errors
  const requestBody = {
    deviceids: deviceIds,
    token: token,
    username: username,
    lastquerypositiontime: ""
  };
  
  try {
    console.log(`📤 [GP51Client] POST to: ${positionUrl}`);
    console.log(`📤 [GP51Client] Body preview: deviceids array with ${deviceIds.length} devices`);
    
    const response = await fetch(positionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'EnvioFleet/1.0'
      },
      body: JSON.stringify(requestBody)
    });

    console.log(`📊 [GP51Client] Batch ${batchNumber} response status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const responseText = await response.text();
    console.log(`📊 [GP51Client] Batch ${batchNumber} response length: ${responseText.length}`);

    // Check if response is HTML (error page)
    if (responseText.trim().startsWith('<!doctype') || responseText.trim().startsWith('<html')) {
      console.error(`❌ [GP51Client] Batch ${batchNumber} received HTML instead of JSON`);
      return { success: false, positions: [], error: 'Received HTML error page from GP51' };
    }

    // Parse JSON response
    const jsonResponse = JSON.parse(responseText);
    
    if (jsonResponse.status === 0) {
      const positions = jsonResponse.records || [];
      console.log(`✅ [GP51Client] Batch ${batchNumber} successful: ${positions.length} positions`);
      return { success: true, positions };
    } else {
      console.error(`❌ [GP51Client] Batch ${batchNumber} API error: ${jsonResponse.cause}`);
      return { success: false, positions: [], error: jsonResponse.cause || 'Unknown GP51 API error' };
    }

  } catch (error: any) {
    console.error(`❌ [GP51Client] Batch ${batchNumber} exception: ${error.message}`);
    return { success: false, positions: [], error: error.message };
  }
}
