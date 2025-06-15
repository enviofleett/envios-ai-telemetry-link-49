
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// This function's primary goal is to check if a username is available on GP51.
// It is designed to be called from public-facing registration forms.
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // This function uses the anon key as it's called from public registration pages
    // before a user is authenticated.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { username } = await req.json();

    if (!username) {
      return new Response(JSON.stringify({ usernameAvailable: false, message: 'Username is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Protect the admin account from being checked or registered.
    if (username.toLowerCase() === 'chudesyl@gmail.com') {
      return new Response(JSON.stringify({ usernameAvailable: false, message: 'This username is reserved.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[gp51-validator] Validating username availability for: ${username}`);

    // We invoke the auth service with a dummy password. The goal is only to check for user existence.
    const { data: authResult, error: authError } = await supabase.functions.invoke('gp51-auth-service', {
      body: {
        action: 'test_authentication',
        username: username,
        password: 'check_user_existence_dummy_password',
      },
    });

    if (authError) {
        console.error(`[gp51-validator] Error invoking auth service:`, authError.message);
        return new Response(JSON.stringify({ usernameAvailable: false, message: 'Could not connect to GP51 validation service.' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
    
    if (authResult.success) {
      // If auth succeeds, the username is taken.
      console.log(`[gp51-validator] Validation fail: Username '${username}' already exists.`);
      return new Response(JSON.stringify({
        usernameAvailable: false,
        message: 'Username is already taken.',
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const gp51ErrorMessage = (authResult.error || '').toLowerCase();
    console.log(`[gp51-validator] Auth service failed for '${username}' with message: "${gp51ErrorMessage}"`);

    // This is the expected success condition for an available username.
    if (gp51ErrorMessage.includes('user not exist') || gp51ErrorMessage.includes('user does not exist')) {
      console.log(`[gp51-validator] Validation success: Username '${username}' is available.`);
      return new Response(JSON.stringify({
        usernameAvailable: true,
        message: 'Username is available.',
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // This indicates the user exists, so the username is not available.
    if (gp51ErrorMessage.includes('password error') || gp51ErrorMessage.includes('password is error')) {
      console.log(`[gp51-validator] Validation fail: Username '${username}' exists.`);
      return new Response(JSON.stringify({
        usernameAvailable: false,
        message: 'Username is already taken.',
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // For any other error, we fail safely by saying the username is not available.
    console.warn(`[gp51-validator] Validation fail due to unhandled GP51 error for '${username}'. Error: ${gp51ErrorMessage}`);
    return new Response(JSON.stringify({
      usernameAvailable: false,
      message: `Could not verify username with GP51 at this time. Please try again later.`,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[gp51-validator] Critical error:', error);
    return new Response(JSON.stringify({ usernameAvailable: false, message: 'Internal server error during validation.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
