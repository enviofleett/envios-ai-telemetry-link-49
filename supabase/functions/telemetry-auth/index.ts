
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fixed MD5 hash function for Deno compatibility
async function md5(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  
  const { createHash } = await import("https://deno.land/std@0.168.0/crypto/mod.ts");
  return createHash("md5").update(data).digest("hex");
}

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

    const { username, password } = await req.json();
    
    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: 'Username and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticating user:', username);

    // MD5 encrypt the password using fixed implementation
    const hashedPassword = await md5(password);
    console.log('Password hashed successfully');

    // Login to GP51 using standardized endpoint and parameters
    const loginPayload = {
      action: 'login',
      username: username,
      password: hashedPassword,
      from: 'WEB',
      type: 'USER'
    };

    console.log('Calling GP51 login API...');
    // Standardized GP51 API endpoint
    const GP51_API_BASE = Deno.env.get('GP51_API_BASE_URL') || 'https://www.gps51.com';
    const loginResponse = await fetch(`${GP51_API_BASE}/webapi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginPayload),
    });

    if (!loginResponse.ok) {
      console.error('GP51 API request failed:', loginResponse.status);
      return new Response(
        JSON.stringify({ error: 'Failed to connect to telemetry system' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const loginResult = await loginResponse.json();
    console.log('GP51 login response received');

    // Standardized success check - GP51 uses status: 0 for success
    if (loginResult.status !== 0) {
      console.error('GP51 login failed:', loginResult.cause);
      return new Response(
        JSON.stringify({ error: loginResult.cause || 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = loginResult.token;
    console.log('GP51 login successful, token received');

    // Store session in database
    const { data: sessionData, error: sessionError } = await supabase
      .from('gp51_sessions')
      .insert({
        username: username,
        gp51_token: token,
        token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Failed to store session:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Failed to store session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Session stored, fetching vehicle list...');

    // Fetch vehicle list using standardized endpoint and token parameter
    const vehicleResponse = await fetch(`${GP51_API_BASE}/webapi?action=querymonitorlist&token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: username }),
    });

    if (!vehicleResponse.ok) {
      console.error('Failed to fetch vehicle list:', vehicleResponse.status);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch vehicle list' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const vehicleResult = await vehicleResponse.json();
    console.log('Vehicle list response received');

    // Standardized success check
    if (vehicleResult.status !== 0) {
      console.error('Failed to fetch vehicles:', vehicleResult.cause);
      return new Response(
        JSON.stringify({ error: vehicleResult.cause || 'Failed to fetch vehicles' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store vehicles in database
    const vehicles = vehicleResult.records || [];
    console.log(`Storing ${vehicles.length} vehicles in database`);

    for (const vehicle of vehicles) {
      await supabase
        .from('vehicles')
        .upsert({
          session_id: sessionData.id,
          device_id: vehicle.deviceid,
          device_name: vehicle.devicename,
          status: vehicle.status || 'unknown',
        });
    }

    console.log('Authentication and vehicle fetch completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        sessionId: sessionData.id,
        vehicles: vehicles.map(v => ({
          deviceid: v.deviceid,
          devicename: v.devicename,
          status: v.status || 'unknown'
        }))
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Authentication error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
