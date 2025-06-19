
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to hash password using MD5
async function md5(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function testGP51Connection(apiUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`Testing GP51 connection to: ${apiUrl}`);
    
    // Test basic connectivity
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FleetIQ/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('GP51 connection test failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Connection test failed' 
    };
  }
}

async function authenticateWithGP51(username: string, password: string, apiUrl: string) {
  try {
    console.log(`Authenticating user for telemetry: ${username}`);
    
    // Hash the password
    const hashedPassword = await md5(password);
    console.log('Password hashed successfully for telemetry auth.');
    
    // Try multiple authentication methods
    const authMethods = [
      {
        name: 'GET_REQUEST',
        url: `${apiUrl}?action=login&username=${encodeURIComponent(username)}&password=${encodeURIComponent(hashedPassword)}`,
        options: {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'FleetIQ/1.0'
          }
        }
      },
      {
        name: 'POST_JSON',
        url: apiUrl,
        options: {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'FleetIQ/1.0'
          },
          body: JSON.stringify({
            action: 'login',
            username: username,
            password: hashedPassword
          })
        }
      },
      {
        name: 'POST_FORM',
        url: apiUrl,
        options: {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'User-Agent': 'FleetIQ/1.0'
          },
          body: new URLSearchParams({
            action: 'login',
            username: username,
            password: hashedPassword
          }).toString()
        }
      }
    ];

    for (const method of authMethods) {
      try {
        console.log(`Trying authentication method: ${method.name}`);
        
        const response = await fetch(method.url, method.options);
        
        if (!response.ok) {
          console.log(`Method ${method.name} failed with status: ${response.status}`);
          continue;
        }
        
        const result = await response.json();
        console.log(`Method ${method.name} response:`, result);
        
        if (result.status === 0 && result.token) {
          console.log(`Authentication successful with method: ${method.name}`);
          return {
            success: true,
            token: result.token,
            sessionId: result.token,
            method: method.name,
            vehicles: result.devices || []
          };
        }
      } catch (error) {
        console.error(`Method ${method.name} error:`, error);
        continue;
      }
    }
    
    throw new Error('All authentication methods failed');
    
  } catch (error) {
    console.error('GP51 authentication failed:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { username, password, testConnection } = await req.json();
    
    // Get GP51 API URL from environment or use default
    const apiUrl = Deno.env.get('GP51_API_BASE_URL') || 'https://www.gps51.com/webapi';
    console.log(`Using GP51 API URL: ${apiUrl}`);

    // Handle connection test requests
    if (testConnection) {
      const connectionTest = await testGP51Connection(apiUrl);
      return new Response(JSON.stringify({
        success: connectionTest.success,
        apiUrl: apiUrl,
        error: connectionTest.error,
        timestamp: new Date().toISOString()
      }), {
        status: connectionTest.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!username || !password) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Username and password are required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Test connection before attempting authentication
    const connectionTest = await testGP51Connection(apiUrl);
    if (!connectionTest.success) {
      return new Response(JSON.stringify({
        success: false,
        error: `GP51 service unavailable: ${connectionTest.error}`,
        details: {
          apiUrl: apiUrl,
          connectionError: connectionTest.error,
          suggestion: 'Please check GP51 service status or contact support'
        }
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Attempt authentication
    const authResult = await authenticateWithGP51(username, password, apiUrl);
    
    return new Response(JSON.stringify(authResult), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Telemetry auth error:', error);
    
    const errorResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
      timestamp: new Date().toISOString(),
      details: {
        suggestion: 'Please verify your credentials and try again. If the problem persists, contact support.'
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
