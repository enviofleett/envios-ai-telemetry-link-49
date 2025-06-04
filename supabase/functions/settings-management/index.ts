
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to create MD5 hash using a reliable implementation
async function md5(input: string): Promise<string> {
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
        console.error('Missing credentials: username or password not provided');
        return new Response(
          JSON.stringify({ error: 'Username and password are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Starting GP51 credential validation for user:', username);

      // MD5 encrypt the password
      const hashedPassword = await md5(password);
      console.log('Password hashed successfully. Hash length:', hashedPassword.length);

      // Try multiple GP51 login payload formats
      const loginPayloads = [
        // Format 1: Try without action parameter
        {
          username: username,
          password: hashedPassword,
          from: 'WEB',
          type: 'USER'
        },
        // Format 2: Try with userlogin action
        {
          action: 'userlogin',
          username: username,
          password: hashedPassword,
          from: 'WEB',
          type: 'USER'
        },
        // Format 3: Try with authenticate action
        {
          action: 'authenticate',
          username: username,
          password: hashedPassword,
          from: 'WEB',
          type: 'USER'
        },
        // Format 4: Try with signin action
        {
          action: 'signin',
          username: username,
          password: hashedPassword,
          from: 'WEB',
          type: 'USER'
        }
      ];

      let loginResult = null;
      let lastError = null;

      // Try each payload format
      for (let i = 0; i < loginPayloads.length; i++) {
        const loginPayload = loginPayloads[i];
        console.log(`Attempting GP51 login with format ${i + 1}:`, JSON.stringify(loginPayload, null, 2));

        try {
          const loginResponse = await fetch('https://www.gps51.com/webapi', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Envio-Console/1.0',
              'Accept': 'application/json'
            },
            body: JSON.stringify(loginPayload),
            signal: AbortSignal.timeout(15000) // 15 second timeout
          });

          console.log(`GP51 API response status for format ${i + 1}:`, loginResponse.status);

          if (!loginResponse.ok) {
            console.error(`GP51 API returned non-OK status for format ${i + 1}:`, loginResponse.status, loginResponse.statusText);
            const errorText = await loginResponse.text();
            console.error(`GP51 API error response body for format ${i + 1}:`, errorText);
            lastError = `GP51 API error: ${loginResponse.status} ${loginResponse.statusText}`;
            continue;
          }

          const responseText = await loginResponse.text();
          console.log(`GP51 API raw response for format ${i + 1}:`, responseText);

          try {
            loginResult = JSON.parse(responseText);
            console.log(`GP51 parsed response for format ${i + 1}:`, JSON.stringify(loginResult, null, 2));

            // Check if this format was successful
            if (loginResult.status === 0 || loginResult.token || loginResult.success === true) {
              console.log(`GP51 authentication successful with format ${i + 1}`);
              break;
            } else if (loginResult.status !== 8901) {
              // Different error than "action not found", might be credentials issue
              console.error(`GP51 authentication failed with format ${i + 1}. Status:`, loginResult.status, 'Cause:', loginResult.cause);
              lastError = loginResult.cause || `GP51 authentication failed (status: ${loginResult.status})`;
              break; // Don't try other formats for credential errors
            } else {
              // Status 8901 means "action not found", try next format
              console.log(`Format ${i + 1} failed with "action not found", trying next format...`);
              lastError = loginResult.cause || `GP51 authentication failed (status: ${loginResult.status})`;
            }
          } catch (parseError) {
            console.error(`Failed to parse GP51 response as JSON for format ${i + 1}:`, parseError);
            console.error(`Raw response was for format ${i + 1}:`, responseText.substring(0, 200));
            lastError = 'Invalid response format from GP51 API';
            continue;
          }
        } catch (fetchError) {
          console.error(`Failed to connect to GP51 API with format ${i + 1}:`, fetchError);
          lastError = fetchError instanceof Error ? fetchError.message : 'Network error';
          continue;
        }
      }

      // If no format worked, return the last error
      if (!loginResult || (loginResult.status !== 0 && !loginResult.token && loginResult.success !== true)) {
        return new Response(
          JSON.stringify({ 
            error: lastError || 'All GP51 authentication formats failed',
            details: 'Tried multiple payload formats but none were accepted by GP51 API'
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
          JSON.stringify({ error: 'GP51 authentication successful but no token received' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('GP51 authentication successful. Token received:', token.substring(0, 10) + '...');

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
