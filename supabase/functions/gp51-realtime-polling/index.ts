
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

    const requestBody = await req.json().catch(() => ({}));
    console.log('GP51 polling triggered by:', requestBody.trigger || 'unknown');

    // Get stored GP51 credentials
    const { data: sessionData, error: sessionError } = await supabase
      .from('gp51_sessions')
      .select('gp51_token, username, token_expires_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (sessionError || !sessionData?.gp51_token) {
      const errorMsg = 'No valid GP51 session found';
      console.error(errorMsg, sessionError);
      await updatePollingStatus(supabase, false, errorMsg);
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if token is expired
    if (sessionData.token_expires_at && new Date(sessionData.token_expires_at) < new Date()) {
      const errorMsg = 'GP51 token has expired';
      console.error(errorMsg);
      await updatePollingStatus(supabase, false, errorMsg);
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get last successful poll time for incremental updates
    const { data: configData } = await supabase
      .from('gp51_polling_config')
      .select('last_successful_poll')
      .single();

    const lastQueryTime = configData?.last_successful_poll 
      ? new Date(configData.last_successful_poll).toISOString()
      : new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1 hour ago as fallback

    console.log('Calling GP51 lastposition API...');

    // Call GP51 lastposition API using the correct endpoint
    const gp51Response = await fetch('https://www.gps51.com/webapi?action=lastposition&token=' + encodeURIComponent(sessionData.gp51_token), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deviceids: [], // Empty array to get all devices
        lastquerypositiontime: lastQueryTime
      })
    });

    if (!gp51Response.ok) {
      const errorMsg = `GP51 API HTTP error: ${gp51Response.status} ${gp51Response.statusText}`;
      console.error(errorMsg);
      await updatePollingStatus(supabase, false, errorMsg);
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const gp51Data = await gp51Response.json();
    console.log('GP51 response status:', gp51Data.status);

    if (gp51Data.status !== 0) {
      const errorMsg = gp51Data.cause || 'GP51 API returned error status';
      console.error('GP51 API error:', errorMsg);
      await updatePollingStatus(supabase, false, errorMsg);
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const positions = gp51Data.records || [];
    console.log(`Received ${positions.length} position records from GP51`);

    let updatedCount = 0;
    let errorCount = 0;

    // Process each vehicle position update
    for (const position of positions) {
      try {
        if (!position.deviceid) {
          console.warn('Skipping position without deviceid:', position);
          continue;
        }

        // Map GP51 position data to our vehicle schema
        const vehicleUpdate = {
          last_position: {
            lat: parseFloat(position.callat) || 0,
            lon: parseFloat(position.callon) || 0,
            speed: parseFloat(position.speed) || 0,
            course: parseFloat(position.course) || 0,
            altitude: parseFloat(position.altitude) || 0,
            updatetime: position.updatetime,
            statusText: position.strstatusen || '',
            voltage: position.voltage || null,
            gpsquality: position.gpsquality || null
          },
          status: position.strstatusen || 'Unknown',
          updated_at: new Date().toISOString()
        };

        // Update vehicle by device_id
        const { error: updateError } = await supabase
          .from('vehicles')
          .update(vehicleUpdate)
          .eq('device_id', position.deviceid);

        if (updateError) {
          console.error('Error updating vehicle:', position.deviceid, updateError);
          errorCount++;
        } else {
          updatedCount++;
          console.log('Updated vehicle:', position.deviceid);
        }

      } catch (error) {
        console.error('Error processing position for device:', position.deviceid, error);
        errorCount++;
      }
    }

    console.log(`Successfully updated ${updatedCount} vehicles, ${errorCount} errors`);

    // Update polling status as successful
    await updatePollingStatus(supabase, true);

    return new Response(
      JSON.stringify({ 
        success: true, 
        vehiclesUpdated: updatedCount,
        errors: errorCount,
        totalRecords: positions.length,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('GP51 polling error:', error);
    
    // Try to update polling status if supabase is available
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      await updatePollingStatus(supabase, false, error.message);
    } catch (statusError) {
      console.error('Failed to update polling status:', statusError);
    }

    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function updatePollingStatus(supabase: any, success: boolean, errorMessage?: string) {
  try {
    // First try to use the RPC function
    const { error: rpcError } = await supabase.rpc('update_polling_status', {
      p_last_poll_time: new Date().toISOString(),
      p_success: success,
      p_error_message: errorMessage || null
    });

    if (rpcError) {
      console.warn('RPC update failed, trying direct update:', rpcError);
      
      // Fallback to direct table update
      const { error: updateError } = await supabase
        .from('gp51_polling_config')
        .update({
          last_poll_time: new Date().toISOString(),
          last_successful_poll: success ? new Date().toISOString() : undefined,
          error_count: success ? 0 : undefined,
          last_error: success ? null : errorMessage,
          updated_at: new Date().toISOString()
        })
        .eq('id', (await supabase.from('gp51_polling_config').select('id').single()).data?.id);

      if (updateError) {
        console.error('Failed to update polling status directly:', updateError);
      }
    }
  } catch (error) {
    console.error('Error in updatePollingStatus:', error);
  }
}
