
// Trigger re-deploy - 2025-06-14
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { md5_sync } from "../_shared/crypto_utils.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let requestBody;
  try {
    requestBody = await req.json();
  } catch (e) {
    return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  const { username, password } = requestBody;

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    if (!username || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Username and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticating user for telemetry:', username);

    const hashedPassword = md5_sync(password);
    console.log('Password hashed successfully for telemetry auth.');

    const loginPayload = {
      action: 'login',
      username: username.trim(),
      password: hashedPassword,
      from: 'WEB',
      type: 'USER'
    };

    console.log('Calling GP51 login API for telemetry...');
    const GP51_API_BASE = Deno.env.get('GP51_API_BASE_URL') || 'https://www.gps51.com';
    const loginResponse = await fetch(`${GP51_API_BASE}/webapi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'EnvioFleet/1.0/TelemetryAuth'
      },
      body: new URLSearchParams(loginPayload).toString()
    });

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.error(`GP51 API request failed during telemetry auth: ${loginResponse.status} ${loginResponse.statusText}`, errorText.substring(0,100));
      return new Response(
        JSON.stringify({ success: false, error: `Failed to connect to telemetry system (GP51 API Error ${loginResponse.status})` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const responseText = await loginResponse.text();
    let loginResult;
    try {
        loginResult = JSON.parse(responseText);
    } catch (e) {
        console.error(`GP51 telemetry auth returned invalid JSON:`, responseText.substring(0,200));
        return new Response(
            JSON.stringify({ success: false, error: `Invalid response from telemetry system (not JSON). Preview: ${responseText.substring(0,100)}` }),
            { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
    console.log('GP51 login response received for telemetry.');

    if (loginResult.status !== 0) {
      const errorMessage = loginResult.cause || loginResult.message || 'Telemetry authentication failed at GP51.';
      console.error(`GP51 login failed for telemetry: ${errorMessage} (GP51 Status: ${loginResult.status})`);
      return new Response(
        JSON.stringify({ success: false, error: errorMessage, gp51_status: loginResult.status }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = loginResult.token;
    console.log('GP51 login successful for telemetry, token received.');

    const { data: sessionData, error: sessionError } = await supabase
      .from('gp51_sessions')
      .upsert({
        username: username.trim(),
        password_hash: hashedPassword,
        gp51_token: token,
        auth_method: 'TELEMETRY_AUTH',
        token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        last_validated_at: new Date().toISOString(),
      }, { onConflict: 'username' })
      .select('id')
      .single();

    if (sessionError) {
      console.error('Failed to store telemetry session:', sessionError.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to store session information after successful GP51 login.' , details: sessionError.message}),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!sessionData || !sessionData.id) {
      console.error('Failed to retrieve session ID after upsert for telemetry.');
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to confirm session storage.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Telemetry session stored (ID: ${sessionData.id}), fetching vehicle list...`);

    const vehicleResponse = await fetch(`${GP51_API_BASE}/webapi?action=getDeviceList&token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'EnvioFleet/1.0/TelemetryAuth'
      },
      body: new URLSearchParams().toString()
    });

    if (!vehicleResponse.ok) {
      const errorText = await vehicleResponse.text();
      console.error(`Failed to fetch vehicle list for telemetry: ${vehicleResponse.status} ${vehicleResponse.statusText}`, errorText.substring(0,100));
      return new Response(
        JSON.stringify({ success: false, error: `Failed to fetch vehicle list (GP51 API Error ${vehicleResponse.status})` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const vehicleResultText = await vehicleResponse.text();
    let vehicleResult;
    try {
        vehicleResult = JSON.parse(vehicleResultText);
    } catch (e) {
        console.error(`GP51 vehicle list for telemetry returned invalid JSON:`, vehicleResultText.substring(0,200));
        return new Response(
            JSON.stringify({ success: false, error: `Invalid vehicle list response from telemetry system (not JSON). Preview: ${vehicleResultText.substring(0,100)}` }),
            { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
    console.log('Vehicle list response received for telemetry.');

    if (vehicleResult.status !== 0) {
      const errorMessage = vehicleResult.cause || vehicleResult.message || 'Failed to fetch vehicles from GP51.';
      console.error(`Failed to fetch vehicles for telemetry: ${errorMessage} (GP51 Status: ${vehicleResult.status})`);
      return new Response(
        JSON.stringify({ success: false, error: errorMessage, gp51_status: vehicleResult.status }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let vehicles: any[] = [];
    if (Array.isArray(vehicleResult.records)) {
        vehicles = vehicleResult.records;
    } else if (Array.isArray(vehicleResult.devices)) {
        vehicles = vehicleResult.devices;
    } else if (Array.isArray(vehicleResult.groups)) {
        vehicles = vehicleResult.groups.flatMap((group: any) => group.devices || []);
    }

    console.log(`Storing ${vehicles.length} vehicles in database for telemetry session ${sessionData.id}`);

    for (const vehicle of vehicles) {
      const { error: vehicleUpsertError } = await supabase
        .from('vehicles')
        .upsert({
          device_id: vehicle.deviceid,
          device_name: vehicle.devicename,
          status: vehicle.status || vehicle.strstatus || 'unknown',
          gp51_username: username.trim()
        }, { onConflict: 'device_id' });

      if (vehicleUpsertError) {
        console.warn(`⚠️ Failed to upsert vehicle ${vehicle.deviceid} for telemetry:`, vehicleUpsertError.message);
      }
    }

    console.log('Telemetry authentication and vehicle fetch completed successfully.');

    return new Response(
      JSON.stringify({
        success: true,
        sessionId: sessionData.id,
        gp51_token_preview: token.substring(0,5) + "...",
        vehicles: vehicles.map(v => ({
          deviceid: v.deviceid,
          devicename: v.devicename,
          status: v.status || v.strstatus || 'unknown'
        })),
        vehicle_count: vehicles.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('💥 Telemetry Auth function error:', error.message, error.stack);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error in telemetry auth function.', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
