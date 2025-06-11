
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GP51_API_URL = "https://www.gps51.com/webapi";
const REQUEST_TIMEOUT = 5000; // 5 seconds
const MAX_RETRIES = 2;

// MD5 hash function for password hashing
async function md5(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

interface LiveVehicleTelemetry {
  device_id: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  timestamp: string;
  status: string;
  odometer?: number;
  fuel_level?: number;
  engine_status?: string;
  altitude?: number;
  alarm_status?: string;
  signal_strength?: number;
}

async function callGP51WithRetry(
  formData: URLSearchParams, 
  attempt: number = 1
): Promise<{ success: boolean; response?: Response; error?: string; statusCode?: number }> {
  try {
    console.log(`GP51 API call attempt ${attempt}/${MAX_RETRIES + 1}`);
    console.log('Form data:', Object.fromEntries(formData.entries()));
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(GP51_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'EnvioFleet/1.0'
      },
      body: formData.toString(),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    console.log(`GP51 API response: status=${response.status}`);
    
    return { success: true, response, statusCode: response.status };
    
  } catch (error) {
    console.error(`GP51 API attempt ${attempt} failed:`, error);
    
    if (attempt <= MAX_RETRIES) {
      const delay = attempt * 1000; // Exponential backoff: 1s, 2s
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callGP51WithRetry(formData, attempt + 1);
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Network error',
      statusCode: 0
    };
  }
}

serve(async (req) => {
  console.log(`🚀 GP51 Live Data Fetch: ${req.method} ${req.url}`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the most recent valid GP51 session
    console.log('🔍 Fetching GP51 session from database...');
    const { data: sessions, error: sessionError } = await supabase
      .from('gp51_sessions')
      .select('username, gp51_password, token_expires_at, api_url')
      .order('token_expires_at', { ascending: false })
      .limit(1);

    if (sessionError) {
      console.error('❌ Database error fetching session:', sessionError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Database connection failed',
          details: sessionError.message
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!sessions || sessions.length === 0) {
      console.error('❌ No GP51 sessions found');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No GP51 sessions configured',
          details: 'Please configure GP51 credentials first'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const session = sessions[0];
    const expiresAt = new Date(session.token_expires_at);
    const now = new Date();

    if (expiresAt <= now) {
      console.error('❌ GP51 session expired:', { expiresAt, now });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'GP51 session expired',
          details: 'Session expired, please refresh credentials'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Valid session found, fetching live data from GP51...');

    // Hash the password for GP51 authentication
    const hashedPassword = await md5(session.gp51_password);

    // First, get the monitor list (devices/vehicles)
    console.log('📡 Fetching GP51 monitor list...');
    const monitorFormData = new URLSearchParams({
      action: 'querymonitorlist',
      username: session.username,
      password: hashedPassword,
      from: 'WEB',
      type: 'USER'
    });

    const monitorResult = await callGP51WithRetry(monitorFormData);

    if (!monitorResult.success) {
      console.error('All GP51 API attempts failed. Network unreachable.');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'GP51 API unreachable',
          details: monitorResult.error || 'Network connectivity issues',
          statusCode: monitorResult.statusCode || 0
        }),
        { 
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const response = monitorResult.response!;
    const responseText = await response.text();
    console.log('📊 Raw GP51 API response:', responseText.substring(0, 500) + '...');
    
    if (!response.ok) {
      console.error(`GP51 API HTTP error: ${response.status} ${response.statusText}`);
      
      if (response.status === 401 || response.status === 403) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'GP51 authentication failed',
            details: `HTTP ${response.status}: Invalid credentials`,
            statusCode: response.status
          }),
          { 
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'GP51 API error',
          details: `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status
        }),
        { 
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse GP51 response as JSON:', parseError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid response format',
          details: 'GP51 API returned invalid JSON',
          statusCode: response.status
        }),
        { 
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check GP51 response status
    if (responseData.status !== 0) {
      console.error('GP51 API returned error:', responseData);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'GP51 API logic error',
          details: responseData.cause || responseData.message || 'GP51 API request failed',
          statusCode: response.status
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Monitor data fetched successfully');

    // Extract devices from the response
    const devices = responseData.groups ? 
      responseData.groups.flatMap((group: any) => group.devices || []) : [];
    const deviceIds = devices.map((device: any) => device.deviceid || device.id).filter((id: string) => id);

    if (deviceIds.length === 0) {
      console.log('⚠️ No devices found in monitor list');
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: {
            users: devices,
            vehicles: [],
            telemetry: [],
            total_devices: 0,
            total_positions: 0,
            fetched_at: new Date().toISOString()
          },
          message: 'No devices found for position tracking'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Fetch last positions for all devices
    console.log(`📍 Fetching last positions for ${deviceIds.length} devices...`);
    const telemetryData: LiveVehicleTelemetry[] = [];

    // Get positions using proper GP51 format
    const positionFormData = new URLSearchParams({
      action: 'lastposition',
      username: session.username,
      password: hashedPassword,
      from: 'WEB',
      type: 'USER',
      deviceids: deviceIds.join(','),
      lastquerypositiontime: '0'
    });

    const positionResult = await callGP51WithRetry(positionFormData);

    if (positionResult.success && positionResult.response?.ok) {
      const positionText = await positionResult.response.text();
      console.log('📊 Raw GP51 position response:', positionText.substring(0, 500) + '...');
      
      try {
        const positionData = JSON.parse(positionText);
        
        if (positionData.status === 0 && positionData.records) {
          const positions = Array.isArray(positionData.records) ? positionData.records : [positionData.records];
          
          for (const pos of positions) {
            if (pos.callat !== undefined && pos.callon !== undefined) {
              telemetryData.push({
                device_id: pos.deviceid?.toString() || 'unknown',
                latitude: parseFloat(pos.callat) / 1000000, // GP51 uses micro-degrees
                longitude: parseFloat(pos.callon) / 1000000,
                speed: parseFloat(pos.speed) || 0,
                heading: parseFloat(pos.course) || 0,
                timestamp: new Date(pos.devicetime * 1000).toISOString(),
                status: pos.strstatus || 'unknown',
                odometer: pos.totaldistance ? parseFloat(pos.totaldistance) : undefined,
                altitude: pos.altitude ? parseFloat(pos.altitude) : undefined
              });
            }
          }
        }
      } catch (posParseError) {
        console.warn('⚠️ Position response parse failed:', posParseError);
      }
    } else {
      console.warn('⚠️ Position fetch failed:', positionResult.error);
    }

    // Update vehicles table with latest telemetry data and store history
    if (telemetryData.length > 0) {
      console.log(`💾 Updating ${telemetryData.length} vehicle records...`);
      
      for (const telem of telemetryData) {
        try {
          // Update main vehicles table
          const { data: vehicle, error: vehicleError } = await supabase
            .from('vehicles')
            .upsert({
              device_id: telem.device_id,
              latitude: telem.latitude,
              longitude: telem.longitude,
              speed: telem.speed,
              heading: telem.heading,
              last_update: telem.timestamp,
              status: telem.status,
              odometer: telem.odometer,
              altitude: telem.altitude,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'device_id'
            })
            .select('id')
            .single();

          if (vehicleError) {
            console.error(`❌ Failed to update vehicle ${telem.device_id}:`, vehicleError);
            continue;
          }

          // Store in telemetry history table
          await supabase
            .from('vehicle_telemetry_history')
            .insert({
              vehicle_id: vehicle.id,
              device_id: telem.device_id,
              timestamp: telem.timestamp,
              latitude: telem.latitude,
              longitude: telem.longitude,
              speed: telem.speed,
              heading: telem.heading,
              odometer: telem.odometer,
              altitude: telem.altitude
            });

        } catch (updateError) {
          console.error(`❌ Failed to process telemetry for ${telem.device_id}:`, updateError);
        }
      }
    }

    // Success response
    const responseData2 = {
      success: true,
      data: {
        devices,
        telemetry: telemetryData,
        total_devices: devices.length,
        total_positions: telemetryData.length,
        fetched_at: new Date().toISOString()
      }
    };

    console.log('✅ GP51 live data fetch completed successfully');
    
    return new Response(JSON.stringify(responseData2), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (err) {
    console.error("💥 Unexpected error in fetchLiveGp51Data:", err);
    return new Response(JSON.stringify({ 
      success: false,
      error: "Internal error", 
      details: err instanceof Error ? err.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
