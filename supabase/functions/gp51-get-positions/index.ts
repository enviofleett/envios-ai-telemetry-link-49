
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log(`[${new Date().toISOString()}] GP51 Get Positions Request`);

    // Initialize Supabase clients
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Authorization required'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Invalid authentication'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    const { deviceIds } = body;

    // Get active GP51 session
    const { data: sessions, error: sessionError } = await supabaseAdmin
      .from('gp51_sessions')
      .select('gp51_token, username, token_expires_at')
      .eq('envio_user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (sessionError || !sessions || sessions.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No active GP51 session found. Please authenticate first.'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const session = sessions[0];
    
    // Check if session is expired
    if (new Date(session.token_expires_at) <= new Date()) {
      return new Response(JSON.stringify({
        success: false,
        error: 'GP51 session expired. Please re-authenticate.'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('🔍 Fetching GP51 positions...');

    // Call GP51 lastposition API
    const gp51Url = `https://www.gps51.com/webapi?action=lastposition&token=${session.gp51_token}`;
    
    const requestBody = {
      deviceids: deviceIds || [],
      lastquerypositiontime: 0
    };

    const gp51Response = await fetch(gp51Url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Supabase-GP51-Integration/1.0'
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(15000)
    });

    if (!gp51Response.ok) {
      throw new Error(`GP51 API Error: ${gp51Response.status}`);
    }

    const responseText = await gp51Response.text();
    console.log('📄 GP51 Position Response length:', responseText.length);

    let gp51Result;
    try {
      gp51Result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
    }

    console.log('📊 GP51 Position Response status:', gp51Result.status);

    if (gp51Result.status === 0) {
      const positions = gp51Result.records || [];
      
      // Validate and store positions in database
      const validPositions = positions
        .filter(pos => {
          const validLat = Math.abs(pos.callat) <= 90;
          const validLon = Math.abs(pos.callon) <= 180;
          return validLat && validLon && pos.deviceid;
        })
        .map(pos => ({
          user_id: user.id,
          device_id: pos.deviceid,
          latitude: pos.callat,
          longitude: pos.callon,
          speed: pos.speed || 0,
          course: pos.course || 0,
          altitude: pos.altitude || 0,
          device_time: new Date(pos.devicetime).toISOString(),
          server_time: new Date().toISOString(),
          status: pos.status,
          moving: pos.moving,
          gps_source: pos.gotsrc,
          battery: pos.battery,
          signal: pos.signal,
          satellites: pos.satellites,
          raw_data: pos
        }));

      if (validPositions.length > 0) {
        console.log(`📝 Storing ${validPositions.length} positions in database...`);
        
        const { error: insertError } = await supabaseAdmin
          .from('gp51_positions')
          .insert(validPositions);

        if (insertError) {
          console.error('❌ Position insert error:', insertError);
        } else {
          console.log('✅ Successfully stored positions');
        }
      }

      // Update session activity
      await supabaseAdmin
        .from('gp51_sessions')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('envio_user_id', user.id)
        .eq('is_active', true);

      return new Response(JSON.stringify({
        success: true,
        positions: positions,
        validPositions: validPositions.length,
        totalPositions: positions.length,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else {
      console.error('❌ GP51 position fetch failed:', gp51Result.cause);
      return new Response(JSON.stringify({
        success: false,
        error: gp51Result.cause || 'Failed to fetch positions from GP51',
        gp51_status: gp51Result.status
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('💥 GP51 Positions Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: `Position fetch failed: ${error.message}`,
      details: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
