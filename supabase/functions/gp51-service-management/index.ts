
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { sanitizeInput, md5_for_gp51_only, checkRateLimit } from '../_shared/crypto_utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GP51AuthRequest {
  action: string;
  username?: string;
  password?: string;
  apiUrl?: string;
}

serve(async (req) => {
  console.log('🔧 GP51 Service Management:', req.method, req.url);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let body: GP51AuthRequest;
    try {
      body = await req.json();
    } catch (error) {
      console.error('❌ Failed to parse request body:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid JSON in request body'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, username, password, apiUrl } = body;
    console.log(`🔧 Processing action: ${action}`);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authorization header required'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid authentication'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    switch (action) {
      case 'test_connection':
        return await testGP51Connection(supabase, user.id);
      
      case 'test_gp51_api':
        return await testGP51API(supabase, user.id);
      
      case 'authenticate':
        if (!username || !password) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Username and password required'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        return await authenticateWithGP51(supabase, user.id, username, password, apiUrl);
      
      default:
        return new Response(JSON.stringify({
          success: false,
          error: `Unknown action: ${action}`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    console.error('❌ GP51 Service Management error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function testGP51Connection(supabase: any, userId: string) {
  try {
    // Check for existing session
    const { data: sessions, error } = await supabase
      .from('gp51_sessions')
      .select('username, gp51_token, token_expires_at')
      .eq('envio_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ Error checking GP51 sessions:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to check GP51 sessions'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!sessions || sessions.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No GP51 session found. Please authenticate first.'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const session = sessions[0];
    const now = new Date();
    const expiresAt = new Date(session.token_expires_at);

    if (expiresAt <= now) {
      return new Response(JSON.stringify({
        success: false,
        error: 'GP51 session expired. Please re-authenticate.'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      username: session.username,
      tokenValid: true,
      expiresAt: session.token_expires_at
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Connection test failed'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function testGP51API(supabase: any, userId: string) {
  try {
    // First check if we have a valid session
    const connectionTest = await testGP51Connection(supabase, userId);
    const connectionData = await connectionTest.json();
    
    if (!connectionData.success) {
      return new Response(JSON.stringify({
        isValid: false,
        status: 'No valid session',
        errorMessage: connectionData.error,
        needsRefresh: true
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Rate limiting check
    const clientIP = req.headers.get('CF-Connecting-IP') || 'unknown';
    if (!checkRateLimit(clientIP, 10, 60000)) { // 10 requests per minute
      return new Response(JSON.stringify({
        isValid: false,
        status: 'Rate limited',
        errorMessage: 'Too many requests. Please wait before trying again.'
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get GP51 session details
    const { data: sessions } = await supabase
      .from('gp51_sessions')
      .select('username, gp51_token, api_url')
      .eq('envio_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!sessions || sessions.length === 0) {
      return new Response(JSON.stringify({
        isValid: false,
        status: 'No session found',
        errorMessage: 'GP51 session not found'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const session = sessions[0];
    const baseUrl = session.api_url || Deno.env.get('GP51_API_BASE_URL') || 'https://www.gps51.com/webapi';

    // Test API call to get vehicle count
    const testUrl = `${baseUrl}/devices`;
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        token: session.gp51_token,
        action: 'get_devices'
      })
    });

    if (!response.ok) {
      return new Response(JSON.stringify({
        isValid: false,
        status: `HTTP ${response.status}`,
        errorMessage: `GP51 API returned error: ${response.statusText}`
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const apiData = await response.json();
    
    if (apiData.error) {
      return new Response(JSON.stringify({
        isValid: false,
        status: 'API Error',
        errorMessage: apiData.error,
        needsRefresh: apiData.error.includes('token') || apiData.error.includes('auth')
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      isValid: true,
      status: 'Connected',
      username: session.username,
      deviceCount: apiData.devices ? apiData.devices.length : 0,
      latency: `${Date.now() - performance.now()}ms`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ GP51 API test failed:', error);
    return new Response(JSON.stringify({
      isValid: false,
      status: 'Test failed',
      errorMessage: error.message || 'Unknown error during API test'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function authenticateWithGP51(supabase: any, userId: string, username: string, password: string, apiUrl?: string) {
  try {
    // Sanitize inputs
    const cleanUsername = sanitizeInput(username);
    const cleanPassword = sanitizeInput(password);
    
    if (!cleanUsername || !cleanPassword) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid username or password format'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Rate limiting
    const clientIP = req.headers.get('CF-Connecting-IP') || 'unknown';
    if (!checkRateLimit(clientIP, 5, 300000)) { // 5 auth attempts per 5 minutes
      return new Response(JSON.stringify({
        success: false,
        error: 'Too many authentication attempts. Please wait 5 minutes.'
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const baseUrl = apiUrl || Deno.env.get('GP51_API_BASE_URL') || 'https://www.gps51.com/webapi';
    const hashedPassword = await md5_for_gp51_only(cleanPassword);

    // Authenticate with GP51
    const authResponse = await fetch(`${baseUrl}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        username: cleanUsername,
        password: hashedPassword,
        action: 'login'
      })
    });

    if (!authResponse.ok) {
      return new Response(JSON.stringify({
        success: false,
        error: `GP51 authentication failed: ${authResponse.statusText}`
      }), {
        status: authResponse.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const authData = await authResponse.json();
    
    if (authData.error || !authData.token) {
      return new Response(JSON.stringify({
        success: false,
        error: authData.error || 'Failed to get authentication token'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Store session in database
    const { error: insertError } = await supabase
      .from('gp51_sessions')
      .upsert({
        envio_user_id: userId,
        username: cleanUsername,
        password_hash: hashedPassword,
        gp51_token: authData.token,
        token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        api_url: baseUrl,
        last_activity_at: new Date().toISOString()
      }, {
        onConflict: 'envio_user_id'
      });

    if (insertError) {
      console.error('❌ Failed to save GP51 session:', insertError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to save authentication session'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'GP51 authentication successful',
      username: cleanUsername,
      tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ GP51 authentication error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Authentication process failed'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
