
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GP51Session {
  gp51_token: string;
  username: string;
  envio_user_id: string;
}

interface FetchGP51Options {
  action: string;
  session: GP51Session;
  additionalParams?: Record<string, any>;
}

interface FetchGP51Response {
  data?: any;
  error?: string;
  status?: number;
  gp51_error?: any;
  raw?: string;
}

async function fetchFromGP51(
  options: FetchGP51Options,
  retryJsonParse: boolean = false
): Promise<FetchGP51Response> {
  const { action, session, additionalParams = {} } = options;

  if (!session.gp51_token) {
    console.error("❌ GP51 session is missing a token.");
    return { error: 'GP51 session is invalid (missing token)', status: 401 };
  }

  try {
    const apiUrl = Deno.env.get('GP51_API_BASE_URL') || 'https://www.gps51.com/webapi';
    const startTime = Date.now();
    
    // Always include basic authentication parameters in URL
    const urlParams = new URLSearchParams({
      action,
      token: session.gp51_token,
      username: session.username
    });

    let requestBody: any = {};
    
    // Special handling for lastposition action - move deviceids and lastquerypositiontime to body
    if (action === 'lastposition') {
      if (additionalParams.deviceids) {
        requestBody.deviceids = additionalParams.deviceids;
        console.log(`📋 Device IDs for lastposition: ${Array.isArray(additionalParams.deviceids) ? additionalParams.deviceids.length : 'not array'} devices`);
        if (Array.isArray(additionalParams.deviceids)) {
          console.log(`📋 First few device IDs: ${additionalParams.deviceids.slice(0, 3).join(', ')}${additionalParams.deviceids.length > 3 ? '...' : ''}`);
        }
      }
      if (additionalParams.lastquerypositiontime !== undefined) {
        requestBody.lastquerypositiontime = additionalParams.lastquerypositiontime;
      }
      console.log(`📡 Making GP51 API request: ${action}`);
      console.log(`🔗 URL: ${apiUrl}?${urlParams.toString()}`);
      console.log(`📦 Request body structure:`, {
        deviceids_count: Array.isArray(requestBody.deviceids) ? requestBody.deviceids.length : 'not array',
        lastquerypositiontime: requestBody.lastquerypositiontime,
        body_size_bytes: JSON.stringify(requestBody).length
      });
    } else {
      // For other actions, add additional params to URL as before
      Object.entries(additionalParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            urlParams.append(key, value.join(','));
          } else {
            urlParams.append(key, String(value));
          }
        }
      });
      console.log(`📡 Making GP51 API request: ${action}`);
      console.log(`🔗 URL: ${apiUrl}?${urlParams.toString()}`);
    }

    const requestHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'EnvioFleet/1.0'
    };

    console.log(`📤 Request headers:`, requestHeaders);
    console.log(`📤 Request method: POST`);
    console.log(`📤 Request body preview: ${JSON.stringify(requestBody).substring(0, 200)}${JSON.stringify(requestBody).length > 200 ? '...' : ''}`);

    const response = await fetch(`${apiUrl}?${urlParams.toString()}`, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(requestBody)
    });

    const requestDuration = Date.now() - startTime;
    console.log(`⏱️ Request completed in ${requestDuration}ms`);

    // Enhanced response logging
    console.log(`📊 Response status: ${response.status} ${response.statusText}`);
    console.log(`📊 Response ok: ${response.ok}`);
    
    // Log response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    console.log(`📊 Response headers:`, responseHeaders);

    // Read response as text first for debugging
    const responseText = await response.text();
    console.log(`📊 Response body length: ${responseText.length} characters`);
    console.log(`📊 Response body preview (first 500 chars): ${responseText.substring(0, 500)}${responseText.length > 500 ? '...' : ''}`);

    if (!response.ok) {
      console.error(`❌ HTTP error: ${response.status} ${response.statusText}`);
      console.error(`❌ Error response body: ${responseText}`);
      return { 
        error: `HTTP error: ${response.status} ${response.statusText}`, 
        status: response.status,
        raw: responseText.substring(0, 1000)
      };
    }

    // Handle empty response
    if (responseText.trim().length === 0) {
      console.error(`❌ Empty response body from GP51 API`);
      return { 
        error: 'Empty response from GP51 API', 
        status: 502,
        raw: 'EMPTY_RESPONSE'
      };
    }

    // Handle whitespace-only response
    if (responseText.trim() === '') {
      console.error(`❌ Whitespace-only response body from GP51 API`);
      return { 
        error: 'Whitespace-only response from GP51 API', 
        status: 502,
        raw: 'WHITESPACE_ONLY_RESPONSE'
      };
    }

    // Attempt JSON parsing with enhanced error handling
    let data;
    try {
      data = JSON.parse(responseText);
      console.log(`✅ JSON parsing successful`);
      console.log(`📋 Parsed response structure:`, {
        status: data.status,
        cause: data.cause,
        has_groups: !!data.groups,
        groups_count: data.groups ? data.groups.length : 0,
        has_positions: !!data.positions,
        positions_count: data.positions ? data.positions.length : 0,
        has_records: !!data.records,
        records_count: data.records ? data.records.length : 0,
        lastquerypositiontime: data.lastquerypositiontime
      });
    } catch (parseError) {
      console.error(`❌ JSON parse error: ${parseError.message}`);
      console.error(`❌ Response content type: ${responseHeaders['content-type'] || 'not specified'}`);
      console.error(`❌ Response body (first 1000 chars): ${responseText.substring(0, 1000)}`);
      
      if (retryJsonParse) {
        console.error('❌ Failed to parse JSON response after retry');
        return { 
          error: 'Invalid JSON response from GP51 API (retry failed)', 
          status: 502,
          raw: responseText.substring(0, 1000)
        };
      }
      
      console.warn('⚠️ JSON parse failed, attempting to clean response...');
      
      // Try to find JSON-like content in the response
      const jsonMatch = responseText.match(/\{.*\}/s);
      if (jsonMatch) {
        try {
          data = JSON.parse(jsonMatch[0]);
          console.log(`✅ JSON parsing successful after cleaning`);
        } catch (secondParseError) {
          console.error('❌ Failed to parse cleaned JSON:', secondParseError.message);
          return { 
            error: 'Invalid JSON response from GP51 API (cleaning failed)', 
            status: 502,
            raw: responseText.substring(0, 1000)
          };
        }
      } else {
        console.error('❌ No JSON-like content found in response');
        return { 
          error: 'No valid JSON content found in GP51 API response', 
          status: 502,
          raw: responseText.substring(0, 1000)
        };
      }
    }

    console.log(`✅ GP51 API call successful for action: ${action} (${requestDuration}ms)`);
    return { data, status: 200 };
    
  } catch (error) {
    console.error(`❌ GP51 API call failed for ${action}:`, error);
    
    const errorMessage = error instanceof Error ? error.message : `${action} failed`;
    
    if (error.name === 'AbortError') {
      return { error: 'Request timeout', status: 408 };
    }
    
    if (errorMessage.includes('HTTP error')) {
      const statusMatch = errorMessage.match(/HTTP error: (\d+)/);
      const status = statusMatch ? parseInt(statusMatch[1]) : 502;
      return { error: errorMessage, status };
    }
    
    return { 
      error: errorMessage, 
      status: 400,
      gp51_error: { cause: errorMessage }
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 GP51 Position Fetch:', req.method, req.url);
    
    const requestBody = req.body ? await req.json() : null;
    console.log('📋 Request body:', requestBody);

    const deviceIds = requestBody?.deviceIds;
    console.log('🔢 Device IDs:', deviceIds?.length ? `${deviceIds.length} devices` : 'none provided');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: gp51Sessions, error: sessionError } = await supabase
      .from('gp51_sessions')
      .select('gp51_token, username, envio_user_id')
      .order('created_at', { ascending: false })
      .limit(1);

    if (sessionError || !gp51Sessions?.length) {
      console.error('❌ No valid GP51 session found');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'GP51 session not found or expired' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const session = gp51Sessions[0];
    console.log(`✅ Using GP51 session for user: ${session.username}`);

    let allDeviceIds = deviceIds;

    if (!allDeviceIds?.length) {
      console.log('📡 No device IDs provided, fetching all devices first...');
      
      const deviceListResponse = await fetchFromGP51({
        action: 'querymonitorlist',
        session
      });

      if (!deviceListResponse.data || deviceListResponse.error) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: deviceListResponse.error || 'Failed to fetch device list' 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const groups = deviceListResponse.data.groups || [];
      console.log(`📋 Found ${groups.length} groups`);
      
      allDeviceIds = [];
      for (const group of groups) {
        if (group.devices && Array.isArray(group.devices)) {
          for (const device of group.devices) {
            if (device.deviceid) {
              allDeviceIds.push(device.deviceid);
            }
          }
        }
      }
      console.log(`📋 Extracted ${allDeviceIds.length} device IDs from groups`);
    }

    if (!allDeviceIds?.length) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No devices found to fetch positions for' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Test with smaller subset first for debugging if we have many devices
    let testDeviceIds = allDeviceIds;
    if (allDeviceIds.length > 10) {
      testDeviceIds = allDeviceIds.slice(0, 5);
      console.log(`🧪 Testing with first 5 devices out of ${allDeviceIds.length} total devices for debugging`);
    }

    console.log(`🎯 Fetching positions for ${testDeviceIds.length} devices`);

    const positionResponse = await fetchFromGP51({
      action: 'lastposition',
      session,
      additionalParams: {
        deviceids: testDeviceIds,
        lastquerypositiontime: 0
      }
    });

    if (positionResponse.error) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: positionResponse.error,
          details: positionResponse.gp51_error,
          raw_response: positionResponse.raw 
        }),
        { 
          status: positionResponse.status || 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const responseData = {
      success: true,
      data: {
        positions: positionResponse.data?.positions || positionResponse.data?.records || [],
        total_positions: (positionResponse.data?.positions || positionResponse.data?.records || []).length,
        total_devices: testDeviceIds.length,
        tested_subset: allDeviceIds.length > 10,
        all_devices_count: allDeviceIds.length,
        lastquerypositiontime: positionResponse.data?.lastquerypositiontime,
        fetched_at: new Date().toISOString()
      }
    };

    return new Response(
      JSON.stringify(responseData),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Fatal error in GP51 Position Fetch:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
