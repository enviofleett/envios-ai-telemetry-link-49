
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GP51_API_URL = "https://api.gpstrackerxy.com/api";

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
      .select('username, gp51_token, token_expires_at, api_url')
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

    // Use proper GP51 API format with POST and form data
    const suser = session.username;
    const stoken = session.gp51_token;

    console.log('📡 Calling GP51 querymonitorlist API with proper format...');
    
    const fetchFromGP51 = async (action: string, additionalParams: Record<string, string> = {}, retry = false) => {
      const formData = new URLSearchParams({
        action,
        json: "1",
        suser,
        stoken,
        ...additionalParams
      });

      try {
        const response = await fetch(GP51_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'User-Agent': 'EnvioFleet/1.0'
          },
          body: formData.toString()
        });

        if (!response.ok) {
          console.error('❌ GP51 API HTTP error:', response.status, response.statusText);
          return { error: `HTTP ${response.status}: ${response.statusText}`, status: response.status };
        }

        const text = await response.text();
        console.log('📊 Raw GP51 API response:', text.substring(0, 500) + '...');

        try {
          const json = JSON.parse(text);

          if (json.result === "false" || json.result === false) {
            console.error('🛑 GP51 API returned false:', json.message);
            return { error: json.message || 'GP51 API request failed', status: 401 };
          }

          return { data: json, status: 200 };
        } catch (parseError) {
          if (!retry) {
            console.warn('🔁 Retry after JSON parse failure:', text.substring(0, 200));
            return await fetchFromGP51(action, additionalParams, true);
          }

          console.error('❌ GP51 returned invalid JSON:', text.substring(0, 200));
          return { error: 'Invalid GP51 response format', raw: text, status: 502 };
        }
      } catch (fetchError) {
        console.error('❌ Network error calling GP51 API:', fetchError);
        return { error: `Network error: ${fetchError.message}`, status: 502 };
      }
    };

    // First, get the monitor list (devices/vehicles)
    const monitorResult = await fetchFromGP51('querymonitorlist');

    if (monitorResult.error) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'GP51 API error',
          details: monitorResult.error
        }),
        { 
          status: monitorResult.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Monitor data fetched successfully');

    // Extract devices from the response
    const devices = monitorResult.data.devices || monitorResult.data.result || [];
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
            total_positions: 0
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
    const positionResult = await fetchFromGP51('lastposition', {
      deviceids: deviceIds.join(',')
    });

    if (positionResult.error) {
      console.warn('⚠️ Position fetch failed, returning monitor data only:', positionResult.error);
    } else if (positionResult.data && positionResult.data.devices) {
      const positions = Array.isArray(positionResult.data.devices) ? positionResult.data.devices : [positionResult.data.devices];
      
      for (const pos of positions) {
        if (pos.lat !== undefined && pos.lon !== undefined) {
          telemetryData.push({
            device_id: pos.deviceid?.toString() || pos.id?.toString() || 'unknown',
            latitude: parseFloat(pos.lat),
            longitude: parseFloat(pos.lon),
            speed: parseFloat(pos.speed) || 0,
            heading: parseFloat(pos.angle || pos.direction || pos.course) || 0,
            timestamp: pos.time || pos.gpstime || new Date().toISOString(),
            status: pos.status || 'unknown',
            odometer: pos.mileage ? parseFloat(pos.mileage) : undefined,
            fuel_level: pos.fuel ? parseFloat(pos.fuel) : undefined,
            engine_status: pos.acc ? (pos.acc === '1' || pos.acc === 1 ? 'on' : 'off') : undefined,
            altitude: pos.altitude ? parseFloat(pos.altitude) : undefined,
            alarm_status: pos.alarm || undefined,
            signal_strength: pos.signal ? parseFloat(pos.signal) : undefined
          });
        }
      }
    }

    // Update vehicles table with latest telemetry data
    if (telemetryData.length > 0) {
      console.log(`💾 Updating ${telemetryData.length} vehicle records...`);
      
      for (const telem of telemetryData) {
        try {
          const { error: updateError } = await supabase
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
              fuel_level: telem.fuel_level,
              altitude: telem.altitude,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'device_id'
            });

          if (updateError) {
            console.error(`❌ Failed to update vehicle ${telem.device_id}:`, updateError);
          }
        } catch (upsertError) {
          console.error(`❌ Upsert error for device ${telem.device_id}:`, upsertError);
        }
      }
    }

    console.log('✅ Live data fetch completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        data: {
          users: devices,
          vehicles: telemetryData,
          telemetry: telemetryData,
          fetched_at: new Date().toISOString(),
          total_devices: deviceIds.length,
          total_positions: telemetryData.length
        },
        message: `Successfully fetched live data for ${telemetryData.length} devices`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Unexpected error in fetchLiveGp51Data:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
