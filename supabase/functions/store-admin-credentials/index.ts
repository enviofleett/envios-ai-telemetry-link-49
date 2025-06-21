
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Insert new session with credentials
    const { data: sessionData, error: insertError } = await supabase
      .from('gp51_sessions')
      .insert({
        envio_user_id: adminUser.id,
        username: 'octopus',
        password_hash: password, // Store the password directly as provided
        gp51_token: 'pending_authentication',
        token_expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours
        api_url: 'https://www.gps51.com',
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

    console.log('✅ [STORE-ADMIN-CREDS] Credentials stored successfully');

    return new Response(JSON.stringify({
      success: true,
      message: 'GP51 credentials stored successfully for admin user',
      sessionId: sessionData?.[0]?.id
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
