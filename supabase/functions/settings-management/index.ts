
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to create MD5 hash using a reliable implementation
async function md5(input: string): Promise<string> {
  // Use a pure JavaScript MD5 implementation that works in Deno
  const { createHash } = await import('https://deno.land/std@0.168.0/node/crypto.ts');
  const hash = createHash('md5');
  hash.update(input);
  return hash.digest('hex');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { action, username, password } = await req.json();
    
    if (action === 'save-gp51-credentials') {
      if (!username || !password) {
        return new Response(
          JSON.stringify({ error: 'Username and password are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Testing GP51 credentials for user:', username);

      // MD5 encrypt the password
      const hashedPassword = await md5(password);
      console.log('Password hashed successfully');

      // Test GP51 connection
      const loginPayload = {
        action: 'login',
        username: username,
        password: hashedPassword,
        from: 'WEB',
        type: 'USER'
      };

      console.log('Testing GP51 connection...');
      const loginResponse = await fetch('https://www.gps51.com/webapi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginPayload),
      });

      if (!loginResponse.ok) {
        console.error('GP51 API request failed:', loginResponse.status);
        return new Response(
          JSON.stringify({ error: 'Failed to connect to GP51 system' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const loginResult = await loginResponse.json();
      console.log('GP51 connection test response:', loginResult);

      if (loginResult.status === 1) {
        console.error('GP51 credentials invalid:', loginResult.cause);
        return new Response(
          JSON.stringify({ error: loginResult.cause || 'Invalid GP51 credentials' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Store/update credentials in database
      const { data: sessionData, error: sessionError } = await supabase
        .from('gp51_sessions')
        .upsert({
          username: username,
          gp51_token: loginResult.token,
          token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }, {
          onConflict: 'username'
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Failed to store credentials:', sessionError);
        return new Response(
          JSON.stringify({ error: 'Failed to save credentials' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('GP51 credentials saved successfully');

      return new Response(
        JSON.stringify({
          success: true,
          message: 'GP51 credentials saved and connection established successfully!'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } else if (action === 'get-gp51-status') {
      // Check current GP51 connection status
      const { data: sessions, error } = await supabase
        .from('gp51_sessions')
        .select('username, token_expires_at')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Failed to check GP51 status:', error);
        return new Response(
          JSON.stringify({ connected: false, error: 'Failed to check status' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const hasActiveSession = sessions && sessions.length > 0 && 
        new Date(sessions[0].token_expires_at) > new Date();

      return new Response(
        JSON.stringify({
          connected: hasActiveSession,
          username: hasActiveSession ? sessions[0].username : null,
          expiresAt: hasActiveSession ? sessions[0].token_expires_at : null
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Settings management error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
