
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { sessionId, deviceIds } = await req.json();
    
    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Session ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching positions for session:', sessionId);

    // Get session data
    const { data: session, error: sessionError } = await supabase
      .from('gp51_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      console.error('Session not found:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Invalid session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token is still valid
    if (new Date(session.token_expires_at) < new Date()) {
      console.error('Token expired');
      return new Response(
        JSON.stringify({ error: 'Session expired' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = session.gp51_token;
    console.log('Fetching last positions from GP51...');

    // Fetch last positions from GP51
    const positionPayload = {
      deviceids: deviceIds || [],
      lastquerypositiontime: ""
    };

    const positionResponse = await fetch(`https://www.gps51.com/webapi?action=lastposition&token=${token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(positionPayload),
    });

    if (!positionResponse.ok) {
      console.error('Failed to fetch positions:', positionResponse.status);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch positions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const positionResult = await positionResponse.json();
    console.log('Position response:', positionResult);

    if (positionResult.status === 1) {
      console.error('Failed to fetch positions:', positionResult.cause);
      return new Response(
        JSON.stringify({ error: positionResult.cause || 'Failed to fetch positions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const positions = positionResult.records || [];
    console.log(`Received ${positions.length} position records`);

    // Update vehicle positions in database
    for (const position of positions) {
      await supabase
        .from('vehicles')
        .update({
          last_position: {
            lat: position.callat,
            lon: position.callon,
            speed: position.speed,
            course: position.course,
            updatetime: position.updatetime,
            statusText: position.strstatusen
          },
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .eq('device_id', position.deviceid);
    }

    return new Response(
      JSON.stringify({
        success: true,
        positions: positions.map(p => ({
          deviceid: p.deviceid,
          lat: p.callat,
          lon: p.callon,
          speed: p.speed,
          course: p.course,
          updatetime: p.updatetime,
          statusText: p.strstatusen
        }))
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Position fetch error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
