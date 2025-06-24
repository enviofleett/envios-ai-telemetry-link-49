
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { gp51ApiClient } from '../_shared/gp51_api_client_unified.ts';
import { sanitizeInput, checkRateLimit } from '../_shared/crypto_utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportJob {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  created_at: string;
  progress?: number;
  error?: string;
}

interface ValidatedSession {
  id: string;
  envio_user_id: string;
  username: string;
  gp51_token: string; // This will be the actual token string, not JSON
  token_expires_at: string;
  created_at: string;
  last_validated_at?: string;
  auth_method?: string;
  api_url?: string;
}

async function getGP51Session(): Promise<ValidatedSession> {
  console.log('🔍 Starting GP51 session validation...');
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { data: sessions, error } = await supabase
    .from('gp51_sessions')
    .select('*')
    .gt('token_expires_at', new Date().toISOString())
    .order('last_validated_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('❌ Database error fetching GP51 sessions:', error);
    throw new Error(`Failed to retrieve GP51 session: ${error.message}`);
  }

  if (!sessions || sessions.length === 0) {
    console.error('📝 No valid GP51 sessions found in database');
    throw new Error('No valid GP51 session found. Please authenticate with GP51 first.');
  }

  const rawSession = sessions[0];
  console.log(`📋 Found GP51 session for user: ${rawSession.username}`);
  console.log(`🔍 Raw gp51_token field type: ${typeof rawSession.gp51_token}`);
  console.log(`🔍 Raw gp51_token content: ${JSON.stringify(rawSession.gp51_token)}`);

  // Parse and validate the GP51 token
  let actualToken: string;
  let tokenValidationStatus: any;

  try {
    if (typeof rawSession.gp51_token === 'string') {
      // Try to parse as JSON first
      try {
        const parsedToken = JSON.parse(rawSession.gp51_token);
        console.log(`🔍 Parsed token as JSON:`, parsedToken);
        
        // Validate the parsed token structure
        if (typeof parsedToken === 'object' && parsedToken !== null) {
          if (parsedToken.status !== undefined && parsedToken.token !== undefined) {
            tokenValidationStatus = parsedToken;
            
            // Check if authentication was successful
            if (parsedToken.status !== 0) {
              console.error(`❌ GP51 authentication failed with status: ${parsedToken.status}`);
              console.error(`❌ Error cause: ${parsedToken.cause || 'Unknown error'}`);
              throw new Error(`GP51 authentication failed: ${parsedToken.cause || `Status ${parsedToken.status}`}`);
            }
            
            // Check if token is present and valid
            if (!parsedToken.token || parsedToken.token === null || parsedToken.token.trim() === '') {
              console.error('❌ GP51 token is null or empty in the parsed object');
              throw new Error('GP51 authentication failed: No valid token received from GP51 API');
            }
            
            actualToken = parsedToken.token.trim();
            console.log(`✅ Successfully extracted token from JSON: ${actualToken.substring(0, 8)}...`);
          } else {
            // Not a GP51 response object, treat as direct token
            console.log('🔍 JSON object does not contain GP51 response structure, treating as direct token');
            actualToken = rawSession.gp51_token;
          }
        } else {
          // Parsed value is not an object, treat as direct token
          actualToken = String(parsedToken);
        }
      } catch (parseError) {
        // Not valid JSON, treat as direct token string
        console.log('🔍 Token is not JSON, treating as direct token string');
        actualToken = rawSession.gp51_token.trim();
      }
    } else {
      // Token is not a string, convert to string
      console.log('🔍 Token is not a string, converting...');
      actualToken = String(rawSession.gp51_token);
    }

    // Final validation of the extracted token
    if (!actualToken || actualToken.length === 0) {
      console.error('❌ Final token validation failed: token is empty');
      throw new Error('GP51 session contains invalid or empty token');
    }

    // Basic token format validation (GP51 tokens are typically alphanumeric hashes)
    if (!/^[a-zA-Z0-9]+$/.test(actualToken)) {
      console.error(`❌ Token format validation failed: invalid characters in token`);
      throw new Error('GP51 token contains invalid characters');
    }

    if (actualToken.length < 16) {
      console.error(`❌ Token length validation failed: token too short (${actualToken.length} chars)`);
      throw new Error('GP51 token appears to be too short to be valid');
    }

    console.log(`✅ Token validation successful:`);
    console.log(`  - Length: ${actualToken.length} characters`);
    console.log(`  - Format: Valid alphanumeric`);
    console.log(`  - Preview: ${actualToken.substring(0, 8)}...`);
    
    // Update session with last validation timestamp
    await supabase
      .from('gp51_sessions')
      .update({
        last_validated_at: new Date().toISOString()
      })
      .eq('id', rawSession.id);

    console.log(`✅ Updated session validation timestamp`);

    // Return the validated session with the actual token string
    return {
      ...rawSession,
      gp51_token: actualToken
    };

  } catch (validationError) {
    console.error('❌ GP51 token validation failed:', validationError);
    
    // Log additional context for debugging
    console.error('🔍 Session context:', {
      sessionId: rawSession.id,
      username: rawSession.username,
      tokenType: typeof rawSession.gp51_token,
      tokenLength: rawSession.gp51_token ? String(rawSession.gp51_token).length : 0,
      expiresAt: rawSession.token_expires_at,
      authMethod: rawSession.auth_method
    });

    // If we have token validation status, include it in the error
    if (tokenValidationStatus) {
      throw new Error(
        `GP51 session validation failed: ${validationError.message}. ` +
        `Original authentication status: ${tokenValidationStatus.status}, ` +
        `cause: ${tokenValidationStatus.cause || 'Unknown'}`
      );
    }

    throw new Error(`GP51 session validation failed: ${validationError.message}`);
  }
}

