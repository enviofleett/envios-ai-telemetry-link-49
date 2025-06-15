// Trigger re-deploy - 2025-06-14
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { md5_sync } from "../_shared/crypto_utils.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function testGP51Authentication(username: string, password: string): Promise<{
  success: boolean;
  method?: string;
  error?: string;
  response?: any;
}> {
  const trimmedUsername = username.trim();
  console.log(`🔐 Standardizing GP51 authentication for user: ${trimmedUsername}`);
  
  try {
    const hashedPassword = md5_sync(password);
    console.log(`✅ Password hashed successfully. Using POST_JSON method.`);
    
    const response = await fetch('https://www.gps51.com/webapi?action=login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'FleetIQ/1.0'
      },
      body: JSON.stringify({
        action: 'login', // Redundant but safe
        username: trimmedUsername,
        password: hashedPassword,
        from: 'WEB',
        type: 'USER',
      })
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        console.log(`❌ POST JSON method failed. Status: ${response.status}, Response: ${errorText.substring(0,200)}`);
         return {
          success: false,
          error: `Authentication failed with HTTP status ${response.status}`
        };
    }

    const postResult = await response.json();
    console.log(`📊 POST JSON response status: ${postResult.status}`);
    
    if (postResult.status === 0 && postResult.token) {
      console.log(`✅ POST JSON method successful!`);
      return {
        success: true,
        method: 'POST_JSON',
        response: postResult
      };
    } else {
      const errorMessage = postResult.cause || postResult.message || 'Authentication failed';
      console.log(`❌ POST JSON method failed. Error: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage
      };
    }
  } catch (error) {
    console.error('❌ GP51 authentication test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown authentication error'
    };
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

    const body = await req.json().catch((e) => {
      console.error('Failed to parse JSON body:', e.message);
      return null;
    });

    if (!body) {
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, username, password, ...otherParams } = body;
    
    if (action === 'test_authentication') {
      if (!username || !password) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Username and password are required'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const result = await testGP51Authentication(username, password);
      
      if (result.success) {
        // Store successful session
        const { error: sessionError } = await supabase
          .from('gp51_sessions')
          .upsert({
            username: username.trim(),
            password_hash: md5_sync(password),
            gp51_token: result.response?.token,
            auth_method: result.method,
            token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            last_validated_at: new Date().toISOString(),
            created_at: new Date().toISOString()
          }, {
            onConflict: 'username'
          });

        if (sessionError) {
          console.warn('Failed to store session:', sessionError);
        }

        return new Response(JSON.stringify({
          success: true,
          token: result.response?.token,
          method: result.method,
          username: username.trim()
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else {
        return new Response(JSON.stringify({
          success: false,
          error: result.error || 'Authentication failed'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({
      error: `Unknown action: ${action}`
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('GP51 Auth Service error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
