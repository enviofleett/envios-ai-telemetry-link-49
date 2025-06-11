
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GP51_API_URL = "https://www.gps51.com/webapi";
const REQUEST_TIMEOUT = 5000;

// MD5 hash function for password hashing
async function md5(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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

    // Step 1: Check for valid GP51 session
    const { data: sessions, error: sessionError } = await supabase
      .from("gp51_sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);

    if (sessionError || !sessions || sessions.length === 0) {
      console.error("❌ No GP51 sessions found:", sessionError);
      return new Response(JSON.stringify({
        success: false,
        error: "No GP51 sessions found",
        code: "NO_SESSION",
        recommendation: "Please configure GP51 credentials first"
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const session = sessions[0];
    const { username, gp51_password } = session;

    // Step 2: Check session expiry
    const expiresAt = new Date(session.token_expires_at);
    const now = new Date();

    if (expiresAt <= now) {
      console.error("⏰ GP51 session expired");
      return new Response(JSON.stringify({
        success: false,
        error: "GP51 session expired",
        code: "SESSION_EXPIRED",
        recommendation: "Please re-authenticate with GP51"
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 3: Test actual GP51 API connectivity
    console.log('🌐 Testing GP51 API connectivity...');
    const startTime = Date.now();
    
    try {
      const hashedPassword = await md5(gp51_password);
      
      const formData = new URLSearchParams({
        action: 'login',
        username: username,
        password: hashedPassword,
        from: 'WEB',
        type: 'USER'
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch(GP51_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'User-Agent': 'EnvioFleet/1.0'
        },
        body: formData.toString(),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        console.error(`❌ HTTP error: ${response.status} ${response.statusText}`);
        return new Response(JSON.stringify({
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          code: "HTTP_ERROR",
          responseTime,
          recommendation: "Check GP51 service availability"
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const text = await response.text();
      console.log('📊 GP51 API response:', text.substring(0, 200) + '...');

      let result;
      try {
        result = JSON.parse(text);
      } catch (jsonError) {
        console.error('❌ Invalid JSON response:', jsonError);
        return new Response(JSON.stringify({
          success: false,
          error: "Invalid response format from GP51",
          code: "INVALID_JSON",
          responseTime,
          recommendation: "GP51 API may be experiencing issues"
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Step 4: Validate GP51 response
      if (result.status === 0) {
        console.log('✅ GP51 connection test successful');
        return new Response(JSON.stringify({
          success: true,
          message: "GP51 connection healthy",
          username: username,
          responseTime,
          apiEndpoint: GP51_API_URL,
          sessionExpiresAt: session.token_expires_at
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        console.error(`❌ GP51 API error: ${result.cause || result.message}`);
        return new Response(JSON.stringify({
          success: false,
          error: result.cause || result.message || "GP51 authentication failed",
          code: "GP51_AUTH_ERROR",
          responseTime,
          recommendation: "Check GP51 credentials or account status"
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

    } catch (apiError) {
      const responseTime = Date.now() - startTime;
      console.error('❌ GP51 API connectivity failed:', apiError);
      
      return new Response(JSON.stringify({
        success: false,
        error: apiError.name === 'AbortError' ? 'Request timeout' : 'Network connectivity failed',
        code: apiError.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR',
        responseTime,
        recommendation: "Check internet connectivity or GP51 service status"
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error("💥 Connection check failed:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "Connection check failed",
      details: error instanceof Error ? error.message : 'Unknown error',
      code: "INTERNAL_ERROR"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
