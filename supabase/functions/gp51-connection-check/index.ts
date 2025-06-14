
// Trigger re-deploy - 2025-06-14
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { md5_sync } from "../_shared/crypto_utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GP51_API_URL = "https://www.gps51.com/webapi";
const REQUEST_TIMEOUT = 5000;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 GP51 Connection Check: Starting comprehensive test...');

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Step 1: Check for valid GP51 session - FIXED: Using correct column name
    const { data: sessionData, error: sessionError } = await supabase
      .from("gp51_sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessionError) {
      console.error("❌ Database error fetching GP51 session:", sessionError.message);
      return new Response(JSON.stringify({
        success: false,
        error: "Database error fetching GP51 session",
        code: "DB_SESSION_FETCH_ERROR",
        details: sessionError.message,
        recommendation: "Check database connectivity and gp51_sessions table."
      }), {
        status: 500, // Internal server error for DB issues
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (!sessionData) {
      console.log("🟡 No GP51 sessions found in database.");
      return new Response(JSON.stringify({
        success: false, // Consistently use false for unsuccessful checks
        error: "No GP51 sessions found in database.",
        code: "NO_SESSION_IN_DB",
        recommendation: "Please configure GP51 credentials and ensure a session is stored."
      }), {
        status: 200, // Return 200 as the check itself was successful, but connection state is 'not configured'
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const session = sessionData; // Use the fetched session data
    const { username, password_hash, token_expires_at } = session;

    if (!username || !password_hash) {
        console.error("❌ Session data is incomplete (missing username or password_hash).");
        return new Response(JSON.stringify({
            success: false,
            error: "Incomplete session data in database.",
            code: "INCOMPLETE_SESSION_DATA",
            recommendation: "Ensure 'username' and 'password_hash' are stored in 'gp51_sessions'."
        }), {
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Step 2: Check session expiry (if token_expires_at is present)
    if (token_expires_at) {
        const expiresAt = new Date(token_expires_at);
        const now = new Date();

        if (expiresAt <= now) {
        console.warn("⏰ GP51 session from database is expired.");
        return new Response(JSON.stringify({
            success: false,
            error: "GP51 session from database is expired.",
            code: "DB_SESSION_EXPIRED",
            username: username, // Include username for context
            sessionExpiresAt: token_expires_at,
            recommendation: "Please re-authenticate with GP51 to refresh the session."
        }), {
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
        }
    } else {
        console.warn("🤔 GP51 session has no 'token_expires_at' field. Expiry check skipped.");
    }

    // Step 3: Test actual GP51 API connectivity using stored credentials
    console.log(`🌐 Testing GP51 API connectivity for user: ${username}...`);
    const startTime = Date.now();
    
    try {
      const hashedPassword = md5_sync(password_hash); // Use md5_sync with the stored password_hash
      
      const formData = new URLSearchParams({
        action: 'login', // Use 'login' action to test credentials
        username: username,
        password: hashedPassword, 
        from: 'WEB', // Standard parameter
        type: 'USER'  // Standard parameter
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch(GP51_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json', // Expect JSON response
          'User-Agent': 'EnvioFleet/1.0/ConnectionCheck' // Specific user agent
        },
        body: formData.toString(),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        console.error(`❌ GP51 API HTTP error: ${response.status} ${response.statusText}`);
        // Try to parse error from GP51 if possible
        let errorDetails = `HTTP ${response.status}: ${response.statusText}`;
        try {
            const errorJson = await response.json();
            errorDetails = errorJson.cause || errorJson.message || errorDetails;
        } catch (e) { /* ignore if not json */ }

        return new Response(JSON.stringify({
          success: false,
          error: `GP51 API request failed: ${errorDetails}`,
          code: `GP51_HTTP_ERROR_${response.status}`,
          responseTime,
          username: username,
          recommendation: "Check GP51 service availability and network."
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const text = await response.text();
      console.log('📊 Raw GP51 API response:', text.substring(0, 200) + (text.length > 200 ? '...' : ''));

      let result;
      try {
        result = JSON.parse(text);
      } catch (jsonError) {
        console.error('❌ Invalid JSON response from GP51:', jsonError.message, text.substring(0,200));
        return new Response(JSON.stringify({
          success: false,
          error: "Invalid JSON response from GP51 API.",
          code: "GP51_INVALID_JSON",
          responseTime,
          username: username,
          rawResponsePreview: text.substring(0,200),
          recommendation: "GP51 API might be having issues or returned unexpected format."
        }), {
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Step 4: Validate GP51 response (status: 0 usually means success for GP51)
      if (result.status === 0 && result.token) { // Check for success status and token
        console.log('✅ GP51 connection test successful.');
        return new Response(JSON.stringify({
          success: true,
          message: "GP51 connection healthy and authentication successful.",
          username: username,
          responseTime,
          apiEndpoint: GP51_API_URL,
          sessionExpiresAt: token_expires_at || "Not set in DB", // Include DB session expiry
          gp51TokenPreview: result.token.substring(0, 5) + "..." // Preview of new token
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        const gp51ErrorMsg = result.cause || result.message || "GP51 authentication failed or unknown API error.";
        console.error(`❌ GP51 API returned an error status: ${result.status}, Message: ${gp51ErrorMsg}`);
        return new Response(JSON.stringify({
          success: false,
          error: gp51ErrorMsg,
          code: result.status === -6 ? "GP51_INVALID_CREDENTIALS" : `GP51_API_ERROR_${result.status}`, // Example: -6 is often invalid user/pass
          responseTime,
          username: username,
          gp51ApiStatus: result.status,
          recommendation: "Check GP51 credentials stored in the database or GP51 account status."
        }), {
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

    } catch (apiError) {
      const responseTime = Date.now() - startTime;
      console.error('❌ GP51 API connectivity test failed:', apiError.message);
      
      const errorCode = apiError.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR';
      const errorMessage = apiError.name === 'AbortError' ? 'Request to GP51 API timed out.' : 'Network connectivity failed or GP51 API unreachable.';
      
      return new Response(JSON.stringify({
        success: false,
        error: errorMessage,
        code: errorCode,
        responseTime: responseTime, // Include responseTime even on error
        username: username, // Include username for context
        details: apiError.message,
        recommendation: "Check internet connectivity, DNS, or GP51 service status (gps51.com)."
      }), {
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error("💥 Overall connection check function failed:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "Internal error during connection check process.",
      details: error instanceof Error ? error.message : 'Unknown error',
      code: "INTERNAL_FUNCTION_ERROR"
    }), {
      status: 500, // Use 500 for unhandled internal errors of the function itself
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
