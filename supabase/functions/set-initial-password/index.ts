
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { PasswordSetRequest } from './types.ts';
import { validatePasswordWithGP51 } from './gp51-validator.ts';
import { findImportedUser, updateUserPassword, updateUserFlags, storeGP51Session } from './user-service.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { username, newPassword }: PasswordSetRequest = await req.json();

    // Rate Limiting
    const { data: rateLimit, error: rateLimitError } = await supabaseAdmin.rpc('check_rate_limit', {
        p_identifier: request_ip,
        p_endpoint: 'set-initial-password',
    });

    if (rateLimitError || !rateLimit) {
        console.warn('Rate limit check failed:', rateLimitError?.message);
        if(!rateLimit){
            return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
                status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
    }

    if (!username || !newPassword) {
      return new Response(JSON.stringify({ error: 'Username and newPassword are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Basic Input Validation
    if (username.length < 3 || username.length > 50) {
        return new Response(JSON.stringify({ error: 'Invalid username format.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }
    if (newPassword.length < 6) {
        return new Response(JSON.stringify({ error: 'Password must be at least 6 characters.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }


    console.log(`Password setting attempt for user: ${username}`);

    const { envioUser, userError } = await findImportedUser(username);

    if (userError || !envioUser) {
      await supabaseAdmin.rpc('log_security_event', { p_action_type: 'PASSWORD_SET_FAIL', p_ip_address: request_ip, p_success: false, p_error_message: 'User not found or password already set', p_request_details: { username } });
      return new Response(JSON.stringify({ error: 'User not found or password already set' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const isValidPassword = await validatePasswordWithGP51(username, newPassword);
    
    if (!isValidPassword.success) {
      await supabaseAdmin.rpc('log_security_event', { p_user_id: envioUser.id, p_action_type: 'PASSWORD_SET_FAIL', p_ip_address: request_ip, p_success: false, p_error_message: `GP51 Validation Failed: ${isValidPassword.error}`, p_request_details: { username } });
      return new Response(JSON.stringify({ error: isValidPassword.error }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { authUpdateError } = await updateUserPassword(envioUser.id, newPassword);

    if (authUpdateError) {
      console.error('Failed to update auth password:', authUpdateError);
      await supabaseAdmin.rpc('log_security_event', { p_user_id: envioUser.id, p_action_type: 'PASSWORD_SET_FAIL', p_ip_address: request_ip, p_success: false, p_error_message: 'Failed to update auth password', p_request_details: { username } });
      return new Response(JSON.stringify({ error: 'Failed to update password' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { userUpdateError } = await updateUserFlags(envioUser.id);

    if (userUpdateError) {
      console.error('Failed to update user flags:', userUpdateError);
      await supabaseAdmin.rpc('log_security_event', { p_user_id: envioUser.id, p_action_type: 'PASSWORD_SET_FAIL', p_ip_address: request_ip, p_success: false, p_error_message: 'Failed to update user flags', p_request_details: { username } });
      return new Response(JSON.stringify({ error: 'Failed to complete password setup' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (isValidPassword.token) {
      const { sessionError } = await storeGP51Session(envioUser.id, username, isValidPassword.token);
      if (sessionError) {
        console.error('Failed to store GP51 session:', sessionError);
      }
    }

    console.log(`Successfully set password for user: ${username}`);
    await supabaseAdmin.rpc('log_security_event', { p_user_id: envioUser.id, p_action_type: 'PASSWORD_SET_SUCCESS', p_ip_address: request_ip, p_success: true });

    return new Response(JSON.stringify({
      success: true,
      message: 'Password set successfully. You can now log in to your account.'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Password setting error:', error);
    await supabaseAdmin.rpc('log_security_event', { p_action_type: 'PASSWORD_SET_FAIL', p_ip_address: request_ip, p_success: false, p_error_message: `Internal Server Error: ${error.message}` });
    return new Response(JSON.stringify({ 
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
