
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

    const { username, password, deviceIds } = await req.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Authentication required' 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Authenticate with GP51
    console.log('🔐 Authenticating for position updates...');
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

    // Get latest positions from GP51
    console.log('📍 Fetching latest positions...');
    const positions = await gp51Service.getLastPositions(deviceIds);

    // Also get positions from local database for comparison
    const { data: localPositions, error: localError } = await supabase
      .from('live_positions')
      .select('*')
      .in('device_id', deviceIds || [])
      .order('position_timestamp', { ascending: false });

    if (localError) {
      console.warn('⚠️ Warning: Could not fetch local positions:', localError);
    }

    console.log('✅ Position data retrieved successfully');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        positions: positions.map(pos => ({
          deviceId: pos.deviceid,
          latitude: pos.callat || pos.lat,
          longitude: pos.callon || pos.lon,
          speed: pos.speed || 0,
          course: pos.course || 0,
          timestamp: pos.updatetime || pos.devicetime,
          status: pos.status,
          statusText: pos.strstatus,
          isMoving: pos.moving === 1,
          address: pos.address || '',
          accuracy: pos.radius || 0
        })),
        localCount: localPositions?.length || 0,
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Mobile position fetch error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to fetch positions' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
