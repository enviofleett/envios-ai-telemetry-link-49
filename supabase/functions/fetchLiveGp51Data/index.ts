
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    console.log('🚀 Starting GP51 live data fetch operation...');

    // Get valid session first
    const { data: sessions, error: sessionError } = await supabase
      .from('gp51_sessions')
      .select('username, gp51_token, token_expires_at, api_url')
      .order('token_expires_at', { ascending: false })
      .limit(1);

    if (sessionError || !sessions || sessions.length === 0) {
      console.error('❌ No GP51 sessions found:', sessionError);
      return new Response(
        JSON.stringify({ error: 'No valid GP51 session found' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const session = sessions[0];
    
    // Check if token is still valid
    if (new Date(session.token_expires_at) < new Date()) {
      console.error('❌ GP51 session token expired');
      return new Response(
        JSON.stringify({ error: 'GP51 session expired' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Using GP51 session for user: ${session.username}`);
    console.log(`🔗 API URL: ${session.api_url}`);

    const { gp51_token: token, username, api_url: apiUrl } = session;

    // Use apiUrl directly without adding /webapi
    async function makeGP51ApiCall(action: string, additionalParams: Record<string, string> = {}) {
      const params = new URLSearchParams({
        action,
        token,
        ...additionalParams
      });
      
      // Use apiUrl directly without adding /webapi
      const url = `${apiUrl}?${params.toString()}`;
      
      console.log(`📤 [GP51Client] Making API call for action: ${action}`);
      console.log(`🔗 [GP51Client] URL: ${url.replace(token, 'TOKEN_HIDDEN')}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log(`📊 [GP51Client] Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [GP51Client] HTTP ${response.status}: ${errorText}`);
        throw new Error(`GP51 API request failed: ${response.status} ${errorText}`);
      }

      const responseText = await response.text();
      console.log(`📊 [GP51Client] Response received, length: ${responseText.length}`);

      if (!responseText || responseText.trim() === '') {
        console.error('❌ [GP51Client] Empty response received');
        throw new Error('Empty response from GP51 API');
      }

      try {
        const jsonResponse = JSON.parse(responseText);
        
        // Enhanced logging for debugging response structure
        console.log(`📊 [GP51Client] JSON Response structure for ${action}:`, JSON.stringify({
          hasGroups: Array.isArray(jsonResponse.groups),
          hasDatas: Array.isArray(jsonResponse.datas),
          hasRecords: Array.isArray(jsonResponse.records),
          topLevelKeys: Object.keys(jsonResponse),
          groupsCount: Array.isArray(jsonResponse.groups) ? jsonResponse.groups.length : 'N/A',
          datasCount: Array.isArray(jsonResponse.datas) ? jsonResponse.datas.length : 'N/A',
          recordsCount: Array.isArray(jsonResponse.records) ? jsonResponse.records.length : 'N/A',
          status: jsonResponse.status
        }));
        
        return jsonResponse;
      } catch (parseError) {
        console.error(`❌ [GP51Client] Failed to parse JSON response: ${parseError}`);
        console.error(`❌ [GP51Client] Response text: ${responseText.substring(0, 500)}...`);
        throw new Error(`Failed to parse GP51 response: ${parseError}`);
      }
    }

    // Enhanced position call function with detailed logging
    async function makeGP51PositionCall(deviceIds: string[], batchNumber: number, totalBatches: number) {
      // Use apiUrl directly without adding /webapi
      const url = `${apiUrl}?action=lastposition`;
      
      const requestBody = {
        deviceids: deviceIds,
        lastquerypositiontime: ""
      };

      console.log(`📍 Fetching positions for batch ${batchNumber}/${totalBatches} (${deviceIds.length} devices)`);
      console.log(`📤 [GP51Client] Request body contains ${deviceIds.length} device IDs`);
      console.log(`📋 [GP51Client] Sample device IDs:`, deviceIds.slice(0, 5));
      console.log(`📤 [GP51Client] Making POST call for positions to: ${url.replace(token, 'TOKEN_HIDDEN')}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log(`📊 [GP51Client] Position response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [GP51Client] Position HTTP ${response.status}: ${errorText}`);
        throw new Error(`GP51 position API request failed: ${response.status} ${errorText}`);
      }

      const responseText = await response.text();
      console.log(`📊 [GP51Client] Position response received, length: ${responseText.length}`);

      if (!responseText || responseText.trim() === '') {
        console.error('❌ [GP51Client] Empty position response received');
        throw new Error('Empty position response from GP51 API');
      }

      try {
        const jsonResponse = JSON.parse(responseText);
        
        // Detailed position response logging
        console.log(`📊 [GP51Client] Position JSON Response structure:`, JSON.stringify({
          status: jsonResponse.status,
          hasRecords: Array.isArray(jsonResponse.records),
          recordsCount: Array.isArray(jsonResponse.records) ? jsonResponse.records.length : 'N/A',
          topLevelKeys: Object.keys(jsonResponse),
          cause: jsonResponse.cause || 'N/A'
        }));

        // Log sample position data if available
        if (Array.isArray(jsonResponse.records) && jsonResponse.records.length > 0) {
          console.log(`📍 [GP51Client] Sample position record:`, JSON.stringify(jsonResponse.records[0], null, 2));
        }

        return jsonResponse;
      } catch (parseError) {
        console.error(`❌ [GP51Client] Failed to parse position JSON response: ${parseError}`);
        console.error(`❌ [GP51Client] Position response text: ${responseText.substring(0, 500)}...`);
        throw new Error(`Failed to parse GP51 position response: ${parseError}`);
      }
    }

    // Step 1: Fetch device list
    console.log('📱 Fetching device list from GP51...');
    const deviceListResponse = await makeGP51ApiCall('querymonitorlist');
    
    // Updated validation logic to handle the actual GP51 response structure
    let devices: any[] = [];
    
    if (deviceListResponse && Array.isArray(deviceListResponse.groups)) {
      // Extract devices from groups structure
      devices = deviceListResponse.groups.flatMap((group: any) => group.devices || []);
      console.log(`✅ Retrieved ${devices.length} devices from ${deviceListResponse.groups.length} groups`);
    } else if (deviceListResponse && Array.isArray(deviceListResponse.datas)) {
      // Fallback: Handle legacy datas structure if it exists
      devices = deviceListResponse.datas;
      console.log(`✅ Retrieved ${devices.length} devices from legacy datas structure`);
    } else {
      console.error('❌ Invalid device list response structure - no groups or datas array found');
      console.error('❌ Response structure:', JSON.stringify(deviceListResponse, null, 2).substring(0, 1000));
      throw new Error('Invalid device list response from GP51 - expected groups or datas array');
    }

    if (devices.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No devices found in GP51 account'
      }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Extract device IDs and log sample for debugging
    const deviceIds = devices.map(device => device.deviceid).filter(id => id);
    console.log(`📋 Extracted ${deviceIds.length} device IDs`);
    console.log(`📋 Sample device IDs:`, deviceIds.slice(0, 10));
    console.log(`📋 Device ID format analysis:`, {
      allNumeric: deviceIds.every(id => /^\d+$/.test(id)),
      allAlphanumeric: deviceIds.every(id => /^[a-zA-Z0-9]+$/.test(id)),
      sampleLengths: deviceIds.slice(0, 5).map(id => id.length),
      uniqueCount: new Set(deviceIds).size
    });

    // Step 2: Fetch positions in controlled batches
    const BATCH_SIZE = 200; // Reduced batch size for better debugging
    const MAX_CONCURRENT_BATCHES = 3;
    const batches = [];
    
    for (let i = 0; i < deviceIds.length; i += BATCH_SIZE) {
      batches.push(deviceIds.slice(i, i + BATCH_SIZE));
    }

    console.log(`📦 Created ${batches.length} batches for position fetching`);
    
    let totalPositions = 0;
    let successfulBatches = 0;
    let failedBatches = 0;

    // Process batches in groups for rate limiting
    for (let i = 0; i < batches.length; i += MAX_CONCURRENT_BATCHES) {
      const batchGroup = batches.slice(i, i + MAX_CONCURRENT_BATCHES);
      console.log(`🔄 Processing batch group ${Math.floor(i / MAX_CONCURRENT_BATCHES) + 1}/${Math.ceil(batches.length / MAX_CONCURRENT_BATCHES)}`);
      
      const batchPromises = batchGroup.map(async (batch, batchIndex) => {
        const globalBatchNumber = i + batchIndex + 1;
        try {
          const positionResponse = await makeGP51PositionCall(batch, globalBatchNumber, batches.length);
          
          // Enhanced position validation and logging
          let positionCount = 0;
          if (positionResponse && Array.isArray(positionResponse.records)) {
            positionCount = positionResponse.records.length;
            if (positionCount > 0) {
              console.log(`✅ Batch ${globalBatchNumber} returned ${positionCount} position records`);
              successfulBatches++;
              totalPositions += positionCount;
              
              // Log sample position data for analysis
              const samplePosition = positionResponse.records[0];
              console.log(`📍 Sample position data structure:`, {
                deviceid: samplePosition.deviceid,
                hasLatLon: !!(samplePosition.callat && samplePosition.callon),
                hasSpeed: samplePosition.speed !== undefined,
                hasUpdateTime: !!samplePosition.updatetime,
                allKeys: Object.keys(samplePosition)
              });
            } else {
              console.error(`⚠️ Batch ${globalBatchNumber} returned no position data`);
              failedBatches++;
            }
          } else {
            console.error(`⚠️ Batch ${globalBatchNumber} - invalid position response structure`);
            console.error(`❌ Position response details:`, {
              hasRecords: Array.isArray(positionResponse?.records),
              status: positionResponse?.status,
              cause: positionResponse?.cause
            });
            failedBatches++;
          }
          
          return { batchNumber: globalBatchNumber, positions: positionResponse?.records || [], success: positionCount > 0 };
        } catch (error) {
          console.error(`❌ Batch ${globalBatchNumber} failed:`, error);
          failedBatches++;
          return { batchNumber: globalBatchNumber, positions: [], success: false, error: error.message };
        }
      });

      try {
        await Promise.all(batchPromises);
      } catch (error) {
        console.error(`❌ Batch group ${Math.floor(i / MAX_CONCURRENT_BATCHES) + 1} failed:`, error);
      }

      // Rate limiting between batch groups
      if (i + MAX_CONCURRENT_BATCHES < batches.length) {
        console.log(`⏳ Waiting 2000ms before next batch group...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`✅ Position fetching completed: ${totalPositions} total positions retrieved`);
    console.log(`📊 Batch summary: ${successfulBatches} successful, ${failedBatches} failed out of ${batches.length} total`);

    // Return comprehensive results
    return new Response(JSON.stringify({
      success: true,
      data: {
        deviceCount: devices.length,
        positionCount: totalPositions,
        batchSummary: {
          totalBatches: batches.length,
          successfulBatches,
          failedBatches,
          batchSize: BATCH_SIZE
        },
        devices: devices.slice(0, 10), // Sample devices for debugging
        debugInfo: {
          deviceIdFormat: deviceIds.slice(0, 5),
          uniqueDeviceIds: new Set(deviceIds).size,
          apiUrl: apiUrl.replace(token, 'TOKEN_HIDDEN')
        }
      }
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('❌ GP51 live data fetch failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
