
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// MD5 hash function for consistency with auth
async function md5Hash(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32).toLowerCase();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log(`[${new Date().toISOString()}] GP51 Get Positions Request`);

    const body = await req.json();
    const { username, token, deviceIds, lastQueryTime = 0 } = body;
    
    if (!username || !token) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Username and token required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log(`📍 Fetching positions for ${deviceIds?.length || 'all'} devices`);

    // Build GP51 API URL for lastposition query
    const queryUrl = new URL('https://www.gps51.com/webapi');
    queryUrl.searchParams.set('action', 'lastposition');
    queryUrl.searchParams.set('token', token);
    
    if (deviceIds && deviceIds.length > 0) {
      queryUrl.searchParams.set('deviceids', deviceIds.join(','));
    }
    
    if (lastQueryTime) {
      queryUrl.searchParams.set('lastquerypositiontime', lastQueryTime.toString());
    }

    console.log('🌐 GP51 Position Query URL (sanitized):', queryUrl.toString().replace(token, '***'));

    const gp51Response = await fetch(queryUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FleetIQ-GP51-Integration/1.0'
      },
      signal: AbortSignal.timeout(15000) // 15 second timeout
    });

    console.log('📡 GP51 Position Response Status:', gp51Response.status);

    if (!gp51Response.ok) {
      throw new Error(`HTTP ${gp51Response.status}: ${gp51Response.statusText}`);
    }

    const responseText = await gp51Response.text();
    console.log('📄 Position Response Length:', responseText.length);

    if (!responseText) {
      throw new Error('Empty response from GP51');
    }

    let positionData;
    try {
      positionData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
    }

    console.log('📊 Position Data Status:', {
      status: positionData.status,
      cause: positionData.cause,
      recordCount: positionData.records?.length || 0
    });

    // Check API response status (0 = success)
    if (positionData.status !== 0) {
      console.error('❌ GP51 Position API Error:', positionData.cause);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `GP51 API Error: ${positionData.cause || 'Unknown error'}`,
          positions: []
        }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Process and validate position records
    const positions = (positionData.records || []).map(record => ({
      deviceid: record.deviceid,
      callat: parseFloat(record.callat || 0),
      callon: parseFloat(record.callon || 0),
      latitude: parseFloat(record.callat || 0),
      longitude: parseFloat(record.callon || 0),
      speed: parseFloat(record.speed || 0),
      course: parseFloat(record.course || 0),
      status: parseInt(record.status || 0),
      moving: parseInt(record.moving || 0),
      devicetime: record.devicetime || Date.now(),
      servertime: record.servertime || Date.now(),
      battery: record.battery || null,
      signal: record.signal || null,
      altitude: record.altitude || null,
      satellites: record.satellites || null
    }));

    // Filter out invalid positions
    const validPositions = positions.filter(pos => {
      const validLat = Math.abs(pos.callat) <= 90;
      const validLon = Math.abs(pos.callon) <= 180;
      const hasDeviceId = pos.deviceid && pos.deviceid.length > 0;
      return validLat && validLon && hasDeviceId;
    });

    console.log(`✅ Position fetch complete: ${validPositions.length} valid positions of ${positions.length} total`);

    return new Response(
      JSON.stringify({ 
        success: true,
        positions: validPositions,
        totalRecords: positions.length,
        validRecords: validPositions.length,
        lastQueryTime: positionData.lastquerypositiontime || Date.now(),
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('💥 Position Query Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: `Position query failed: ${error.message}`,
        positions: [],
        details: error.stack
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
