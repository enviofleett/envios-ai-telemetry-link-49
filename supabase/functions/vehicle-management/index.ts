
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const url = new URL(req.url);
    const method = req.method;
    const searchParams = url.searchParams;

    if (method === 'GET') {
      const action = searchParams.get('action');
      
      if (action === 'historical-tracks') {
        const deviceId = searchParams.get('deviceId');
        const beginTime = searchParams.get('beginTime');
        const endTime = searchParams.get('endTime');
        const sessionId = searchParams.get('sessionId');

        if (!deviceId || !beginTime || !endTime || !sessionId) {
          return new Response(
            JSON.stringify({ error: 'Missing required parameters' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get session data
        const { data: session, error: sessionError } = await supabase
          .from('gp51_sessions')
          .select('*')
          .eq('id', sessionId)
          .single();

        if (sessionError || !session) {
          return new Response(
            JSON.stringify({ error: 'Invalid session' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check token validity
        if (new Date(session.token_expires_at) < new Date()) {
          return new Response(
            JSON.stringify({ error: 'Session expired' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const token = session.gp51_token;
        
        // Fetch historical tracks from GP51
        const trackPayload = {
          deviceid: deviceId,
          begintime: beginTime,
          endtime: endTime,
          timezone: "UTC"
        };

        const trackResponse = await fetch(`https://www.gps51.com/webapi?action=querytracks&token=${token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(trackPayload),
        });

        if (!trackResponse.ok) {
          return new Response(
            JSON.stringify({ error: 'Failed to fetch tracks' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const trackResult = await trackResponse.json();

        if (trackResult.status === 1) {
          return new Response(
            JSON.stringify({ error: trackResult.cause || 'Failed to fetch tracks' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            tracks: trackResult.records || []
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'share-track') {
        const deviceId = searchParams.get('deviceId');
        const interval = searchParams.get('interval') || '24';
        const sessionId = searchParams.get('sessionId');

        if (!deviceId || !sessionId) {
          return new Response(
            JSON.stringify({ error: 'Missing required parameters' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get session data
        const { data: session, error: sessionError } = await supabase
          .from('gp51_sessions')
          .select('*')
          .eq('id', sessionId)
          .single();

        if (sessionError || !session) {
          return new Response(
            JSON.stringify({ error: 'Invalid session' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const token = session.gp51_token;
        
        // Generate share URL from GP51
        const sharePayload = {
          deviceid: deviceId,
          interval: interval
        };

        const shareResponse = await fetch(`https://www.gps51.com/webapi?action=gensharetrackurl&token=${token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sharePayload),
        });

        if (!shareResponse.ok) {
          return new Response(
            JSON.stringify({ error: 'Failed to generate share URL' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const shareResult = await shareResponse.json();

        if (shareResult.status === 1) {
          return new Response(
            JSON.stringify({ error: shareResult.cause || 'Failed to generate share URL' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            shareUrl: shareResult.shareurl
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Default: Get all vehicles with enhanced data
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          gp51_sessions!inner (
            id,
            username,
            token_expires_at
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching vehicles:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch vehicles' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ vehicles }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (method === 'PUT') {
      const { vehicleId, notes, simNumber, isActive } = await req.json();

      if (!vehicleId) {
        return new Response(
          JSON.stringify({ error: 'Vehicle ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const updates: any = { updated_at: new Date().toISOString() };
      if (notes !== undefined) updates.notes = notes;
      if (simNumber !== undefined) updates.sim_number = simNumber;
      if (isActive !== undefined) updates.is_active = isActive;

      const { data: vehicle, error } = await supabase
        .from('vehicles')
        .update(updates)
        .eq('id', vehicleId)
        .select()
        .single();

      if (error) {
        console.error('Error updating vehicle:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ vehicle }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Vehicle management error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
