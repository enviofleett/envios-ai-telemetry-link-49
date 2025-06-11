
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GP51LoginRequest {
  username: string;
  password: string;
  from?: string;
  type?: string;
}

interface GP51ApiResponse {
  status: number;
  cause?: string;
  token?: string;
  message?: string;
}

// MD5 hash implementation
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

async function callGP51Api(action: string, params: Record<string, any>, token?: string): Promise<GP51ApiResponse> {
  const GP51_BASE_URL = Deno.env.get('GP51_API_BASE_URL') || 'https://www.gps51.com';
  
  let url = `${GP51_BASE_URL}/webapi?action=${action}`;
  if (token) {
    url += `&token=${encodeURIComponent(token)}`;
  }

  console.log(`Calling GP51 API: ${action}`);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`GP51 API request failed: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  console.log(`GP51 API response for ${action}:`, { status: result.status });
  
  return result;
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

    const { action, ...requestData } = await req.json();
    console.log(`GP51 Service request: ${action}`);

    switch (action) {
      case 'login': {
        const { username, password, from = 'WEB', type = 'USER' }: GP51LoginRequest = requestData;
        
        if (!username || !password) {
          return new Response(
            JSON.stringify({ error: 'Username and password are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Hash password with MD5
        const hashedPassword = await md5(password);
        
        // Call GP51 login API
        const loginResult = await callGP51Api('login', {
          username: username.trim(),
          password: hashedPassword,
          from,
          type
        });

        if (loginResult.status === 0 && loginResult.token) {
          // Store session in database for tracking
          const { error: sessionError } = await supabase
            .from('gp51_sessions')
            .insert({
              username: username.trim(),
              gp51_token: loginResult.token,
              token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            });

          if (sessionError) {
            console.warn('Failed to store session:', sessionError);
            // Don't fail the login if session storage fails
          }

          return new Response(
            JSON.stringify({
              success: true,
              token: loginResult.token,
              username: username.trim()
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          return new Response(
            JSON.stringify({
              success: false,
              error: loginResult.cause || 'Authentication failed'
            }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'logout': {
        const { token } = requestData;
        
        if (token) {
          try {
            await callGP51Api('logout', {}, token);
          } catch (error) {
            console.warn('GP51 logout API call failed:', error);
            // Don't fail logout if API call fails
          }

          // Remove session from database
          await supabase
            .from('gp51_sessions')
            .delete()
            .eq('gp51_token', token);
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'health_check': {
        const { token } = requestData;
        
        if (!token) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'No token provided'
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        try {
          const result = await callGP51Api('querymonitorlist', {}, token);
          
          return new Response(
            JSON.stringify({
              success: result.status === 0,
              healthy: result.status === 0,
              error: result.status !== 0 ? (result.cause || 'Health check failed') : undefined
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          return new Response(
            JSON.stringify({
              success: false,
              healthy: false,
              error: error instanceof Error ? error.message : 'Health check failed'
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'get_devices': {
        const { token } = requestData;
        
        if (!token) {
          return new Response(
            JSON.stringify({ error: 'No token provided' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        try {
          const result = await callGP51Api('querymonitorlist', {}, token);
          
          if (result.status === 0) {
            const devices = result.groups?.flatMap(group => group.devices || []) || [];
            
            return new Response(
              JSON.stringify({
                success: true,
                devices,
                deviceCount: devices.length
              }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          } else {
            return new Response(
              JSON.stringify({
                success: false,
                error: result.cause || 'Failed to fetch devices'
              }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } catch (error) {
          return new Response(
            JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Failed to fetch devices'
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('GP51 Service error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
