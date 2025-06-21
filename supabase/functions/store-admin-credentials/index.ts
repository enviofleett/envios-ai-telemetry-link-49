
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { md5_for_gp51_only } from "../_shared/crypto_utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔧 [STORE-ADMIN-CREDS] Processing credential storage request...');
    
    // Create Supabase client with service role (bypasses RLS)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { username, password } = await req.json();
    
    // Validate input
    if (!username || !password) {
      console.error('❌ [STORE-ADMIN-CREDS] Missing username or password');
      return new Response(JSON.stringify({
        success: false,
        error: 'Username and password are required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate that this is for the octopus admin account
    if (username !== 'octopus') {
      console.error('❌ [STORE-ADMIN-CREDS] Invalid username, only octopus allowed');
      return new Response(JSON.stringify({
        success: false,
        error: 'Only octopus account is supported for admin setup'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ [STORE-ADMIN-CREDS] Input validation passed');

    // Test the credentials with GP51 first
    console.log('🔍 [STORE-ADMIN-CREDS] Testing credentials with GP51...');
    
    const hashedPassword = await md5_for_gp51_only(password);
    console.log('✅ [STORE-ADMIN-CREDS] Password hashed successfully');

    // Test GP51 authentication before storing
    const globalToken = Deno.env.get("GP51_GLOBAL_API_TOKEN");
    const apiUrl = Deno.env.get("GP51_API_BASE_URL") || "https://www.gps51.com/webapi";
    
    if (!globalToken) {
      return new Response(JSON.stringify({
        success: false,
        error: 'GP51 configuration error - missing global token'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Build test URL
    const testUrl = new URL(apiUrl);
    testUrl.searchParams.set('action', 'login');
    testUrl.searchParams.set('token', globalToken);
    testUrl.searchParams.set('username', 'octopus');
    testUrl.searchParams.set('password', hashedPassword);
    testUrl.searchParams.set('from', 'WEB');
    testUrl.searchParams.set('type', 'USER');

    console.log('🧪 [STORE-ADMIN-CREDS] Testing GP51 authentication...');

    const testResponse = await fetch(testUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'EnvioFleet/2.0/CredentialTest'
      },
      signal: AbortSignal.timeout(10000)
    });

    const testResponseText = await testResponse.text();
    console.log(`📋 [STORE-ADMIN-CREDS] GP51 test response: ${testResponseText.substring(0, 100)}...`);

    if (!testResponse.ok) {
      console.error('❌ [STORE-ADMIN-CREDS] GP51 test failed with HTTP error:', testResponse.status);
      return new Response(JSON.stringify({
        success: false,
        error: `GP51 authentication test failed: HTTP ${testResponse.status}`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if authentication was successful
    let isValidCredential = false;
    try {
      const testResult = JSON.parse(testResponseText);
      isValidCredential = testResult.status === 0 && testResult.token;
    } catch (e) {
      // If not JSON, check if we got a token as plain text
      isValidCredential = testResponseText && testResponseText.trim().length > 0;
    }

    if (!isValidCredential) {
      console.error('❌ [STORE-ADMIN-CREDS] GP51 credentials validation failed');
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid GP51 credentials. Please check username and password.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ [STORE-ADMIN-CREDS] GP51 credentials validated successfully');

    // Get the admin user (chudesyl@gmail.com)
    const { data: adminUser, error: userError } = await supabase
      .from('envio_users')
      .select('id')
      .eq('email', 'chudesyl@gmail.com')
      .single();

    if (userError || !adminUser) {
      console.error('❌ [STORE-ADMIN-CREDS] Admin user not found:', userError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Admin user not found. Please ensure chudesyl@gmail.com is registered.'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('👤 [STORE-ADMIN-CREDS] Admin user found:', adminUser.id);

    // Clear any existing sessions for this user
    const { error: deleteError } = await supabase
      .from('gp51_sessions')
      .delete()
      .eq('envio_user_id', adminUser.id);

    if (deleteError) {
      console.warn('⚠️ [STORE-ADMIN-CREDS] Failed to clear existing sessions:', deleteError);
    } else {
      console.log('🧹 [STORE-ADMIN-CREDS] Cleared existing sessions');
    }

    // Insert new session with properly hashed credentials
    const { data: sessionData, error: insertError } = await supabase
      .from('gp51_sessions')
      .insert({
        envio_user_id: adminUser.id,
        username: 'octopus',
        password_hash: hashedPassword, // Store the MD5 hashed password
        gp51_token: 'pending_authentication',
        token_expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours
        api_url: apiUrl,
        auth_method: 'ADMIN_SETUP',
        created_at: new Date().toISOString(),
        last_validated_at: new Date().toISOString()
      })
      .select();

    if (insertError) {
      console.error('❌ [STORE-ADMIN-CREDS] Failed to insert session:', insertError);
      return new Response(JSON.stringify({
        success: false,
        error: `Failed to store credentials: ${insertError.message}`
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ [STORE-ADMIN-CREDS] Credentials stored successfully with validated MD5 hash');

    return new Response(JSON.stringify({
      success: true,
      message: 'GP51 credentials stored and validated successfully for admin user',
      sessionId: sessionData?.[0]?.id,
      details: {
        username: 'octopus',
        passwordValidated: true,
        hashMethod: 'MD5',
        gp51ApiTested: true
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ [STORE-ADMIN-CREDS] Unexpected error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
