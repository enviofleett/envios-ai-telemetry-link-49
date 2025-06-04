
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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

  try {
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
    const { envioUser, userError } = await findImportedUser(username);

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
    const { authUpdateError } = await updateUserPassword(envioUser.id, newPassword);

    if (authUpdateError) {
      console.error('Failed to update auth password:', authUpdateError);
      return new Response(JSON.stringify({ 
        error: 'Failed to update password' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update user flags
    const { userUpdateError } = await updateUserFlags(envioUser.id);

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
      const { sessionError } = await storeGP51Session(envioUser.id, username, isValidPassword.token);

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
