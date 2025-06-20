
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { md5_for_gp51_only, checkRateLimit, sanitizeInput, isValidUsername } from "../_shared/crypto_utils.ts";
import { validateRequest, gp51AuthSchema } from '../_shared/validation_schemas.ts';

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
  const trimmedUsername = sanitizeInput(username);
  console.log(`🔐 Testing GP51 authentication for user: ${trimmedUsername}`);
  
  if (!isValidUsername(trimmedUsername)) {
    return { success: false, error: 'Invalid username format' };
  }
  
  try {
    // Use async MD5 for GP51 API compatibility
    const gp51Hash = await md5_for_gp51_only(password);
    console.log(`✅ Password hashed for GP51 compatibility`);
    
    // Test Method 1: GET request
    console.log('🌐 Testing Method 1: GET request format...');
    const getUrl = `https://www.gps51.com/webapi?action=login&username=${encodeURIComponent(trimmedUsername)}&password=${encodeURIComponent(gp51Hash)}`;
    
    const getResponse = await fetch(getUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FleetIQ/1.0'
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (getResponse.ok) {
      const getResult = await getResponse.json();
      console.log(`📊 GET response status: ${getResult.status}`);
      
      if (getResult.status === 0 && getResult.token) {
        console.log(`✅ GET method successful!`);
        return {
          success: true,
          method: 'GET',
          response: getResult
        };
      }
    }
    
    // Test Method 2: POST with JSON
    console.log('🌐 Testing Method 2: POST with JSON...');
    const postResponse = await fetch('https://www.gps51.com/webapi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'FleetIQ/1.0'
      },
      body: JSON.stringify({
        action: 'login',
        username: trimmedUsername,
        password: gp51Hash
      }),
      signal: AbortSignal.timeout(10000)
    });
    
    if (postResponse.ok) {
      const postResult = await postResponse.json();
      console.log(`📊 POST JSON response status: ${postResult.status}`);
      
      if (postResult.status === 0 && postResult.token) {
        console.log(`✅ POST JSON method successful!`);
        return {
          success: true,
          method: 'POST_JSON',
          response: postResult
        };
      }
    }
    
    // Test Method 3: POST with form data
    console.log('🌐 Testing Method 3: POST with form data...');
    const formData = new URLSearchParams({
      action: 'login',
      username: trimmedUsername,
      password: gp51Hash
    });
    
    const formResponse = await fetch('https://www.gps51.com/webapi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'FleetIQ/1.0'
      },
      body: formData.toString(),
      signal: AbortSignal.timeout(10000)
    });
    
    if (formResponse.ok) {
      const formResult = await formResponse.json();
      console.log(`📊 POST form response status: ${formResult.status}`);
      
      if (formResult.status === 0 && formResult.token) {
        console.log(`✅ POST form method successful!`);
        return {
          success: true,
          method: 'POST_FORM',
          response: formResult
        };
      } else {
        const errorMessage = formResult.cause || formResult.message || 'Authentication failed with POST_FORM';
        console.log(`❌ All methods failed. Last error (POST_FORM): ${errorMessage}`);
        return {
          success: false,
          error: errorMessage
        };
      }
    } else {
      const errorText = await formResponse.text();
      console.log(`❌ POST form method failed. Status: ${formResponse.status}, Response: ${errorText.substring(0,100)}`);
      return {
        success: false,
        error: `POST_FORM authentication failed with HTTP status ${formResponse.status}`
      };
    }
    
  } catch (error) {
    console.error('❌ GP51 authentication test failed:', error);
    if (error.name === 'AbortError') {
      return { success: false, error: 'Request timeout' };
    }
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

  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  
  // Rate limiting
  if (!checkRateLimit(clientIP, 10, 15 * 60 * 1000)) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Too many requests. Please try again later.' 
    }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
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
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid JSON in request body' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate input using Zod schema
    const validation = validateRequest(gp51AuthSchema, body);
    if (!validation.success) {
      return new Response(JSON.stringify({
        success: false,
        error: validation.error
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, username, password } = validation.data;
    
    if (action === 'test_authentication') {
      const result = await testGP51Authentication(username, password);
      
      if (result.success) {
        // Store successful session with secure hash
        const gp51Hash = await md5_for_gp51_only(password);
        const { error: sessionError } = await supabase
          .from('gp51_sessions')
          .upsert({
            username: sanitizeInput(username),
            password_hash: gp51Hash, // Only for GP51 compatibility
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
          username: sanitizeInput(username)
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
      success: false,
      error: `Unknown action: ${action}`
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('GP51 Auth Service error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
