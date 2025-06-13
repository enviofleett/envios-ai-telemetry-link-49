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
      
      if (action === 'enhanced-vehicles') {
        // Get enhanced vehicle data with user information and workshop activations
        const { data: vehicles, error } = await supabase
          .from('vehicles')
          .select(`
            *,
            envio_users (
              name,
              email
            ),
            workshop_vehicle_activations (
              id,
              workshop_id,
              activation_status,
              activation_date,
              expiration_date,
              workshops (
                name,
                service_types
              )
            )
          `)
          .order('updated_at', { ascending: false });

        if (error) {
          console.error('Database error:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch vehicles' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, vehicles }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'live-data') {
        const deviceIds = searchParams.get('deviceIds')?.split(',') || [];
        
        if (deviceIds.length === 0) {
          return new Response(
            JSON.stringify({ error: 'No device IDs provided' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Fetch live data from GP51
        const { data: liveData, error: liveError } = await supabase.functions.invoke('fetchLiveGp51Data', {
          body: { deviceIds }
        });

        if (liveError) {
          return new Response(
            JSON.stringify({ error: 'Failed to fetch live data' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, data: liveData }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

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
        const GP51_API_BASE = Deno.env.get('GP51_API_BASE_URL') || 'https://www.gps51.com';
        const trackPayload = {
          deviceid: deviceId,
          begintime: beginTime,
          endtime: endTime,
          timezone: "UTC"
        };

        const trackResponse = await fetch(`${GP51_API_BASE}/webapi?action=querytracks&token=${token}`, {
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
        const GP51_API_BASE = Deno.env.get('GP51_API_BASE_URL') || 'https://www.gps51.com';
        const sharePayload = {
          deviceid: deviceId,
          interval: interval
        };

        const shareResponse = await fetch(`${GP51_API_BASE}/webapi?action=gensharetrackurl&token=${token}`, {
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
          envio_users (
            name,
            email
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
      const requestBody = await req.json();
      const { vehicleId, ...updates } = requestBody;

      if (!vehicleId) {
        return new Response(
          JSON.stringify({ error: 'Vehicle ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Add updated_at timestamp
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data: vehicle, error } = await supabase
        .from('vehicles')
        .update(updateData)
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
        JSON.stringify({ success: true, vehicle }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (method === 'POST') {
      const requestBody = await req.json();
      const action = requestBody.action;

      if (action === 'activate-workshop') {
        const { vehicleId, workshopId, serviceType, activationFee } = requestBody;

        if (!vehicleId || !workshopId) {
          return new Response(
            JSON.stringify({ error: 'Vehicle ID and Workshop ID are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Create workshop activation
        const { data: activation, error } = await supabase
          .from('workshop_vehicle_activations')
          .insert({
            vehicle_id: vehicleId,
            workshop_id: workshopId,
            service_type: serviceType || 'general',
            activation_fee: activationFee || 0,
            expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating workshop activation:', error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, activation }),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Unknown action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
