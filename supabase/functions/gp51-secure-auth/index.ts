
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHash } from 'https://deno.land/std@0.177.0/node/crypto.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Standardized GP51 endpoint
const GP51_BASE_URL = 'https://gps51.com/webapi';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log("🚀 GP51 Secure Auth - Standardized Implementation")

  try {
    // Auth verification
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ success: false, error: 'Authorization required' }, 401)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return jsonResponse({ success: false, error: 'User not authenticated' }, 401)
    }

    console.log("✅ User authenticated")

    // Parse request
    const { username, password } = await req.json()
    if (!username || !password) {
      return jsonResponse({ success: false, error: 'Username and password required' }, 400)
    }

    console.log(`🔐 Processing GP51 authentication for user: ${username}`)

    // Check for existing valid session first
    const existingToken = user.user_metadata?.gp51_token;
    const tokenExpires = user.user_metadata?.gp51_token_expires;
    
    if (existingToken && tokenExpires) {
      const expiryDate = new Date(tokenExpires);
      if (expiryDate > new Date()) {
        console.log("✅ Using existing valid GP51 token");
        return jsonResponse({
          success: true,
          message: 'Using existing GP51 session',
          token: existingToken,
          username: user.user_metadata?.gp51_username || username,
          apiUrl: GP51_BASE_URL,
          expiresAt: tokenExpires
        });
      }
    }

    // Generate real MD5 hash
    const realMD5Hash = createRealMD5Hash(password)
    console.log(`🔐 Generated MD5 hash (length: ${realMD5Hash.length})`)

    // Validate hash format
    if (realMD5Hash.length !== 32) {
      console.error(`❌ Invalid hash length: ${realMD5Hash.length}`)
      return jsonResponse({ 
        success: false, 
        error: 'Hash generation failed',
        debug: `Expected 32 chars, got ${realMD5Hash.length}`
      }, 500)
    }

    // Call GP51 API with standardized endpoint
    console.log("🌐 Calling GP51 with standardized endpoint...")
    const response = await fetch(`${GP51_BASE_URL}?action=login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Envios-Fleet/1.0',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        username,
        password: realMD5Hash,
        from: 'WEB',
        type: 'USER'
      })
    })

    console.log(`📡 GP51 response status: ${response.status}`)

    if (!response.ok) {
      return jsonResponse({ 
        success: false, 
        error: `GP51 API error: ${response.status}` 
      }, 502)
    }

    const responseText = await response.text()
    console.log(`📄 GP51 response: ${responseText.substring(0, 200)}...`)

    let gp51Result
    try {
      gp51Result = JSON.parse(responseText)
    } catch (parseError) {
      console.error("❌ JSON parse failed:", parseError)
      return jsonResponse({ 
        success: false, 
        error: 'Invalid response from GP51',
        debug: responseText.substring(0, 200)
      }, 502)
    }

    console.log(`📊 GP51 result status: ${gp51Result.status}`)

    if (gp51Result.status === 0 && gp51Result.token) {
      console.log("🎉 GP51 authentication successful!")
      
      // Store token in user metadata with expiration
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 23); // GP51 tokens typically last 24 hours

      await supabase.auth.updateUser({
        data: { 
          gp51_token: gp51Result.token,
          gp51_username: username,
          gp51_token_expires: expiresAt.toISOString(),
          gp51_login_time: new Date().toISOString()
        }
      })

      return jsonResponse({
        success: true,
        message: 'GP51 authentication successful',
        token: gp51Result.token,
        username: gp51Result.username,
        apiUrl: GP51_BASE_URL,
        expiresAt: expiresAt.toISOString()
      })
    } else {
      console.error(`❌ GP51 authentication failed: status=${gp51Result.status}, cause=${gp51Result.cause}`)
      
      // Check for specific error messages
      let errorMessage = gp51Result.cause || 'GP51 authentication failed'
      if (gp51Result.status === 1 && !gp51Result.cause) {
        errorMessage = 'Invalid username or password'
      }
      
      return jsonResponse({
        success: false,
        error: errorMessage,
        gp51_status: gp51Result.status,
        debug: `GP51 returned: ${JSON.stringify(gp51Result)}`
      }, 401)
    }

  } catch (error) {
    console.error("💥 GP51 Auth Error:", error)
    return jsonResponse({
      success: false,
      error: 'Internal server error',
      debug: error.message
    }, 500)
  }
})

// Real MD5 hash function using Node.js crypto
function createRealMD5Hash(input: string): string {
  try {
    const hash = createHash('md5')
    hash.update(input, 'utf8')
    const result = hash.digest('hex').toLowerCase()
    console.log(`🔐 Real MD5 generated: length=${result.length}`)
    return result
  } catch (error) {
    console.error("❌ Real MD5 failed:", error)
    throw new Error('MD5 hash generation failed')
  }
}

// Helper for JSON responses
function jsonResponse(data: any, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}
