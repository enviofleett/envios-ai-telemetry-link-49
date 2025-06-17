
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
      }
      if (additionalParams.lastquerypositiontime !== undefined) {
        requestBody.lastquerypositiontime = additionalParams.lastquerypositiontime;
      }
      console.log(`📡 Making GP51 API request: ${action}`);
      console.log(`🔗 URL: ${apiUrl}?${urlParams.toString()}`);
      console.log(`📦 Request body:`, JSON.stringify(requestBody));
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

    const response = await fetch(`${apiUrl}?${urlParams.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'EnvioFleet/1.0'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }

    const responseText = await response.text();
    console.log(`📊 GP51 API response received, length: ${responseText.length}`);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      if (retryJsonParse) {
        console.error('❌ Failed to parse JSON response after retry:', parseError);
        return { 
          error: 'Invalid JSON response from GP51 API', 
          status: 502,
          raw: responseText.substring(0, 1000)
        };
      }
      
      console.warn('⚠️ JSON parse failed, retrying with cleaned response...');
      const cleanedText = responseText.replace(/^\s*\{.*?\}\s*/, '').trim();
      
      try {
        data = JSON.parse(cleanedText);
      } catch (secondParseError) {
        console.error('❌ Failed to parse cleaned JSON:', secondParseError);
        return { 
          error: 'Invalid JSON response from GP51 API', 
          status: 502,
          raw: responseText.substring(0, 1000)
        };
      }
    }

    console.log(`✅ GP51 API call successful for action: ${action}`);
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
      console.log(`📋 Found ${allDeviceIds?.length || 0} devices across ${groups.length} groups`);
      
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

    console.log(`🎯 Fetching positions for all ${allDeviceIds.length} devices`);

    const positionResponse = await fetchFromGP51({
      action: 'lastposition',
      session,
      additionalParams: {
        deviceids: allDeviceIds,
        lastquerypositiontime: 0
      }
    });

    if (positionResponse.error) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: positionResponse.error,
          details: positionResponse.gp51_error 
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
        positions: positionResponse.data?.positions || [],
        total_positions: positionResponse.data?.positions?.length || 0,
        total_devices: allDeviceIds.length,
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
