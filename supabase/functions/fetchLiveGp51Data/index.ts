
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to detect HTML responses
function isHtmlResponse(text: string): boolean {
  const trimmedText = text.trim().toLowerCase();
  return trimmedText.startsWith('<!doctype') || 
         trimmedText.startsWith('<html') || 
         trimmedText.includes('<html>');
}

// Helper function to extract error from HTML
function extractHtmlError(htmlText: string): string {
  try {
    // Try to extract title or error message from HTML
    const titleMatch = htmlText.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      return `HTML Error Page: ${titleMatch[1]}`;
    }
    
    // Look for common error patterns
    const errorPatterns = [
      /<h1[^>]*>([^<]+)<\/h1>/i,
      /<div[^>]*class[^>]*error[^>]*>([^<]+)<\/div>/i,
      /<p[^>]*>([^<]*error[^<]*)<\/p>/i
    ];
    
    for (const pattern of errorPatterns) {
      const match = htmlText.match(pattern);
      if (match) {
        return `HTML Error: ${match[1].trim()}`;
      }
    }
    
    return `HTML Error Page received (${htmlText.length} characters)`;
  } catch (error) {
    return `HTML Error Page received (parsing failed)`;
  }
}

// Enhanced GP51 API call with multiple format support
async function makeGP51ApiCall(apiUrl: string, token: string, action: string, params: Record<string, any> = {}): Promise<any> {
  const formats = [
    {
      name: "Format 1: Action in URL, Token in JSON body",
      url: `${apiUrl}?action=${action}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "EnvioFleet/1.0"
      },
      body: JSON.stringify({ token, username: "octopus", ...params })
    },
    {
      name: "Format 2: Token as URL parameter",
      url: `${apiUrl}?action=${action}&token=${token}&username=octopus&${new URLSearchParams(params)}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "EnvioFleet/1.0"
      },
      body: JSON.stringify({})
    }
  ];

  let lastError = null;

  for (const format of formats) {
    try {
      console.log(`🧪 [GP51Client] Trying ${format.name}`);
      console.log(`📤 [GP51Client] URL: ${format.url}`);
      console.log(`📤 [GP51Client] Method: ${format.method}`);
      console.log(`📤 [GP51Client] Headers:`, JSON.stringify(format.headers, null, 2));
      console.log(`📤 [GP51Client] Body: ${format.body}`);

      const response = await fetch(format.url, {
        method: format.method,
        headers: format.headers,
        body: format.body,
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      console.log(`📊 [GP51Client] Response status: ${response.status}`);
      console.log(`📊 [GP51Client] Response headers:`, JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

      const responseText = await response.text();
      console.log(`📊 [GP51Client] ${format.name} response received, length: ${responseText.length}`);
      
      // Check for HTML response
      if (isHtmlResponse(responseText)) {
        const errorMsg = extractHtmlError(responseText);
        console.error(`❌ [GP51Client] ${format.name} returned HTML instead of JSON: ${errorMsg}`);
        console.error(`📄 [GP51Client] HTML Response preview: ${responseText.substring(0, 500)}...`);
        lastError = new Error(`${format.name} returned HTML: ${errorMsg}`);
        continue;
      }

      // Check content type
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json') && !contentType.includes('text/json')) {
        console.warn(`⚠️ [GP51Client] Unexpected content-type: ${contentType}`);
      }

      console.log(`📊 [GP51Client] Raw response: ${responseText}`);

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`❌ [GP51Client] JSON parsing failed for ${format.name}:`, parseError);
        console.error(`📄 [GP51Client] Response text that failed to parse: ${responseText.substring(0, 1000)}...`);
        lastError = new Error(`${format.name} JSON parsing failed: ${parseError.message}`);
        continue;
      }

      console.log(`📋 [GP51Client] Parsed response for ${format.name}:`, JSON.stringify(parsedResponse, null, 2));

      // Check for API-level errors
      if (parsedResponse.status !== 0 && parsedResponse.status !== undefined) {
        console.error(`❌ [GP51Client] ${format.name} failed with status ${parsedResponse.status}: ${parsedResponse.cause || 'Unknown error'}`);
        lastError = new Error(`${format.name} API error: ${parsedResponse.status} - ${parsedResponse.cause || 'Unknown error'}`);
        continue;
      }

      console.log(`✅ [GP51Client] ${format.name} successful!`);
      return parsedResponse;

    } catch (error) {
      console.error(`❌ [GP51Client] ${format.name} failed with exception:`, error);
      lastError = error;
      continue;
    }
  }

  throw lastError || new Error('All GP51 API call formats failed');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting Enhanced GP51 Live Data Import with improved debugging...');
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { forceFullSync = false, deviceids = '' } = await req.json().catch(() => ({}));

    // Get GP51 credentials from gp51_sessions table
    const { data: sessionData, error: sessionError } = await supabase
      .from('gp51_sessions')
      .select('username, gp51_token, api_url, token_expires_at')
      .eq('username', 'octopus')
      .single();

    if (sessionError || !sessionData) {
      console.error('❌ No GP51 credentials found:', sessionError);
      return new Response(JSON.stringify({
        success: false,
        error: 'GP51 credentials not found for octopus user'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Found GP51 session for user:', sessionData.username);

    const apiUrl = sessionData.api_url || 'https://www.gps51.com/webapi';
    const token = sessionData.gp51_token;

    // Enhanced token validation
    if (!token || token === 'pending_authentication') {
      return new Response(JSON.stringify({
        success: false,
        error: 'GP51 token not available or pending authentication'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check token expiry
    if (sessionData.token_expires_at) {
      const expiresAt = new Date(sessionData.token_expires_at);
      const now = new Date();
      if (expiresAt <= now) {
        console.error('❌ GP51 token has expired:', expiresAt);
        return new Response(JSON.stringify({
          success: false,
          error: 'GP51 token has expired'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const timeUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);
      console.log(`🔑 Token expires in ${timeUntilExpiry} seconds`);
    }

    console.log(`🔑 Using token: ${token.substring(0, 8)}... (length: ${token.length})`);

    let devices = [];
    let positions = [];
    let syncType = forceFullSync ? 'fullSync' : 'batchedUpdate';

    if (forceFullSync || !deviceids) {
      // Get device list using the correct action (querymonitorlist instead of devicelist)
      console.log('📱 Fetching device list using querymonitorlist action...');
      
      const deviceResult = await makeGP51ApiCall(apiUrl, token, 'querymonitorlist');

      if (deviceResult.status === 0 && deviceResult.groups) {
        // Parse devices from groups structure (as shown in working logs)
        devices = [];
        for (const group of deviceResult.groups) {
          if (group.devices && Array.isArray(group.devices)) {
            for (const device of group.devices) {
              devices.push({
                gp51_device_id: String(device.deviceid),
                name: device.devicename || `Device ${device.deviceid}`,
                sim_number: device.simnum || null,
                last_position: null
              });
            }
          }
        }
        console.log(`✅ Retrieved ${devices.length} devices from ${deviceResult.groups.length} groups`);
      } else {
        console.error('❌ Failed to retrieve devices:', deviceResult);
        throw new Error(`Device list fetch failed: ${deviceResult.cause || 'Unknown error'}`);
      }

      // Get positions for all devices
      if (devices.length > 0) {
        console.log('📍 Fetching positions...');
        const deviceIds = devices.map(d => d.gp51_device_id).join(',');
        
        try {
          const positionResult = await makeGP51ApiCall(apiUrl, token, 'lastposition', { deviceids: deviceIds });

          if (positionResult.status === 0 && positionResult.records) {
            positions = positionResult.records;
            console.log(`✅ Retrieved ${positions.length} positions`);
          } else {
            console.warn('⚠️ Position fetch failed, continuing without positions:', positionResult.cause);
            positions = [];
          }
        } catch (positionError) {
          console.warn('⚠️ Position fetch failed, continuing without positions:', positionError);
          positions = [];
        }
      }
    } else {
      // Batched update - get specific device positions
      console.log('📍 Fetching specific device positions...');
      
      try {
        const positionResult = await makeGP51ApiCall(apiUrl, token, 'lastposition', { deviceids });

        if (positionResult.status === 0 && positionResult.records) {
          positions = positionResult.records;
          console.log(`✅ Retrieved ${positions.length} positions for batched update`);
          syncType = 'batchedUpdate';
        } else {
          console.error('❌ Position fetch failed:', positionResult.cause);
          throw new Error(`Position fetch failed: ${positionResult.cause || 'Unknown error'}`);
        }
      } catch (positionError) {
        console.error('❌ Position fetch failed:', positionError);
        throw positionError;
      }
    }

    // Return structured data for processing
    const responseData = {
      success: true,
      data: {
        type: syncType,
        devices: devices,
        positions: positions,
        statistics: {
          totalDevices: devices.length,
          totalPositions: positions.length,
          responseTime: Date.now()
        },
        metadata: {
          fetchedAt: new Date().toISOString(),
          source: 'GP51',
          syncType: syncType,
          tokenExpiresAt: sessionData.token_expires_at
        }
      }
    };

    console.log(`✅ Data fetch complete: ${syncType} with ${devices.length} devices and ${positions.length} positions`);

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ GP51 data fetch failed:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      details: {
        errorType: error.constructor.name,
        timestamp: new Date().toISOString()
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
