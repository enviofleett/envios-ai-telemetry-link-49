
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { ProductionGP51Service } from '../_shared/ProductionGP51Service.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { username, password, deviceId, command, parameters = [] } = await req.json();

    if (!username || !password || !deviceId || !command) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Username, password, deviceId, and command are required' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Authenticate with GP51
    console.log('🔐 Authenticating for command execution...');
    const gp51Service = new ProductionGP51Service();
    const authResult = await gp51Service.authenticate(username, password);

    if (authResult.status !== 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Authentication failed' 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send command to device
    console.log(`📱 Sending command '${command}' to device ${deviceId}...`);
    const commandResult = await gp51Service.sendVehicleCommand(deviceId, command, parameters);

    // Log command execution
    await supabase
      .from('gp51_sync_log')
      .insert({
        operation_type: 'mobile_command',
        username,
        request_data: { deviceId, command, parameters },
        response_data: commandResult,
        status: commandResult.status === 0 ? 'success' : 'error',
        gp51_status_code: commandResult.status
      });

    if (commandResult.status !== 0) {
      console.error('❌ Command execution failed:', commandResult.cause);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: commandResult.cause || 'Command execution failed' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Command executed successfully');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        result: {
          deviceId,
          command,
          status: commandResult.status,
          message: commandResult.cause,
          timestamp: new Date().toISOString()
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Mobile command execution error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Command execution failed' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
