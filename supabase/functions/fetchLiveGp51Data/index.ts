
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Construct the GP51 API URL
    const apiUrl = session.api_url || 'https://gps51.com/webapi';
    const gp51Token = session.gp51_token;

    // First, get the monitor list (users and devices)
    console.log('📡 Calling GP51 querymonitorlist API...');
    let monitorResponse;
    
    try {
      monitorResponse = await fetch(`${apiUrl}?action=querymonitorlist&token=${gp51Token}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'EnvioFleet/1.0'
        }
      });
    } catch (fetchError) {
      console.error('❌ Network error calling GP51 API:', fetchError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'GP51 API connection failed',
          details: `Network error: ${fetchError.message}`
        }),
        { 
          status: 502, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!monitorResponse.ok) {
      const errorText = await monitorResponse.text();
      console.error('❌ GP51 API HTTP error:', monitorResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'GP51 API error',
          details: `HTTP ${monitorResponse.status}: ${errorText}`
        }),
        { 
          status: 502, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    let monitorData;
    try {
      const responseText = await monitorResponse.text();
      console.log('📊 Raw GP51 monitor response:', responseText.substring(0, 500) + '...');
      monitorData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Failed to parse GP51 monitor response:', parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'GP51 API response parsing failed',
          details: 'Invalid JSON response from GP51'
        }),
        { 
          status: 502, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if GP51 returned an error
    if (monitorData.status !== 0) {
      console.error('❌ GP51 API returned error:', monitorData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'GP51 API error',
          details: monitorData.cause || 'Unknown GP51 error'
        }),
        { 
          status: 502, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Monitor data fetched successfully');

    // Extract device IDs for position fetching
    const devices = monitorData.data || [];
    const deviceIds = devices.map(device => device.id).filter(id => id);

    if (deviceIds.length === 0) {
      console.log('⚠️ No devices found in monitor list');
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: {
            users: devices,
            vehicles: [],
            telemetry: []
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

    // Batch fetch positions (GP51 supports multiple device IDs)
    const deviceIdString = deviceIds.join(',');
    
    try {
      const positionResponse = await fetch(`${apiUrl}?action=lastposition&token=${gp51Token}&id=${deviceIdString}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'EnvioFleet/1.0'
        }
      });

      if (positionResponse.ok) {
        const positionText = await positionResponse.text();
        console.log('📊 Raw GP51 position response:', positionText.substring(0, 500) + '...');
        
        const positionData = JSON.parse(positionText);
        
        if (positionData.status === 0 && positionData.data) {
          const positions = Array.isArray(positionData.data) ? positionData.data : [positionData.data];
          
          for (const pos of positions) {
            if (pos.lat && pos.lng) {
              telemetryData.push({
                device_id: pos.id?.toString() || 'unknown',
                latitude: parseFloat(pos.lat),
                longitude: parseFloat(pos.lng),
                speed: parseFloat(pos.speed) || 0,
                heading: parseFloat(pos.direction) || 0,
                timestamp: pos.gpstime || new Date().toISOString(),
                status: pos.status || 'unknown',
                odometer: pos.mileage ? parseFloat(pos.mileage) : undefined,
                fuel_level: pos.fuel ? parseFloat(pos.fuel) : undefined,
                engine_status: pos.acc ? (pos.acc === '1' ? 'on' : 'off') : undefined
              });
            }
          }
        }
      } else {
        console.warn('⚠️ Position fetch failed, continuing with monitor data only');
      }
    } catch (positionError) {
      console.warn('⚠️ Position fetch error, continuing with monitor data only:', positionError);
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
