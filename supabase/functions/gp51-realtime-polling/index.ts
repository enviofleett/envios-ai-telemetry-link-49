
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

    console.log('Starting GP51 real-time polling...');

    // Get stored GP51 credentials
    const { data: sessionData, error: sessionError } = await supabase
      .from('gp51_sessions')
      .select('gp51_token, username')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (sessionError || !sessionData?.gp51_token) {
      console.error('No valid GP51 session found:', sessionError);
      await updatePollingStatus(supabase, false, 'No valid GP51 session found');
      return new Response(JSON.stringify({ error: 'No valid GP51 session' }), {
        status: 400,
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
      : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24 hours ago as fallback

    // Call GP51 lastposition API
    const gp51Response = await fetch('https://gp51live.com/api/lastposition', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: sessionData.gp51_token,
        lastquerypositiontime: lastQueryTime
      })
    });

    if (!gp51Response.ok) {
      console.error('GP51 API error:', gp51Response.status, gp51Response.statusText);
      await updatePollingStatus(supabase, false, `GP51 API error: ${gp51Response.status}`);
      return new Response(JSON.stringify({ error: 'GP51 API error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const gp51Data = await gp51Response.json();
    console.log(`Received ${gp51Data?.length || 0} vehicle updates from GP51`);

    if (gp51Data && Array.isArray(gp51Data) && gp51Data.length > 0) {
      // Process each vehicle update
      let updatedCount = 0;
      
      for (const vehicleData of gp51Data) {
        try {
          // Map GP51 data to our vehicle schema
          const vehicleUpdate = {
            device_id: vehicleData.deviceid,
            device_name: vehicleData.devicename || vehicleData.deviceid,
            status: vehicleData.strstatusen || 'Unknown',
            last_position: {
              lat: parseFloat(vehicleData.callat) || 0,
              lon: parseFloat(vehicleData.callon) || 0,
              speed: parseFloat(vehicleData.speed) || 0,
              course: parseFloat(vehicleData.course) || 0,
              updatetime: vehicleData.updatetime,
              statusText: vehicleData.strstatusen || ''
            },
            updated_at: new Date().toISOString()
          };

          // Upsert vehicle data
          const { error: upsertError } = await supabase
            .from('vehicles')
            .upsert(vehicleUpdate, {
              onConflict: 'device_id',
              ignoreDuplicates: false
            });

          if (upsertError) {
            console.error('Error upserting vehicle:', vehicleData.deviceid, upsertError);
          } else {
            updatedCount++;
          }
        } catch (error) {
          console.error('Error processing vehicle data:', vehicleData.deviceid, error);
        }
      }

      console.log(`Successfully updated ${updatedCount} vehicles`);
    }

    // Update polling status as successful
    await updatePollingStatus(supabase, true);

    return new Response(
      JSON.stringify({ 
        success: true, 
        vehiclesUpdated: gp51Data?.length || 0,
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
    const { error } = await supabase.rpc('update_polling_status', {
      p_last_poll_time: new Date().toISOString(),
      p_success: success,
      p_error_message: errorMessage || null
    });

    if (error) {
      console.error('Failed to update polling status:', error);
    }
  } catch (error) {
    console.error('Error calling update_polling_status:', error);
  }
}
