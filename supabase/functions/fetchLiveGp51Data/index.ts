
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsonResponse, errorResponse } from "../_shared/response_utils.ts";

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
    console.log("🚀 Starting GP51 live data fetch operation...");
    
    // Initialize Supabase client with SERVICE ROLE KEY to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Missing Supabase configuration");
      return errorResponse("Supabase configuration missing", 500);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log("✅ Supabase client initialized with service role key");

    // Fetch GP51 sessions - should now work with service role permissions
    const { data: sessions, error: sessionError } = await supabase
      .from('gp51_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (sessionError) {
      console.error("❌ Database error fetching sessions:", sessionError);
      return errorResponse("Failed to fetch GP51 sessions", 500, sessionError.message);
    }

    if (!sessions || sessions.length === 0) {
      console.error("❌ No GP51 sessions found:", sessions);
      return errorResponse(
        "No GP51 sessions configured", 
        400, 
        "Please configure GP51 credentials in admin settings"
      );
    }

    const session = sessions[0];
    console.log(`✅ Found GP51 session for user: ${session.username}`);

    // Check if session is valid
    if (!session.gp51_token) {
      console.error("❌ Session missing token");
      return errorResponse("GP51 session invalid - missing token", 401);
    }

    // Check if session has expired
    if (session.token_expires_at) {
      const expiresAt = new Date(session.token_expires_at);
      const now = new Date();
      if (expiresAt <= now) {
        console.error("❌ Session expired:", { expiresAt, now });
        return errorResponse("GP51 session expired", 401);
      }
      console.log(`✅ Session valid until: ${expiresAt.toISOString()}`);
    }

    // Parse request body for force sync option
    const body = await req.json().catch(() => ({}));
    const forceFullSync = body.forceFullSync || false;
    
    console.log(`🔄 Starting ${forceFullSync ? 'full sync' : 'incremental sync'} with GP51...`);

    // Make request to GP51 API for position data
    const gp51ApiUrl = session.api_url || 'https://www.gps51.com/webapi';
    const gp51RequestBody = new URLSearchParams({
      action: 'querymonitorlist',
      session: session.gp51_token,
      username: session.username
    });

    console.log(`📡 Making GP51 API request to: ${gp51ApiUrl}`);
    console.log(`📝 Request parameters: action=querymonitorlist, username=${session.username}`);

    const gp51Response = await fetch(gp51ApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Envio-Fleet-Management/1.0'
      },
      body: gp51RequestBody.toString()
    });

    if (!gp51Response.ok) {
      console.error(`❌ GP51 API request failed: ${gp51Response.status} ${gp51Response.statusText}`);
      return errorResponse(`GP51 API request failed: ${gp51Response.status}`, gp51Response.status);
    }

    const gp51Data = await gp51Response.json();
    console.log("📊 GP51 API response received:", {
      hasGroups: !!gp51Data.groups,
      groupCount: gp51Data.groups?.length || 0
    });

    // Extract devices and positions from response
    const devices = gp51Data.groups?.flatMap((group: any) => group.devices || []) || [];
    const positions = devices.flatMap((device: any) => device.positions || []);

    console.log(`📈 Data summary: ${devices.length} devices, ${positions.length} positions`);

    // Determine sync type based on data volume and force flag
    const syncType = forceFullSync || devices.length > 100 ? 'fullSync' : 'batchedUpdate';
    
    const responseData = {
      type: syncType,
      devices: syncType === 'fullSync' ? devices : undefined,
      positions: positions,
      statistics: {
        totalDevices: devices.length,
        totalPositions: positions.length,
        responseTime: Date.now()
      },
      metadata: {
        fetchedAt: new Date().toISOString(),
        source: 'gp51-api',
        syncType: syncType,
        sessionUsername: session.username
      }
    };

    console.log(`✅ Successfully processed ${syncType} - returning data`);

    return jsonResponse({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error("💥 Critical error in fetchLiveGp51Data:", error);
    return errorResponse(
      `Internal server error: ${error.message}`, 
      500, 
      error.stack
    );
  }
});
