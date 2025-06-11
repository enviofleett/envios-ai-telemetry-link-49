
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Improved MD5 hash implementation
async function createMD5Hash(input: string): Promise<string> {
  try {
    console.log(`Creating MD5 hash for input of length: ${input.length}`);
    
    // Use Web Crypto API for MD5
    const data = new TextEncoder().encode(input);
    const hashBuffer = await crypto.subtle.digest('MD5', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    console.log('MD5 hash created successfully (lowercase hex)');
    return hash;
  } catch (error) {
    console.error('MD5 creation failed, using fallback:', error);
    
    // Fallback implementation
    const { createHash } = await import('https://deno.land/std@0.168.0/node/crypto.ts');
    const hash = createHash('md5');
    hash.update(input);
    const result = hash.digest('hex');
    console.log('Fallback MD5 hash created successfully');
    return result;
  }
}

async function testGP51Authentication(username: string, password: string): Promise<{
  success: boolean;
  method?: string;
  error?: string;
  response?: any;
}> {
  const trimmedUsername = username.trim();
  console.log(`🔐 Testing GP51 authentication for user: ${trimmedUsername}`);
  
  try {
    // Create MD5 hash of password
    const hashedPassword = await createMD5Hash(password);
    console.log(`✅ Password hashed successfully`);
    
    // Test Method 1: GET request (as suggested in the plan)
    console.log('🌐 Testing Method 1: GET request format...');
    const getUrl = `https://www.gps51.com/webapi?action=login&username=${encodeURIComponent(trimmedUsername)}&password=${encodeURIComponent(hashedPassword)}`;
    
    const getResponse = await fetch(getUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FleetIQ/1.0'
      }
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
    
    // Test Method 2: POST with JSON (current implementation)
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
        password: hashedPassword
      })
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
      password: hashedPassword
    });
    
    const formResponse = await fetch('https://www.gps51.com/webapi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'FleetIQ/1.0'
      },
      body: formData.toString()
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
        console.log(`❌ All methods failed. Last error: ${formResult.cause || formResult.message || 'Unknown'}`);
        return {
          success: false,
          error: formResult.cause || formResult.message || 'Authentication failed with all methods'
        };
      }
    }
    
    return {
      success: false,
      error: 'All authentication methods failed'
    };
    
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

    const { action, username, password } = await req.json();
    
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
            gp51_token: result.response?.token,
            auth_method: result.method,
            token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
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