async function fetchAvailableData() {
  console.log('🔍 Fetching GP51 import preview...');
  
  try {
    // Get and validate the GP51 session
    const session = await getGP51Session();
    
    console.log(`✅ Using validated GP51 session for user: ${session.username}`);
    console.log(`🔑 Token preview: ${session.gp51_token.substring(0, 8)}...`);

    // Create import job record
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const importJob: ImportJob = {
      id: crypto.randomUUID(),
      status: 'pending',
      created_at: new Date().toISOString()
    };

    console.log(`📝 Created import job: ${importJob.id}`);

    // Use the validated token with GP51 API client
    console.log('📡 Fetching data from GP51 using querymonitorlist action...');
    
    gp51ApiClient.setToken(session.gp51_token);
    const result = await gp51ApiClient.queryMonitorList(session.gp51_token, session.username);
    
    if (!result || result.status !== 0) {
      console.error('❌ GP51 API call failed:', result);
      throw new Error(`GP51 API error: ${result?.cause || 'Unknown error'}`);
    }

    // Process the response data
    const devices = [];
    if (result.groups && Array.isArray(result.groups)) {
      for (const group of result.groups) {
        if (group.devices && Array.isArray(group.devices)) {
          devices.push(...group.devices);
        }
      }
    }

    console.log(`✅ Successfully fetched ${devices.length} devices from GP51`);

    return {
      success: true,
      data: {
        summary: {
          users: 0, // GP51 monitor list doesn't include users
          vehicles: devices.length
        },
        devices: devices.slice(0, 10), // Preview first 10 devices
        totalDevices: devices.length
      },
      connectionStatus: {
        connected: true,
        username: session.username
      }
    };

  } catch (error) {
    console.error('❌ Data fetch error:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  
  // Rate limiting
  if (!checkRateLimit(clientIP, 10, 60 * 1000)) { // 10 requests per minute
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Too many requests. Please try again later.' 
    }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    console.log('🚀 Enhanced Bulk Import: POST', req.url);
    
    const body = await req.json();
    const { action } = body;
    
    console.log(`📋 Processing action: ${action}`);

    switch (action) {
      case 'fetch_available_data':
        const data = await fetchAvailableData();
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      default:
        return new Response(JSON.stringify({
          success: false,
          error: `Unknown action: ${action}`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    console.error('❌ Enhanced bulk import error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Import operation failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
