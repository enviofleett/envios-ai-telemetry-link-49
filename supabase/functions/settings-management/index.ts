
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Proper MD5 implementation using Web Crypto API
async function md5(input: string): Promise<string> {
  try {
    const data = new TextEncoder().encode(input);
    const hashBuffer = await crypto.subtle.digest('MD5', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    // Fallback for environments where Web Crypto MD5 isn't available
    const { createHash } = await import('https://deno.land/std@0.168.0/node/crypto.ts');
    const hash = createHash('md5');
    hash.update(input);
    return hash.digest('hex');
  }
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
        console.error('Missing credentials: username or password not provided');
        return new Response(
          JSON.stringify({ error: 'Username and password are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Starting GP51 credential validation for user:', username);

      // MD5 encrypt the password using proper implementation
      const hashedPassword = await md5(password);
      console.log('Password hashed successfully');

      // Corrected GP51 authentication payload - removed the action field from body
      const authPayload = {
        username: username,
        password: hashedPassword,
        from: 'WEB',
        type: 'USER'
      };

      console.log('Attempting GP51 authentication with corrected payload...');

      try {
        // Use the correct GP51 API endpoint with action parameter in URL only
        const loginResponse = await fetch('https://www.gps51.com/webapi?action=login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Envio-Console/1.0',
            'Accept': 'application/json'
          },
          body: JSON.stringify(authPayload),
          signal: AbortSignal.timeout(15000) // 15 second timeout
        });

        console.log('GP51 API response status:', loginResponse.status);

        if (!loginResponse.ok) {
          console.error('GP51 API returned non-OK status:', loginResponse.status, loginResponse.statusText);
          const errorText = await loginResponse.text();
          console.error('GP51 API error response body:', errorText);
          
          return new Response(
            JSON.stringify({ 
              error: `GP51 API error: ${loginResponse.status} ${loginResponse.statusText}`,
              details: 'The GP51 API returned an error response'
            }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const responseText = await loginResponse.text();
        console.log('GP51 API raw response received');

        let loginResult;
        try {
          loginResult = JSON.parse(responseText);
          console.log('GP51 parsed response received');
        } catch (parseError) {
          console.error('Failed to parse GP51 response as JSON:', parseError);
          console.error('Raw response was:', responseText.substring(0, 200));
          
          return new Response(
            JSON.stringify({ 
              error: 'Invalid response format from GP51 API',
              details: 'The GP51 API returned a malformed response'
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check for successful response - GP51 uses status: 0 for success
        if (loginResult.status !== 0) {
          console.error('GP51 authentication failed. Status:', loginResult.status, 'Cause:', loginResult.cause);
          
          return new Response(
            JSON.stringify({
              error: loginResult.cause || `GP51 authentication failed (status: ${loginResult.status})`,
              details: 'Please verify your GP51 username and password are correct'
            }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Extract token from successful response
        const token = loginResult.token;
        if (!token) {
          console.error('GP51 login successful but no token received');
          console.error('Full response:', JSON.stringify(loginResult, null, 2));
          return new Response(
            JSON.stringify({ 
              error: 'GP51 authentication successful but no token received',
              details: 'The GP51 API responded successfully but did not provide an authentication token'
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('GP51 authentication successful. Token received');

        // Store/update credentials in database
        try {
          const { data: sessionData, error: sessionError } = await supabase
            .from('gp51_sessions')
            .upsert({
              username: username,
              gp51_token: token,
              token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            }, {
              onConflict: 'username'
            })
            .select()
            .single();

          if (sessionError) {
            console.error('Failed to store GP51 session in database:', sessionError);
            return new Response(
              JSON.stringify({ 
                error: 'Failed to save GP51 session to database',
                details: sessionError.message
              }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          console.log('GP51 session stored successfully in database');

          return new Response(
            JSON.stringify({
              success: true,
              message: 'GP51 credentials validated and saved successfully!',
              tokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );

        } catch (dbError) {
          console.error('Database operation failed:', dbError);
          return new Response(
            JSON.stringify({ 
              error: 'Database error while saving credentials',
              details: dbError instanceof Error ? dbError.message : 'Unknown database error'
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

      } catch (fetchError) {
        console.error('Failed to connect to GP51 API:', fetchError);
        
        return new Response(
          JSON.stringify({ 
            error: 'Failed to connect to GP51 API',
            details: fetchError instanceof Error ? fetchError.message : 'Network error'
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

    } else if (action === 'get-gp51-status') {
      // Check current GP51 connection status
      console.log('Checking GP51 connection status');
      
      try {
        const { data: sessions, error } = await supabase
          .from('gp51_sessions')
          .select('username, token_expires_at, gp51_token')
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Failed to query GP51 sessions:', error);
          return new Response(
            JSON.stringify({ 
              connected: false, 
              error: 'Failed to check GP51 status',
              details: error.message
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const hasActiveSession = sessions && sessions.length > 0 && 
          new Date(sessions[0].token_expires_at) > new Date() &&
          sessions[0].gp51_token;

        console.log('GP51 status check result:', {
          sessionsFound: sessions?.length || 0,
          hasActiveSession,
          expiresAt: sessions?.[0]?.token_expires_at
        });

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
      } catch (statusError) {
        console.error('Error checking GP51 status:', statusError);
        return new Response(
          JSON.stringify({ 
            connected: false, 
            error: 'Error checking GP51 status',
            details: statusError instanceof Error ? statusError.message : 'Unknown error'
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.error('Invalid action received:', action);
    return new Response(
      JSON.stringify({ error: 'Invalid action. Expected: save-gp51-credentials or get-gp51-status' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Settings management function error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
