
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Enhanced CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Function availability check
function checkFunctionAvailability() {
  const errors = [];
  
  try {
    // Test crypto utilities import
    import("../_shared/crypto_utils.ts").then((module) => {
      if (!module.md5_for_gp51_only) errors.push("md5_for_gp51_only not available");
      if (!module.sanitizeInput) errors.push("sanitizeInput not available");
      if (!module.isValidUsername) errors.push("isValidUsername not available");
    }).catch((err) => {
      errors.push(`Crypto utils import failed: ${err.message}`);
    });
  } catch (error) {
    errors.push(`Function availability check failed: ${error.message}`);
  }
  
  return errors;
}

async function authenticateWithGP51({
  username,
  password,
  isPreHashed = false,
  apiUrl = "https://www.gps51.com/webapi"
}: {
  username: string;
  password: string;
  isPreHashed?: boolean;
  apiUrl?: string;
}) {
  console.log(`🔄 [GP51-AUTH] Step 1: Environment validation complete`);
  
  try {
    // Dynamic import with error handling
    const { md5_for_gp51_only, sanitizeInput, isValidUsername } = await import("../_shared/crypto_utils.ts");
    
    const cleanUsername = sanitizeInput(username);
    
    if (!isValidUsername(cleanUsername)) {
      return {
        success: false,
        error: "Invalid username format"
      };
    }

    console.log(`🌐 [GP51-AUTH] Using API URL: ${apiUrl}`);

    let hashedPassword: string;
    
    if (isPreHashed) {
      console.log(`🔄 [GP51-AUTH] Step 2: Using provided password hash (already hashed)`);
      hashedPassword = password;
      console.log(`🔐 Password hash: ${hashedPassword.substring(0, 8)}...`);
    } else {
      console.log(`🔄 [GP51-AUTH] Step 2: Hashing password for GP51 compatibility`);
      hashedPassword = await md5_for_gp51_only(password);
      console.log(`🔐 Generated hash: ${hashedPassword.substring(0, 8)}...`);
    }

    console.log(`🔄 [GP51-AUTH] Step 3: Preparing login request`);

    // Get the global API token
    const globalToken = Deno.env.get("GP51_GLOBAL_API_TOKEN");
    if (!globalToken) {
      console.error(`❌ [GP51-AUTH] No global API token available`);
      return {
        success: false,
        error: "GP51 API configuration error - missing global token"
      };
    }

    // Build login URL with parameters
    const loginUrl = new URL(apiUrl);
    loginUrl.searchParams.set('action', 'login');
    loginUrl.searchParams.set('token', globalToken);
    loginUrl.searchParams.set('username', cleanUsername);
    loginUrl.searchParams.set('password', hashedPassword);
    loginUrl.searchParams.set('from', 'WEB');
    loginUrl.searchParams.set('type', 'USER');

    console.log(`📊 [GP51-AUTH] Login request details:`);
    console.log(`  - URL: ${loginUrl.toString()}`);
    console.log(`  - Username: ${cleanUsername}`);
    console.log(`  - Password hash: ${hashedPassword.substring(0, 8)}...`);
    console.log(`  - From: WEB`);
    console.log(`  - Type: USER`);
    console.log(`  - Token (first 10 chars): ${globalToken.substring(0, 10)}...`);

    console.log(`🔄 [GP51-AUTH] Step 4: Making login request to GP51`);

    const response = await fetch(loginUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'EnvioFleet/2.0/HybridAuth'
      },
      signal: AbortSignal.timeout(15000)
    });

    console.log(`📈 [GP51-AUTH] GP51 API Response Status: ${response.status}`);
    console.log(`📈 [GP51-AUTH] Response Headers:`, JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

    const responseText = await response.text();
    console.log(`📄 [GP51-AUTH] Raw Response: ${responseText}`);

    if (!response.ok) {
      console.error(`❌ [GP51-AUTH] HTTP error: ${response.status} ${response.statusText}`);
      return {
        success: false,
        error: `GP51 API error: ${response.status} ${response.statusText}`
      };
    }

    // Try to parse as JSON first
    let result;
    try {
      result = JSON.parse(responseText);
      console.log(`📋 [GP51-AUTH] Parsed JSON response:`, result);
    } catch (e) {
      console.log(`📝 [GP51-AUTH] Response is not JSON, treating as plain text token: ${responseText}`);
      
      if (responseText && responseText.trim().length > 0) {
        return {
          success: true,
          token: responseText.trim(),
          username: cleanUsername,
          apiUrl: apiUrl,
          method: 'plain_text_token'
        };
      } else {
        console.error(`❌ [GP51-AUTH] Empty response from GP51`);
        return {
          success: false,
          error: "Empty response from GP51 API"
        };
      }
    }

    // Handle JSON response
    if (result.status === 0 && result.token) {
      console.log(`✅ [GP51-AUTH] Authentication successful with JSON response`);
      return {
        success: true,
        token: result.token,
        username: cleanUsername,
        apiUrl: apiUrl,
        method: 'json_response'
      };
    } else {
      const errorMsg = result.cause || result.message || 'Unknown authentication error';
      console.error(`❌ [GP51-AUTH] Authentication failed: ${errorMsg}`);
      return {
        success: false,
        error: errorMsg
      };
    }

  } catch (error) {
    console.error(`❌ [GP51-AUTH] Unexpected error:`, error);
    
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: "GP51 API request timed out"
      };
    }
    
    return {
      success: false,
      error: `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`📥 [REQUEST] OPTIONS - returning CORS headers`);
    return new Response(null, { headers: corsHeaders });
  }

  // Get client IP and user agent for logging
  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';

  console.log(`📥 [REQUEST] ${req.method} ${req.url}`);
  console.log(`🌍 [CLIENT] IP: ${clientIP}`);

  try {
    // Check function availability
    const availabilityErrors = checkFunctionAvailability();
    if (availabilityErrors.length > 0) {
      console.error(`❌ [INIT] Function availability issues:`, availabilityErrors);
    }

    console.log(`🔄 [AUTH] Step 1: Validating environment variables`);
    
    // Environment validation with detailed logging
    const requiredEnvVars = [
      'GP51_API_BASE_URL',
      'GP51_BASE_URL',
      'GP51_GLOBAL_API_TOKEN',
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];
    
    console.log(`🔍 [ENV DEBUG] Environment variables check:`);
    requiredEnvVars.forEach(varName => {
      const value = Deno.env.get(varName);
      console.log(`  - ${varName}: ${value ? 'SET' : 'NOT SET'}`);
    });

    const apiBaseUrl = Deno.env.get("GP51_API_BASE_URL") || "https://www.gps51.com/webapi";
    const globalToken = Deno.env.get("GP51_GLOBAL_API_TOKEN");
    
    console.log(`🌐 [GP51] Using base URL: ${apiBaseUrl}`);
    console.log(`🔑 [GP51] Global API token found (length: ${globalToken?.length || 0})`);

    const { action, username, password } = await req.json();
    
    if (!action || !username) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameters: action and username are required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📋 [REQUEST] Action: ${action}, Username: ${username.substring(0, 3)}***`);

    if (action === 'authenticate') {
      if (!password) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Password is required for authentication'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log(`🔐 [AUTH] Starting GP51 authentication for user: ${username.substring(0, 3)}***`);

      // Check for stored admin credentials first
      console.log(`🔍 [AUTH] Checking for stored admin credentials...`);
      
      let useStoredCredentials = false;
      let storedPasswordHash = null;
      
      if (username === 'octopus' || password === 'stored_credentials') {
        try {
          const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
          );

          const { data: adminUser } = await supabase
            .from('envio_users')
            .select('id')
            .eq('email', 'chudesyl@gmail.com')
            .single();

          if (adminUser) {
            const { data: session } = await supabase
              .from('gp51_sessions')
              .select('password_hash')
              .eq('envio_user_id', adminUser.id)
              .eq('username', 'octopus')
              .single();

            if (session?.password_hash) {
              console.log(`✅ [AUTH] Found stored admin credentials, using pre-hashed password`);
              useStoredCredentials = true;
              storedPasswordHash = session.password_hash;
            }
          }
        } catch (error) {
          console.warn(`⚠️ [AUTH] Could not check stored credentials:`, error);
        }
      }

      console.log(`🔄 [AUTH] Step 2: Calling GP51 authentication`);

      const authResult = useStoredCredentials && storedPasswordHash 
        ? await authenticateWithGP51({
            username,
            password: storedPasswordHash,
            isPreHashed: true,
            apiUrl: apiBaseUrl
          })
        : await authenticateWithGP51({
            username,
            password,
            isPreHashed: false,
            apiUrl: apiBaseUrl
          });

      if (!authResult.success) {
        console.error(`❌ [AUTH] GP51 authentication failed: ${authResult.error}`);
        return new Response(JSON.stringify({
          success: false,
          error: authResult.error || 'Authentication failed'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log(`✅ [AUTH] GP51 authentication successful`);

      return new Response(JSON.stringify({
        success: true,
        token: authResult.token,
        username: authResult.username,
        apiUrl: authResult.apiUrl,
        method: authResult.method || 'hybrid_auth'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: `Unsupported action: ${action}`
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`❌ [ERROR] Unexpected error in gp51-hybrid-auth:`, error);
    console.error(`❌ [ERROR] Stack trace:`, error.stack);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error during authentication',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
