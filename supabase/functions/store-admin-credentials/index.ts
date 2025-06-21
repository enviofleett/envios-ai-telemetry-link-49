
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

    // CRITICAL: Hash the password with MD5 for GP51 compatibility
    console.log('🔐 [STORE-ADMIN-CREDS] Hashing password with MD5...');
    const hashedPassword = await md5_for_gp51_only(password);
    console.log(`✅ [STORE-ADMIN-CREDS] Password hashed successfully: ${hashedPassword.substring(0, 8)}...`);

    // Test the credentials with GP51 using the hashed password
    console.log('🔍 [STORE-ADMIN-CREDS] Testing credentials with GP51...');
    
    const globalToken = Deno.env.get("GP51_GLOBAL_API_TOKEN");
    let gp51BaseUrl = Deno.env.get("GP51_BASE_URL");
    
    if (!globalToken) {
      console.error('❌ [STORE-ADMIN-CREDS] GP51 configuration error - missing global token');
      return new Response(JSON.stringify({
        success: false,
        error: 'GP51 configuration error - missing global token'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!gp51BaseUrl) {
      console.error('❌ [STORE-ADMIN-CREDS] GP51 configuration error - missing base URL');
      return new Response(JSON.stringify({
        success: false,
        error: 'GP51 configuration error - missing base URL'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Robust URL construction
    if (!gp51BaseUrl.startsWith('http://') && !gp51BaseUrl.startsWith('https://')) {
      gp51BaseUrl = 'https://' + gp51BaseUrl;
      console.warn('⚠️ [STORE-ADMIN-CREDS] Prepended https:// to GP51_BASE_URL');
    }
    if (gp51BaseUrl.endsWith('/')) {
      gp51BaseUrl = gp51BaseUrl.slice(0, -1);
    }

    // Construct API URL
    let apiUrl = gp51BaseUrl;
    if (!apiUrl.endsWith('/webapi')) {
      apiUrl += '/webapi';
    }

    // Build test URL with MD5 hashed password
    const testUrl = new URL(apiUrl);
    testUrl.searchParams.set('action', 'login');
    testUrl.searchParams.set('token', globalToken);
    testUrl.searchParams.set('username', 'octopus');
    testUrl.searchParams.set('password', hashedPassword); // Use MD5 hashed password
    testUrl.searchParams.set('from', 'WEB');
    testUrl.searchParams.set('type', 'USER');

    console.log(`🧪 [STORE-ADMIN-CREDS] Testing GP51 with URL: ${testUrl.toString().replace(hashedPassword, '***MD5_HASH***')}`);

    const testResponse = await fetch(testUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'EnvioFleet/2.0/CredentialTest'
      },
      signal: AbortSignal.timeout(10000)
    });

    const testResponseText = await testResponse.text();
    const contentLength = testResponse.headers.get('content-length');
    
    console.log(`📋 [STORE-ADMIN-CREDS] GP51 test response status: ${testResponse.status} ${testResponse.statusText}`);
    console.log(`📋 [STORE-ADMIN-CREDS] GP51 test response Content-Length: ${contentLength}`);
    console.log(`📋 [STORE-ADMIN-CREDS] GP51 test response body: ${testResponseText}`);

    if (!testResponse.ok) {
      console.error('❌ [STORE-ADMIN-CREDS] GP51 test failed with HTTP error:', testResponse.status);
      return new Response(JSON.stringify({
        success: false,
        error: `GP51 authentication test failed: HTTP ${testResponse.status} - ${testResponseText}`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Enhanced response validation
    let isValidCredential = false;
    let gp51Status = null;
    let gp51Cause = null;

    if (contentLength === '0' || testResponseText.trim() === '') {
      console.warn('⚠️ [STORE-ADMIN-CREDS] GP51 API returned empty response');
      isValidCredential = false;
      gp51Cause = "Empty response from GP51 API. Check GP51_GLOBAL_API_TOKEN validity and octopus account API access.";
      gp51Status = "EMPTY_RESPONSE";
    } else {
      try {
        const testResult = JSON.parse(testResponseText);
        gp51Status = testResult.status;
        gp51Cause = testResult.cause;
        isValidCredential = testResult.status === 0 && testResult.token;
        console.log(`🔍 [STORE-ADMIN-CREDS] GP51 JSON response - status: ${gp51Status}, has token: ${!!testResult.token}, cause: ${gp51Cause}`);
      } catch (e) {
        console.error('❌ [STORE-ADMIN-CREDS] Failed to parse GP51 response as JSON:', e);
        isValidCredential = false;
        gp51Cause = `GP51 API returned invalid JSON: ${testResponseText.substring(0, 100)}...`;
        gp51Status = "INVALID_JSON";
      }
    }

    if (!isValidCredential) {
      console.error(`❌ [STORE-ADMIN-CREDS] GP51 credentials validation failed. Status: ${gp51Status}, Cause: ${gp51Cause}`);
      return new Response(JSON.stringify({
        success: false,
        error: gp51Cause || 'Invalid GP51 credentials. The provided password does not work with the octopus account.',
        gp51Status: gp51Status,
        debugInfo: {
          responseLength: testResponseText.length,
          contentLength: contentLength,
          hashedPasswordPreview: `${hashedPassword.substring(0, 8)}...`,
          apiUrl: apiUrl
        }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ [STORE-ADMIN-CREDS] GP51 credentials validated successfully with MD5 hash');

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

    // Insert new session with properly MD5 hashed credentials
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
    console.log(`🔐 [STORE-ADMIN-CREDS] Stored hash: ${hashedPassword.substring(0, 8)}...${hashedPassword.substring(hashedPassword.length - 8)}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'GP51 credentials stored and validated successfully for admin user',
      sessionId: sessionData?.[0]?.id,
      details: {
        username: 'octopus',
        passwordValidated: true,
        hashMethod: 'MD5',
        hashPreview: `${hashedPassword.substring(0, 8)}...${hashedPassword.substring(hashedPassword.length - 8)}`,
        gp51ApiTested: true,
        apiUrl: apiUrl
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
