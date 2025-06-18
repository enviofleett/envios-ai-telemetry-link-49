
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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
    console.log('🚀 GP51 Live Data Fetch function called');
    console.log('📡 Starting live vehicle position data fetch from GP51...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Step 1: Retrieve GP51 Token from gp51_sessions table
    console.log('1️⃣ Retrieving active GP51 session token...');
    
    const { data: gp51Sessions, error: sessionFetchError } = await supabase
      .from('gp51_sessions')
      .select('gp51_token, token_expires_at, username, envio_user_id')
      .order('created_at', { ascending: false })
      .limit(1);

    if (sessionFetchError) {
      console.error('❌ Database error fetching GP51 session:', sessionFetchError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to retrieve GP51 session from database',
          details: sessionFetchError.message
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!gp51Sessions || gp51Sessions.length === 0) {
      console.log('📝 No GP51 sessions found - GP51 not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'GP51 integration not configured. Please authenticate in admin settings.',
          code: 'NO_GP51_CONFIG'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const session = gp51Sessions[0];
    const expiresAt = new Date(session.token_expires_at);
    const now = new Date();

    if (expiresAt <= now) {
      console.error('❌ GP51 session expired:', { expiresAt, now });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'GP51 session expired. Please re-authenticate in admin settings.',
          code: 'SESSION_EXPIRED'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`✅ GP51 session token retrieved for user: ${session.username}`);
    console.log(`🔑 Token expires at: ${expiresAt.toISOString()}`);

    // Step 2: Call GP51 API to get position data using lastposition action
    console.log('2️⃣ Fetching live position data from GP51 API using lastposition...');
    
    const apiUrl = Deno.env.get('GP51_API_BASE_URL') || 'https://www.gps51.com/webapi';
    const requestUrl = `${apiUrl}?action=lastposition&token=${session.gp51_token}`;
    
    console.log(`📡 Making request to: ${apiUrl}?action=lastposition`);

    // Request body for lastposition - empty deviceids array means all devices
    const requestBody = {
      deviceids: [], // Empty array = all devices in account
      lastquerypositiontime: 0 // 0 for initial call
    };

    let gp51Response: any;
    try {
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'EnvioFleet/1.0'
        },
        body: JSON.stringify(requestBody)
      });

      // Enhanced debugging and error handling
      const responseText = await response.text();
      console.log(`📊 Response status: ${response.status}`);
      console.log(`📊 Response body length: ${responseText.length}`);
      console.log(`📊 Response body preview: ${responseText.substring(0, 500)}`);
      console.log(`📊 Response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}. Response: ${responseText}`);
      }

      // Check for known plain-text error messages before attempting JSON parse
      if (responseText.includes("action not found") || 
          responseText.includes("global_error_action") ||
          responseText.includes("error:") ||
          responseText.startsWith("error")) {
        console.error('❌ GP51 API returned plain text error:', responseText);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `GP51 API error: ${responseText}`,
            code: 'GP51_PLAIN_TEXT_ERROR'
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Check for empty response
      if (responseText.trim().length === 0) {
        console.error('❌ GP51 API returned empty response');
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'GP51 API returned empty response',
            code: 'EMPTY_RESPONSE'
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Attempt to parse JSON
      try {
        gp51Response = JSON.parse(responseText);
        console.log(`📊 GP51 API response status: ${gp51Response.status}`);
      } catch (parseError) {
        console.error('❌ Failed to parse GP51 API response as JSON:', parseError);
        console.error('❌ Raw response text:', responseText);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `GP51 API response is not valid JSON: ${parseError.message}`,
            rawResponse: responseText.substring(0, 1000), // Include first 1000 chars for debugging
            code: 'JSON_PARSE_ERROR'
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Validate GP51 response structure
      if (typeof gp51Response.status !== 'number') {
        console.error('❌ GP51 API response missing status field:', gp51Response);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'GP51 API response has invalid structure - missing status field',
            response: gp51Response
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      if (gp51Response.status !== 0) {
        console.error('❌ GP51 API returned error status:', gp51Response);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `GP51 API error: ${gp51Response.cause || 'Unknown error'}`,
            gp51Status: gp51Response.status,
            gp51Cause: gp51Response.cause
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

    } catch (apiError) {
      console.error('❌ Error calling GP51 API:', apiError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to fetch from GP51 API: ${apiError.message}`
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Step 3: Process and return the position data
    console.log('3️⃣ Processing GP51 position data...');
    
    const positionRecords = gp51Response.records || [];
    console.log(`📍 Total position records found: ${positionRecords.length}`);

    if (positionRecords.length === 0) {
      console.log('📝 No position records found in GP51 response');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No position data found in GP51 account',
          data: {
            total_positions: 0,
            total_devices: 0,
            positions: [],
            username: session.username,
            timestamp: new Date().toISOString(),
            lastquerypositiontime: gp51Response.lastquerypositiontime || 0
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Transform position data for consistent format
    const transformedPositions = positionRecords.map((record: any) => ({
      deviceid: record.deviceid,
      latitude: record.callat,
      longitude: record.callon,
      speed: record.speed || 0,
      course: record.course || 0,
      timestamp: new Date(record.updatetime * 1000).toISOString(),
      status: record.status || 0,
      statusText: record.strstatusen || record.strstatus || 'Unknown',
      altitude: record.altitude || 0,
      totaldistance: record.totaldistance || 0,
      moving: record.moving || 0,
      parktime: record.parktime || 0
    }));

    console.log(`✅ Successfully processed ${transformedPositions.length} position records`);

    // Step 4: Return success response with position data
    console.log('📊 Live position fetch completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: `Live position fetch completed successfully. Retrieved ${transformedPositions.length} position records.`,
        data: {
          total_positions: transformedPositions.length,
          total_devices: new Set(transformedPositions.map(p => p.deviceid)).size,
          positions: transformedPositions,
          username: session.username,
          timestamp: new Date().toISOString(),
          lastquerypositiontime: gp51Response.lastquerypositiontime || 0,
          fetched_at: new Date().toISOString()
        }
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('❌ Fatal error in GP51 Live Data Fetch:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Fatal fetch error: ${error.message}`,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
