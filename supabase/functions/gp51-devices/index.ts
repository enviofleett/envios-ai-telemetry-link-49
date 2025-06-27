
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
    console.log(`[${new Date().toISOString()}] GP51 Devices Request`);

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

    // Get active GP51 session
    const { data: sessions, error: sessionError } = await supabaseAdmin
      .from('gp51_sessions')
      .select('gp51_token, username, expires_at')
      .eq('user_id', user.id)
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
    if (new Date(session.expires_at) <= new Date()) {
      return new Response(JSON.stringify({
        success: false,
        error: 'GP51 session expired. Please re-authenticate.'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('🔍 Fetching GP51 device tree...');

    // Use the correct API endpoint for device tree
    const gp51Url = `https://api.gps51.com/webapi?action=querydevicestree&token=${session.gp51_token}&extend=self&serverid=0`;
    
    const gp51Response = await fetch(gp51Url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Supabase-GP51-Integration/1.0'
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!gp51Response.ok) {
      throw new Error(`GP51 API Error: ${gp51Response.status}`);
    }

    const responseText = await gp51Response.text();
    console.log('📄 GP51 Device Response length:', responseText.length);

    // Enhanced response validation
    if (!responseText || responseText.trim().length === 0) {
      console.error('❌ Empty response from GP51 device API');
      return new Response(JSON.stringify({
        success: false,
        error: 'Empty response from GP51 device API'
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const trimmedResponse = responseText.trim();
    if (!trimmedResponse.startsWith('{') && !trimmedResponse.startsWith('[')) {
      console.error('❌ Non-JSON response from GP51 device API:', trimmedResponse.substring(0, 100));
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid response format from GP51 device API'
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let gp51Result;
    try {
      gp51Result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid JSON response from GP51 device API'
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('📊 GP51 Device Response status:', gp51Result.status);

    if (gp51Result.status === 0) {
      // Process and store devices
      const devices = [];
      const groups = gp51Result.groups || [];

      for (const group of groups) {
        if (group.devices && Array.isArray(group.devices)) {
          for (const device of group.devices) {
            devices.push({
              user_id: user.id,
              device_id: device.deviceid,
              device_name: device.devicename,
              device_type: device.devicetype,
              group_id: group.groupid,
              group_name: group.groupname,
              is_free: device.isfree || 0,
              last_active_time: device.lastactivetime,
              status: 'active',
              updated_at: new Date().toISOString(),
              raw_data: device
            });
          }
        }
      }

      console.log(`📝 Storing ${devices.length} devices in database...`);

      // Store/update devices in database
      if (devices.length > 0) {
        const { error: upsertError } = await supabaseAdmin
          .from('gp51_devices')
          .upsert(devices, {
            onConflict: 'user_id,device_id'
          });

        if (upsertError) {
          console.error('❌ Device upsert error:', upsertError);
        } else {
          console.log('✅ Successfully stored devices');
        }
      }

      // Update session activity
      await supabaseAdmin
        .from('gp51_sessions')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_active', true);

      return new Response(JSON.stringify({
        success: true,
        groups: groups,
        devices: devices.map(d => ({
          deviceid: d.device_id,
          devicename: d.device_name,
          devicetype: d.device_type,
          groupid: d.group_id,
          groupname: d.group_name,
          isfree: d.is_free,
          lastactivetime: d.last_active_time
        })),
        deviceCount: devices.length,
        groupCount: groups.length,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else {
      console.error('❌ GP51 device fetch failed:', gp51Result.cause);
      return new Response(JSON.stringify({
        success: false,
        error: gp51Result.cause || 'Failed to fetch devices from GP51',
        gp51_status: gp51Result.status
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('💥 GP51 Devices Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: `Device fetch failed: ${error.message}`,
      details: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
