
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  const request_ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip');

  try {
    // This function uses the anon key as it's called from public registration pages
    // before a user is authenticated.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Rate Limiting
    const { data: rateLimit, error: rateLimitError } = await supabaseAdmin.rpc('check_rate_limit', {
        p_identifier: request_ip,
        p_endpoint: 'gp51-registration-validator',
    });

    if (rateLimitError || !rateLimit) {
        console.warn('Rate limit check failed:', rateLimitError?.message);
        if(!rateLimit){
            return new Response(JSON.stringify({ usernameAvailable: false, message: 'Too many requests. Please try again later.' }), {
                status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
    }

    const { username } = await req.json();

    if (!username) {
      return new Response(JSON.stringify({ usernameAvailable: false, message: 'Username is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Basic Input Validation
    if (!/^[a-zA-Z0-9_.-@]{3,50}$/.test(username)) {
      await supabaseAdmin.rpc('log_security_event', { p_action_type: 'USERNAME_VALIDATION_FAIL', p_ip_address: request_ip, p_success: false, p_error_message: 'Invalid username format', p_request_details: { username } });
      return new Response(JSON.stringify({ usernameAvailable: false, message: 'Invalid username format.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }
    
    if (username.toLowerCase() === 'chudesyl@gmail.com') {
      return new Response(JSON.stringify({ usernameAvailable: false, message: 'This username is reserved.' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[gp51-validator] Validating username availability for: ${username}`);

    const { data: authResult, error: authError } = await supabase.functions.invoke('gp51-auth-service', {
      body: {
        action: 'test_authentication',
        username: username,
        password: 'check_user_existence_dummy_password',
      },
    });

    if (authError) {
        console.error(`[gp51-validator] Error invoking auth service:`, authError.message);
        await supabaseAdmin.rpc('log_security_event', { p_action_type: 'USERNAME_VALIDATION_FAIL', p_ip_address: request_ip, p_success: false, p_error_message: `Auth service invocation error: ${authError.message}`, p_request_details: { username } });
        return new Response(JSON.stringify({ usernameAvailable: false, message: 'Could not connect to GP51 validation service.' }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
    
    if (authResult.success) {
      console.log(`[gp51-validator] Validation fail: Username '${username}' already exists.`);
      await supabaseAdmin.rpc('log_security_event', { p_action_type: 'USERNAME_VALIDATION_TAKEN', p_ip_address: request_ip, p_success: false, p_request_details: { username } });
      return new Response(JSON.stringify({
        usernameAvailable: false,
        message: 'Username is already taken.',
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const gp51ErrorMessage = (authResult.error || '').toLowerCase();
    
    if (gp51ErrorMessage.includes('user not exist') || gp51ErrorMessage.includes('user does not exist')) {
      console.log(`[gp51-validator] Validation success: Username '${username}' is available.`);
      return new Response(JSON.stringify({
        usernameAvailable: true,
        message: 'Username is available.',
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (gp51ErrorMessage.includes('password error') || gp51ErrorMessage.includes('password is error')) {
      console.log(`[gp51-validator] Validation fail: Username '${username}' exists.`);
      await supabaseAdmin.rpc('log_security_event', { p_action_type: 'USERNAME_VALIDATION_TAKEN', p_ip_address: request_ip, p_success: false, p_request_details: { username } });
      return new Response(JSON.stringify({
        usernameAvailable: false,
        message: 'Username is already taken.',
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.warn(`[gp51-validator] Validation fail due to unhandled GP51 error for '${username}'. Error: ${gp51ErrorMessage}`);
    await supabaseAdmin.rpc('log_security_event', { p_action_type: 'USERNAME_VALIDATION_FAIL', p_ip_address: request_ip, p_success: false, p_error_message: `Unhandled GP51 error: ${gp51ErrorMessage}`, p_request_details: { username } });
    return new Response(JSON.stringify({
      usernameAvailable: false,
      message: `Could not verify username with GP51 at this time. Please try again later.`,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[gp51-validator] Critical error:', error);
    await supabaseAdmin.rpc('log_security_event', { p_action_type: 'USERNAME_VALIDATION_FAIL', p_ip_address: request_ip, p_success: false, p_error_message: `Internal Server Error: ${error.message}` });
    return new Response(JSON.stringify({ usernameAvailable: false, message: 'Internal server error during validation.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
