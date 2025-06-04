
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PasswordSetRequest {
  username: string;
  newPassword: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { username, newPassword }: PasswordSetRequest = await req.json();

    if (!username || !newPassword) {
      return new Response(JSON.stringify({ 
        error: 'Username and newPassword are required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Password setting attempt for user: ${username}`);

    // Find the imported user
    const { data: envioUser, error: userError } = await supabase
      .from('envio_users')
      .select('*')
      .eq('gp51_username', username)
      .eq('is_gp51_imported', true)
      .eq('needs_password_set', true)
      .single();

    if (userError || !envioUser) {
      return new Response(JSON.stringify({ 
        error: 'User not found or password already set' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate password with GP51
    const isValidPassword = await validatePasswordWithGP51(username, newPassword);
    
    if (!isValidPassword.success) {
      return new Response(JSON.stringify({ 
        error: 'The password you entered does not match your GP51 account. Please try again.',
        details: isValidPassword.error
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update user password in Supabase Auth
    const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
      envioUser.id,
      { password: newPassword }
    );

    if (authUpdateError) {
      console.error('Failed to update auth password:', authUpdateError);
      return new Response(JSON.stringify({ 
        error: 'Failed to update password' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update user flags and store GP51 token
    const { error: userUpdateError } = await supabase
      .from('envio_users')
      .update({
        needs_password_set: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', envioUser.id);

    if (userUpdateError) {
      console.error('Failed to update user flags:', userUpdateError);
      return new Response(JSON.stringify({ 
        error: 'Failed to complete password setup' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Store GP51 session token for future use
    if (isValidPassword.token) {
      const tokenExpiresAt = new Date();
      tokenExpiresAt.setHours(tokenExpiresAt.getHours() + 24); // Assume 24 hour expiry

      const { error: sessionError } = await supabase
        .from('gp51_sessions')
        .upsert({
          envio_user_id: envioUser.id,
          username: username,
          gp51_token: isValidPassword.token,
          token_expires_at: tokenExpiresAt.toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'envio_user_id'
        });

      if (sessionError) {
        console.error('Failed to store GP51 session:', sessionError);
        // Don't fail the request, just log the error
      }
    }

    console.log(`Successfully set password for user: ${username}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Password set successfully. You can now log in to your account.'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Password setting error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function validatePasswordWithGP51(username: string, password: string): Promise<{
  success: boolean;
  token?: string;
  error?: string;
}> {
  try {
    const md5Hash = await hashMD5(password);
    
    const authData = {
      action: 'login',
      username: username,
      password: md5Hash
    };

    console.log(`Validating password for ${username} with GP51...`);

    const response = await fetch('https://www.gps51.com/webapi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(authData)
    });

    const result = await response.json();
    
    if (result.status === 'success' && result.token) {
      console.log(`Password validation successful for ${username}`);
      return {
        success: true,
        token: result.token
      };
    } else {
      console.log(`Password validation failed for ${username}: ${result.cause || 'Unknown error'}`);
      return {
        success: false,
        error: result.cause || 'GP51 authentication failed'
      };
    }

  } catch (error) {
    console.error(`GP51 validation error for ${username}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function hashMD5(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
