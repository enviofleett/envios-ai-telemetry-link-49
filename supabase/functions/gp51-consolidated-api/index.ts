
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GP51ApiRequest {
  action: 'fetch_vehicles' | 'fetch_positions' | 'update_positions';
  deviceIds?: string[];
  positions?: Array<{
    deviceid: string;
    lat: number;
    lon: number;
    speed: number;
    course: number;
    updatetime: string;
    statusText: string;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, deviceIds, positions }: GP51ApiRequest = await req.json();
    
    console.log(`🔧 GP51 Consolidated API: ${action}`);

    // Get user credentials from vault
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: user } = await supabase.auth.getUser(token);
    
    if (!user.user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get GP51 credentials from vault
    const { data: credentials, error: credError } = await supabase
      .rpc('get_gp51_credentials', { p_user_id: user.user.id });

    if (credError || !credentials || credentials.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No GP51 credentials found' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cred = credentials[0];

    switch (action) {
      case 'fetch_vehicles':
        return await fetchVehiclesFromGP51(cred.username, cred.password, cred.api_url);
      
      case 'fetch_positions':
        return await fetchPositionsFromGP51(cred.username, cred.password, cred.api_url, deviceIds);
      
      case 'update_positions':
        return await updatePositionsInDatabase(supabase, positions || []);
      
      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('❌ GP51 Consolidated API error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function fetchVehiclesFromGP51(username: string, password: string, apiUrl: string) {
  try {
    // Authenticate and get token
    const authResponse = await fetch(`${apiUrl}/Login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username, password, t: Date.now().toString() })
    });

    const token = await authResponse.text();
    if (token.includes('error')) {
      throw new Error('Authentication failed');
    }

    // Fetch vehicle list
    const vehiclesResponse = await fetch(`${apiUrl}/QueryMonitorList`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token: token.trim(), t: Date.now().toString() })
    });

    const vehiclesData = await vehiclesResponse.text();
    const vehicles = JSON.parse(vehiclesData);

    return new Response(
      JSON.stringify({ 
        success: true,
        vehicles: vehicles.groups?.flatMap((group: any) => group.devices || []) || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch vehicles' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function fetchPositionsFromGP51(username: string, password: string, apiUrl: string, deviceIds?: string[]) {
  try {
    // Authenticate and get token
    const authResponse = await fetch(`${apiUrl}/Login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username, password, t: Date.now().toString() })
    });

    const token = await authResponse.text();
    if (token.includes('error')) {
      throw new Error('Authentication failed');
    }

    // Fetch positions
    const positionsResponse = await fetch(`${apiUrl}/QueryPosition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ 
        token: token.trim(), 
        deviceids: deviceIds?.join(',') || '',
        t: Date.now().toString() 
      })
    });

    const positionsData = await positionsResponse.text();
    const positions = JSON.parse(positionsData);

    return new Response(
      JSON.stringify({ 
        success: true,
        positions: positions.positions || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch positions' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function updatePositionsInDatabase(supabase: any, positions: any[]) {
  try {
    if (positions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, updated: 0, errors: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const upsertData = positions.map(position => ({
      device_id: position.deviceid,
      latitude: position.lat,
      longitude: position.lon,
      speed: position.speed,
      heading: position.course,
      last_update: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('vehicles')
      .upsert(upsertData, { onConflict: 'device_id' });

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        updated: positions.length, 
        errors: 0 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update positions',
        updated: 0,
        errors: positions.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
