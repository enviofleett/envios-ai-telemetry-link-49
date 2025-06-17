
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GP51AuthRequest {
  action: 'test_connection' | 'authenticate';
  username: string;
  password: string;
  apiUrl?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, username, password, apiUrl = 'https://www.gps51.com/webapi' }: GP51AuthRequest = await req.json();
    
    console.log(`🔐 GP51 Secure Auth: ${action} for user ${username}`);

    switch (action) {
      case 'test_connection':
        return await testGP51Connection(username, password, apiUrl);
      
      case 'authenticate':
        return await authenticateWithGP51(username, password, apiUrl);
      
      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('❌ GP51 Secure Auth error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function testGP51Connection(username: string, password: string, apiUrl: string) {
  try {
    console.log(`🧪 Testing GP51 connection for ${username}...`);

    // Test GP51 API authentication
    const authResponse = await fetch(`${apiUrl}/Login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        username,
        password,
        t: Date.now().toString()
      })
    });

    if (!authResponse.ok) {
      throw new Error(`HTTP ${authResponse.status}: ${authResponse.statusText}`);
    }

    const authResult = await authResponse.text();
    
    if (authResult.includes('error') || authResult.includes('fail')) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid GP51 credentials or API error',
          details: authResult
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Test a simple API call to verify token works
    const testResponse = await fetch(`${apiUrl}/QueryMonitorList`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        token: authResult.trim(),
        t: Date.now().toString()
      })
    });

    const testResult = await testResponse.text();
    
    if (testResult.includes('error') || !testResponse.ok) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'GP51 token validation failed',
          details: testResult
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ GP51 connection test successful');
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'GP51 connection verified',
        apiUrl,
        username
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ GP51 connection test failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Connection test failed' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function authenticateWithGP51(username: string, password: string, apiUrl: string) {
  try {
    console.log(`🔑 Authenticating with GP51 for ${username}...`);

    const authResponse = await fetch(`${apiUrl}/Login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        username,
        password,
        t: Date.now().toString()
      })
    });

    if (!authResponse.ok) {
      throw new Error(`HTTP ${authResponse.status}: ${authResponse.statusText}`);
    }

    const token = await authResponse.text();
    
    if (token.includes('error') || token.includes('fail')) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Authentication failed',
          details: token
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ GP51 authentication successful');
    return new Response(
      JSON.stringify({ 
        success: true,
        token: token.trim(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        apiUrl,
        username
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ GP51 authentication failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
