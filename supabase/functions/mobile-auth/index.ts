
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

    const { username, password } = await req.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Username and password are required' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Authenticate with GP51
    console.log('🔐 Authenticating with GP51...');
    const gp51Service = new ProductionGP51Service();
    const authResult = await gp51Service.authenticate(username, password);

    if (authResult.status !== 0) {
      console.error('❌ GP51 authentication failed:', authResult.cause);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: authResult.cause || 'Authentication failed' 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user data from local database
    const { data: envioUser, error: userError } = await supabase
      .from('envio_users')
      .select('*')
      .eq('gp51_username', username)
      .single();

    if (userError) {
      console.error('❌ User not found in local database:', userError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User not found' 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch user devices from GP51
    console.log('🚗 Fetching user devices...');
    const devices = await gp51Service.fetchAllDevices();

    console.log('✅ Authentication successful');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: envioUser.id,
          username: envioUser.gp51_username,
          name: envioUser.name,
          email: envioUser.email,
          phone: envioUser.phone_number,
          companyName: envioUser.city // Using city field for company
        },
        session: {
          token: authResult.token,
          expires_at: authResult.expires_at
        },
        devices: devices.map(device => ({
          deviceId: device.deviceid,
          deviceName: device.devicename,
          deviceType: device.devicetype,
          status: device.status,
          lastActive: device.lastactivetime,
          simNumber: device.simnum
        }))
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Mobile authentication error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
