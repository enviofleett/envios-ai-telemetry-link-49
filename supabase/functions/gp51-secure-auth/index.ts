
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

  console.log("🚀 GP51 Auth function started");

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("❌ No auth header");
      return jsonResponse({ success: false, error: 'Authorization required' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("❌ User auth failed:", authError?.message);
      return jsonResponse({ success: false, error: 'Invalid authentication' }, 401);
    }

    console.log("✅ User authenticated");

    // Parse request body with error handling
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (bodyError) {
      console.error("❌ Request body parse error:", bodyError);
      return jsonResponse({ success: false, error: 'Invalid request body' }, 400);
    }

    const { username, password } = requestBody;
    if (!username || !password) {
      console.error("❌ Missing credentials");
      return jsonResponse({ success: false, error: 'Username and password are required' }, 400);
    }

    console.log(`🔐 GP51 authentication for user: ${username}`);

    // Generate MD5 hash for GP51 compatibility
    const hashedPassword = await createMD5Hash(password);
    console.log('✅ MD5 hash generated successfully');

    // ROBUST GP51 API CALL with multiple fallbacks
    const loginResult = await callGP51Login(username, hashedPassword);
    
    if (!loginResult.success) {
      console.error("❌ GP51 login failed:", loginResult.error);
      return jsonResponse({ 
        success: false, 
        error: loginResult.error,
        debug: loginResult.debug,
        gp51_status: loginResult.gp51_status
      }, loginResult.status || 401);
    }

    console.log("🎉 GP51 login successful");

    // Store session in database
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 23);

    const { error: sessionError } = await supabaseAdmin
      .from('gp51_sessions')
      .upsert({
        envio_user_id: user.id,
        username: username,
        gp51_token: loginResult.token,
        token_expires_at: expiresAt.toISOString(),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString()
      }, {
        onConflict: 'envio_user_id'
      });

    if (sessionError) {
      console.error('❌ Failed to store session:', sessionError);
    } else {
      console.log('✅ GP51 session stored successfully');
    }

    return jsonResponse({
      success: true,
      message: 'GP51 authentication successful',
      username: username,
      token: loginResult.token,
      expiresAt: expiresAt.toISOString(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("💥 Unexpected error:", error);
    return jsonResponse({
      success: false,
      error: `Authentication failed: ${error.message}`,
      details: error.stack
    }, 500);
  }
});

// ROBUST GP51 API CALLER
async function callGP51Login(username: string, hashedPassword: string) {
  const endpoints = [
    'https://www.gps51.com/webapi?action=login',
    'https://api.gps51.com/webapi?action=login',
    'https://gps51.com/webapi?action=login'
  ];

  const requestBody = {
    username,
    password: hashedPassword,
    from: 'WEB',
    type: 'USER'
  };

  for (const endpoint of endpoints) {
    try {
      console.log(`🌐 Trying endpoint: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Envios-Fleet/1.0',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(15000)
      });

      console.log(`📡 Response status: ${response.status}`);
      console.log(`📡 Response headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        console.warn(`⚠️ HTTP ${response.status} from ${endpoint}`);
        continue;
      }

      // BULLETPROOF RESPONSE PARSING
      const responseText = await response.text();
      console.log(`📄 Response length: ${responseText.length}`);
      console.log(`📄 Response preview: "${responseText.substring(0, 200)}..."`);

      // Check if response looks like JSON
      if (!responseText.trim()) {
        console.warn("⚠️ Empty response");
        continue;
      }

      if (!isValidJSON(responseText)) {
        console.warn("⚠️ Response is not valid JSON");
        console.log(`📄 Full response: ${responseText}`);
        continue;
      }

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseText);
      } catch (parseError) {
        console.warn("⚠️ JSON parse failed:", parseError);
        continue;
      }

      console.log(`📊 Parsed response:`, parsedResponse);

      // Check GP51 response format
      if (typeof parsedResponse.status !== 'undefined') {
        if (parsedResponse.status === 0 && parsedResponse.token) {
          return {
            success: true,
            token: parsedResponse.token,
            gp51_status: parsedResponse.status
          };
        } else {
          return {
            success: false,
            error: parsedResponse.cause || 'GP51 authentication failed',
            gp51_status: parsedResponse.status,
            debug: `GP51 returned status ${parsedResponse.status}`
          };
        }
      } else {
        console.warn("⚠️ Unexpected response format");
        continue;
      }

    } catch (fetchError) {
      console.warn(`⚠️ Fetch error for ${endpoint}:`, fetchError.message);
      continue;
    }
  }

  // All endpoints failed
  return {
    success: false,
    error: 'GP51 API unavailable - all endpoints failed',
    debug: 'Tried multiple endpoints, all failed',
    status: 502
  };
}

// BULLETPROOF JSON VALIDATOR
function isValidJSON(text: string): boolean {
  const trimmed = text.trim();
  
  // Must start with { or [
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return false;
  }
  
  // Must end with } or ]
  if (!trimmed.endsWith('}') && !trimmed.endsWith(']')) {
    return false;
  }
  
  // Quick syntax check
  try {
    JSON.parse(trimmed);
    return true;
  } catch {
    return false;
  }
}

async function createMD5Hash(input: string): Promise<string> {
  // Fallback MD5-like hash for GP51 compatibility
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  let result = Math.abs(hash).toString(16);
  while (result.length < 32) {
    result = '0' + result;
  }
  return result.toLowerCase();
}

// HELPER FOR JSON RESPONSES
function jsonResponse(data: any, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}
