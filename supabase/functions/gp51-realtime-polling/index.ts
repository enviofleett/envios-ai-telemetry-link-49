
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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting GP51 real-time polling cycle...');

    // Get polling configuration
    const { data: config, error: configError } = await supabase
      .from('gp51_polling_config')
      .select('*')
      .single();

    if (configError || !config) {
      console.error('Failed to get polling config:', configError);
      return new Response(
        JSON.stringify({ error: 'Polling configuration not found' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!config.is_enabled) {
      console.log('Polling is disabled');
      return new Response(
        JSON.stringify({ message: 'Polling is disabled' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentTime = new Date().toISOString();
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    try {
      // Get all active GP51 sessions with their vehicles
      const { data: sessions, error: sessionsError } = await supabase
        .from('gp51_sessions')
        .select(`
          *,
          vehicles!vehicles_session_id_fkey (
            id,
            device_id,
            device_name,
            is_active
          )
        `)
        .not('gp51_token', 'is', null)
        .gt('token_expires_at', currentTime);

      if (sessionsError) {
        throw new Error(`Failed to fetch sessions: ${sessionsError.message}`);
      }

      console.log(`Found ${sessions?.length || 0} active GP51 sessions`);

      // Process each session
      for (const session of sessions || []) {
        if (!session.gp51_token || new Date(session.token_expires_at) < new Date()) {
          console.log(`Skipping expired session: ${session.username}`);
          continue;
        }

        const activeVehicles = session.vehicles?.filter(v => v.is_active) || [];
        if (activeVehicles.length === 0) {
          console.log(`No active vehicles for session: ${session.username}`);
          continue;
        }

        const deviceIds = activeVehicles.map(v => v.device_id);
        console.log(`Polling ${deviceIds.length} vehicles for session: ${session.username}`);

        try {
          // Call GP51 lastposition API
          const lastQueryTime = config.last_successful_poll || '';
          const positionPayload = {
            deviceids: deviceIds,
            lastquerypositiontime: lastQueryTime
          };

          const gp51Response = await fetch(`https://www.gps51.com/webapi?action=lastposition&token=${session.gp51_token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(positionPayload),
          });

          if (!gp51Response.ok) {
            throw new Error(`GP51 API returned ${gp51Response.status}`);
          }

          const gp51Result = await gp51Response.json();
          
          if (gp51Result.status === 1) {
            throw new Error(`GP51 API error: ${gp51Result.cause || 'Unknown error'}`);
          }

          const positions = gp51Result.records || [];
          console.log(`Received ${positions.length} position updates for session: ${session.username}`);

          // Update vehicle positions in database
          for (const position of positions) {
            try {
              const updateData = {
                last_position: {
                  lat: position.callat,
                  lon: position.callon,
                  speed: position.speed,
                  course: position.course,
                  updatetime: position.updatetime,
                  statusText: position.strstatusen
                },
                status: position.strstatusen,
                updated_at: new Date().toISOString()
              };

              const { error: updateError } = await supabase
                .from('vehicles')
                .update(updateData)
                .eq('device_id', position.deviceid)
                .eq('session_id', session.id);

              if (updateError) {
                console.error(`Failed to update vehicle ${position.deviceid}:`, updateError);
                errorCount++;
                errors.push(`Vehicle ${position.deviceid}: ${updateError.message}`);
              } else {
                successCount++;
                console.log(`Updated vehicle ${position.deviceid} successfully`);
              }
            } catch (vehicleError) {
              console.error(`Error processing vehicle ${position.deviceid}:`, vehicleError);
              errorCount++;
              errors.push(`Vehicle ${position.deviceid}: ${vehicleError.message}`);
            }
          }

        } catch (sessionError) {
          console.error(`Error polling session ${session.username}:`, sessionError);
          errorCount++;
          errors.push(`Session ${session.username}: ${sessionError.message}`);
        }
      }

      // Update polling status
      const isSuccess = errorCount === 0;
      const errorMessage = errors.length > 0 ? errors.join('; ') : null;

      await supabase.rpc('update_polling_status', {
        p_last_poll_time: currentTime,
        p_success: isSuccess,
        p_error_message: errorMessage
      });

      console.log(`Polling cycle completed. Success: ${successCount}, Errors: ${errorCount}`);

      return new Response(
        JSON.stringify({
          success: true,
          timestamp: currentTime,
          sessionsProcessed: sessions?.length || 0,
          vehiclesUpdated: successCount,
          errors: errorCount,
          errorDetails: errors.length > 0 ? errors : undefined
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (mainError) {
      console.error('Main polling error:', mainError);
      
      // Update polling status with error
      await supabase.rpc('update_polling_status', {
        p_last_poll_time: currentTime,
        p_success: false,
        p_error_message: mainError.message
      });

      throw mainError;
    }

  } catch (error) {
    console.error('Critical polling error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
