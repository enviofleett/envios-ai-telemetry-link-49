
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
    const { deviceIds, lastQueryTime = 0 } = body;

    // Get active GP51 session
    const { data: sessions, error: sessionError } = await supabaseAdmin
      .from('gp51_sessions')
      .select('gp51_token, gp51_username, expires_at')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (sessionError || !sessions || sessions.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No active GP51 session found'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const session = sessions[0];
    
    // Check if session is expired
    if (new Date(session.expires_at) <= new Date()) {
      return new Response(JSON.stringify({
        success: false,
        error: 'GP51 session expired'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📍 Fetching positions for ${deviceIds?.length || 'all'} devices`);

    // Build GP51 API URL for lastposition query
    const queryUrl = new URL('https://www.gps51.com/webapi');
    queryUrl.searchParams.set('action', 'lastposition');
    queryUrl.searchParams.set('token', session.gp51_token);
    
    if (deviceIds && deviceIds.length > 0) {
      queryUrl.searchParams.set('deviceids', deviceIds.join(','));
    }
    
    if (lastQueryTime) {
      queryUrl.searchParams.set('lastquerypositiontime', lastQueryTime.toString());
    }

    console.log('🌐 GP51 Position Query URL created');

    const gp51Response = await fetch(queryUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Supabase-GP51-Integration/1.0'
      },
      signal: AbortSignal.timeout(15000)
    });

    console.log('📡 GP51 Position Response Status:', gp51Response.status);

    if (!gp51Response.ok) {
      throw new Error(`HTTP ${gp51Response.status}: ${gp51Response.statusText}`);
    }

    const responseText = await gp51Response.text();
    console.log('📄 Position Response Length:', responseText.length);

    if (!responseText) {
      throw new Error('Empty response from GP51');
    }

    let positionData;
    try {
      positionData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
    }

    console.log('📊 Position Data Status:', {
      status: positionData.status,
      cause: positionData.cause,
      recordCount: positionData.records?.length || 0
    });

    // Check API response status (0 = success)
    if (positionData.status !== 0) {
      console.error('❌ GP51 Position API Error:', positionData.cause);
      return new Response(JSON.stringify({ 
        success: false,
        error: `GP51 API Error: ${positionData.cause || 'Unknown error'}`,
        positions: []
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Process and validate position records
    const positions = (positionData.records || []).map(record => ({
      user_id: user.id,
      device_id: record.deviceid,
      latitude: parseFloat(record.callat || 0),
      longitude: parseFloat(record.callon || 0),
      speed: parseFloat(record.speed || 0),
      course: parseInt(record.course || 0),
      altitude: parseFloat(record.altitude || 0),
      device_time: new Date(record.devicetime || Date.now()).toISOString(),
      server_time: new Date(record.servertime || Date.now()).toISOString(),
      status: parseInt(record.status || 0),
      moving: parseInt(record.moving || 0),
      gps_source: record.gotsrc || null,
      battery: record.battery ? parseInt(record.battery) : null,
      signal: record.signal ? parseInt(record.signal) : null,
      satellites: record.satellites ? parseInt(record.satellites) : null,
      raw_data: record
    }));

    // Filter out invalid positions
    const validPositions = positions.filter(pos => {
      const validLat = Math.abs(pos.latitude) <= 90;
      const validLon = Math.abs(pos.longitude) <= 180;
      const hasDeviceId = pos.device_id && pos.device_id.length > 0;
      return validLat && validLon && hasDeviceId;
    });

    console.log(`📝 Storing ${validPositions.length} valid positions...`);

    // Store valid positions in database
    if (validPositions.length > 0) {
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
      .eq('user_id', user.id)
      .eq('is_active', true);

    console.log(`✅ Position fetch complete: ${validPositions.length} valid positions of ${positions.length} total`);

    return new Response(JSON.stringify({ 
      success: true,
      positions: validPositions.map(pos => ({
        deviceid: pos.device_id,
        callat: pos.latitude,
        callon: pos.longitude,
        speed: pos.speed,
        course: pos.course,
        altitude: pos.altitude,
        devicetime: pos.device_time,
        servertime: pos.server_time,
        status: pos.status,
        moving: pos.moving,
        gotsrc: pos.gps_source,
        battery: pos.battery,
        signal: pos.signal,
        satellites: pos.satellites
      })),
      totalRecords: positions.length,
      validRecords: validPositions.length,
      lastQueryTime: positionData.lastquerypositiontime || Date.now(),
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Position Query Error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: `Position query failed: ${error.message}`,
      positions: [],
      details: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
