
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    
    const { data: session, error: sessionError } = await supabase
      .from('gp51_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (sessionError || !session) {
      console.error('❌ No GP51 session found:', sessionError);
      return new Response(JSON.stringify({
        success: false,
        error: 'No active GP51 session found'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`✅ Using GP51 session for user: ${session.username}`);
    console.log(`🔑 Token expires at: ${session.token_expires_at}`);

    // Check if token is expired
    if (new Date(session.token_expires_at) <= new Date()) {
      console.error('❌ GP51 token has expired');
      return new Response(JSON.stringify({
        success: false,
        error: 'GP51 token has expired'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { gp51_token: token, username, api_url: apiUrl } = session;

    // Fixed URL construction - remove redundant /webapi
    async function makeGP51ApiCall(action: string, additionalParams: Record<string, string> = {}) {
      const params = new URLSearchParams({
        action,
        token,
        username,
        ...additionalParams
      });
      
      // Fix: Use apiUrl directly without adding /webapi
      const url = `${apiUrl}?${params.toString()}`;
      
      console.log(`📤 [GP51Client] Making API call for action: ${action}`);
      console.log(`📤 [GP51Client] URL: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log(`📊 [GP51Client] Response status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`❌ [GP51Client] HTTP error: ${response.status}`);
        const responseText = await response.text();
        console.error(`❌ [GP51Client] Response body: ${responseText.substring(0, 500)}...`);
        throw new Error(`HTTP error: ${response.status}`);
      }

      const responseText = await response.text();
      console.log(`📊 [GP51Client] Response received, length: ${responseText.length}`);
      
      // Check if response is HTML (error page)
      if (responseText.trim().startsWith('<')) {
        console.error(`❌ [GP51Client] Received HTML instead of JSON: ${responseText.substring(0, 200)}...`);
        throw new Error('Received HTML error page instead of JSON response');
      }

      try {
        return JSON.parse(responseText);
      } catch (parseError) {
        console.error(`❌ [GP51Client] Failed to parse JSON response: ${parseError}`);
        console.error(`❌ [GP51Client] Response text: ${responseText.substring(0, 500)}...`);
        throw new Error('Invalid JSON response from GP51 API');
      }
    }

    // Fixed position call function with proper POST body
    async function makeGP51PositionCall(deviceIds: string[]) {
      // Fix: Use apiUrl directly without adding /webapi
      const url = `${apiUrl}?action=lastposition`;
      
      const requestBody = {
        deviceids: deviceIds,
        token,
        username,
        lastquerypositiontime: 0
      };

      console.log(`📤 [GP51Client] Making POST call for positions to: ${url}`);
      console.log(`📤 [GP51Client] Request body contains ${deviceIds.length} device IDs`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log(`📊 [GP51Client] Position response status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`❌ [GP51Client] Position HTTP error: ${response.status}`);
        const responseText = await response.text();
        console.error(`❌ [GP51Client] Position response body: ${responseText.substring(0, 500)}...`);
        throw new Error(`Position HTTP error: ${response.status}`);
      }

      const responseText = await response.text();
      console.log(`📊 [GP51Client] Position response received, length: ${responseText.length}`);
      
      // Check if response is HTML (error page)
      if (responseText.trim().startsWith('<')) {
        console.error(`❌ [GP51Client] Position call received HTML instead of JSON: ${responseText.substring(0, 200)}...`);
        throw new Error('Position call received HTML error page instead of JSON response');
      }

      try {
        return JSON.parse(responseText);
      } catch (parseError) {
        console.error(`❌ [GP51Client] Failed to parse position JSON response: ${parseError}`);
        console.error(`❌ [GP51Client] Position response text: ${responseText.substring(0, 500)}...`);
        throw new Error('Invalid JSON response from GP51 position API');
      }
    }

    console.log('📱 Fetching device list from GP51...');
    const deviceListResponse = await makeGP51ApiCall('querymonitorlist');
    
    if (!deviceListResponse || !Array.isArray(deviceListResponse.datas)) {
      console.error('❌ Invalid device list response structure');
      throw new Error('Invalid device list response from GP51');
    }

    const devices = deviceListResponse.datas;
    console.log(`✅ Retrieved ${devices.length} devices from GP51`);

    if (devices.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        data: {
          total_devices: 0,
          total_positions: 0,
          devices: [],
          positions: []
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extract device IDs for position queries
    const deviceIds = devices.map((device: any) => device.deviceid).filter(Boolean);
    console.log(`📍 Fetching positions for ${deviceIds.length} devices...`);

    // Batch position requests to avoid overwhelming the API
    const BATCH_SIZE = 200;
    const MAX_CONCURRENT_BATCHES = 3;
    const BATCH_DELAY_MS = 2000;

    const allPositions: any[] = [];
    const batches: string[][] = [];
    
    // Split device IDs into batches
    for (let i = 0; i < deviceIds.length; i += BATCH_SIZE) {
      batches.push(deviceIds.slice(i, i + BATCH_SIZE));
    }

    console.log(`📦 Processing ${batches.length} batches of devices (${BATCH_SIZE} devices per batch)`);

    // Process batches with controlled concurrency
    for (let i = 0; i < batches.length; i += MAX_CONCURRENT_BATCHES) {
      const currentBatches = batches.slice(i, i + MAX_CONCURRENT_BATCHES);
      
      console.log(`🔄 Processing batch group ${Math.floor(i / MAX_CONCURRENT_BATCHES) + 1}/${Math.ceil(batches.length / MAX_CONCURRENT_BATCHES)}`);
      
      const batchPromises = currentBatches.map(async (batch, batchIndex) => {
        try {
          const batchNumber = i + batchIndex + 1;
          console.log(`📍 Fetching positions for batch ${batchNumber}/${batches.length} (${batch.length} devices)`);
          
          const positionResponse = await makeGP51PositionCall(batch);
          
          if (positionResponse && Array.isArray(positionResponse.datas)) {
            console.log(`✅ Batch ${batchNumber} completed: ${positionResponse.datas.length} positions retrieved`);
            return positionResponse.datas;
          } else {
            console.warn(`⚠️ Batch ${batchNumber} returned no position data`);
            return [];
          }
        } catch (error) {
          console.error(`❌ Batch ${i + batchIndex + 1} failed:`, error);
          return []; // Return empty array for failed batch
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      // Flatten and add to all positions
      batchResults.forEach(result => {
        if (Array.isArray(result)) {
          allPositions.push(...result);
        }
      });

      // Add delay between batch groups to be respectful to the API
      if (i + MAX_CONCURRENT_BATCHES < batches.length) {
        console.log(`⏳ Waiting ${BATCH_DELAY_MS}ms before next batch group...`);
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    console.log(`✅ Position fetching completed: ${allPositions.length} total positions retrieved`);

    const result = {
      total_devices: devices.length,
      total_positions: allPositions.length,
      devices,
      positions: allPositions
    };

    return new Response(JSON.stringify({
      success: true,
      data: result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ [fetchLiveGp51Data] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
