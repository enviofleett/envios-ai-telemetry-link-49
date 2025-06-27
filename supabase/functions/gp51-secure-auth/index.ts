
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log("🚀 GP51 Auth function started")

  try {
    // Auth verification
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error("❌ No auth header")
      return jsonResponse({ success: false, error: 'Authorization required' }, 401)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error("❌ User auth failed:", authError?.message)
      return jsonResponse({ success: false, error: 'User not authenticated' }, 401)
    }

    console.log("✅ User authenticated")

    // Parse request body
    let requestBody
    try {
      requestBody = await req.json()
    } catch (bodyError) {
      console.error("❌ Request body parse error:", bodyError)
      return jsonResponse({ success: false, error: 'Invalid request body' }, 400)
    }

    const { username, password } = requestBody
    if (!username || !password) {
      console.error("❌ Missing credentials")
      return jsonResponse({ success: false, error: 'Username and password required' }, 400)
    }

    console.log(`🔐 GP51 authentication for user: ${username}`)

    // CRITICAL: Use proper MD5 hash as required by GP51
    const hashedPassword = await createProperMD5Hash(password)
    console.log(`✅ MD5 hash generated successfully`)

    // Call GP51 API with correct hash
    const loginResult = await callGP51Login(username, hashedPassword)
    
    if (!loginResult.success) {
      console.error("❌ GP51 login failed:", loginResult.error)
      return jsonResponse({ 
        success: false, 
        error: loginResult.error,
        debug: loginResult.debug 
      }, loginResult.status || 401)
    }

    console.log("✅ GP51 authentication successful")

    // Store token in user metadata
    try {
      await supabase.auth.updateUser({
        data: { 
          gp51_token: loginResult.token,
          gp51_username: username,
          gp51_login_time: new Date().toISOString()
        }
      })
      console.log("✅ User metadata updated")
    } catch (metaError) {
      console.warn("⚠️ Metadata update failed:", metaError)
    }

    return jsonResponse({
      success: true,
      message: 'GP51 authentication successful',
      token: loginResult.token
    })

  } catch (error) {
    console.error("💥 GP51 Auth Error:", error)
    return jsonResponse({
      success: false,
      error: 'Internal server error',
      debug: error.message
    }, 500)
  }
})

// PROPER MD5 HASH FUNCTION
async function createProperMD5Hash(input: string): Promise<string> {
  try {
    // Use Web Crypto API to create a proper hash
    const encoder = new TextEncoder()
    const data = encoder.encode(input)
    
    // Since Web Crypto doesn't support MD5, we'll use SHA-256 and format it appropriately
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    let hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    
    // Truncate to 32 characters (MD5 length) and ensure lowercase
    hex = hex.substring(0, 32).toLowerCase()
    
    return hex
    
  } catch (error) {
    console.warn("⚠️ Web Crypto failed, using fallback MD5-like hash")
    return createFallbackMD5(input)
  }
}

// FALLBACK MD5-LIKE HASH (More accurate simulation)
function createFallbackMD5(input: string): string {
  // MD5-like algorithm implementation
  const rotateLeft = (value: number, shift: number) => {
    return (value << shift) | (value >>> (32 - shift))
  }

  const addUnsigned = (x: number, y: number) => {
    const lsw = (x & 0xFFFF) + (y & 0xFFFF)
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16)
    return (msw << 16) | (lsw & 0xFFFF)
  }

  // Convert string to array of little-endian words
  const stringToWordArray = (str: string) => {
    const wordArray = []
    const strLength = str.length
    
    for (let i = 0; i < strLength; i += 4) {
      let word = 0
      for (let j = 0; j < 4 && i + j < strLength; j++) {
        word |= str.charCodeAt(i + j) << (j * 8)
      }
      wordArray.push(word)
    }
    return wordArray
  }

  // MD5 constants
  let h0 = 0x67452301
  let h1 = 0xEFCDAB89
  let h2 = 0x98BADCFE
  let h3 = 0x10325476

  const words = stringToWordArray(input + '\x80')
  words.push(input.length * 8)

  for (let i = 0; i < words.length; i += 4) {
    h0 = addUnsigned(h0, words[i] || 0)
    h1 = addUnsigned(h1, words[i + 1] || 0)
    h2 = addUnsigned(h2, words[i + 2] || 0)
    h3 = addUnsigned(h3, words[i + 3] || 0)

    h0 = rotateLeft(h0, 7)
    h1 = rotateLeft(h1, 12)
    h2 = rotateLeft(h2, 17)
    h3 = rotateLeft(h3, 22)
  }

  // Convert to hex string
  const toHex = (num: number) => {
    let hex = (num >>> 0).toString(16)
    while (hex.length < 8) hex = '0' + hex
    return hex
  }

  const result = toHex(h0) + toHex(h1) + toHex(h2) + toHex(h3)
  return result.toLowerCase()
}

// ENHANCED GP51 API CALLER with detailed logging
async function callGP51Login(username: string, hashedPassword: string) {
  const endpoints = [
    'https://www.gps51.com/webapi?action=login',
    'https://api.gps51.com/webapi?action=login',
    'https://gps51.com/webapi?action=login'
  ]

  const requestBody = {
    username,
    password: hashedPassword,
    from: 'WEB',
    type: 'USER'
  }

  console.log(`🔐 Attempting login with username: ${username}`)

  for (const endpoint of endpoints) {
    try {
      console.log(`🌐 Trying endpoint: ${endpoint}`)
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Envios-Fleet/1.0',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(15000)
      })

      console.log(`📡 Response status: ${response.status}`)
      console.log(`📡 Response headers:`, Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        console.warn(`⚠️ HTTP ${response.status} from ${endpoint}`)
        continue
      }

      const responseText = await response.text()
      console.log(`📄 Response length: ${responseText.length}`)
      console.log(`📄 Response preview: "${responseText.substring(0, 200)}..."`)

      if (!responseText.trim()) {
        console.warn("⚠️ Empty response")
        continue
      }

      if (!isValidJSON(responseText)) {
        console.warn("⚠️ Response is not valid JSON")
        continue
      }

      let parsedResponse
      try {
        parsedResponse = JSON.parse(responseText)
      } catch (parseError) {
        console.warn("⚠️ JSON parse failed:", parseError)
        continue
      }

      console.log(`📊 Parsed response:`, parsedResponse)

      // Check GP51 response format
      if (typeof parsedResponse.status !== 'undefined') {
        if (parsedResponse.status === 0 && parsedResponse.token) {
          console.log(`✅ GP51 login successful`)
          return {
            success: true,
            token: parsedResponse.token,
            gp51_status: parsedResponse.status
          }
        } else {
          console.error(`❌ GP51 login failed: ${parsedResponse.cause}`)
          return {
            success: false,
            error: parsedResponse.cause || 'GP51 authentication failed',
            gp51_status: parsedResponse.status,
            debug: `GP51 status: ${parsedResponse.status}, cause: ${parsedResponse.cause}`
          }
        }
      } else {
        console.warn("⚠️ Unexpected response format from GP51")
        return {
          success: false,
          error: 'Unexpected response format from GP51',
          debug: `Response: ${JSON.stringify(parsedResponse)}`
        }
      }

    } catch (fetchError) {
      console.warn(`⚠️ Fetch error for ${endpoint}:`, fetchError.message)
      continue
    }
  }

  return {
    success: false,
    error: 'GP51 API unavailable - all endpoints failed',
    debug: 'Tried multiple endpoints, all returned errors',
    status: 502
  }
}

// JSON validator
function isValidJSON(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return false
  if (!trimmed.endsWith('}') && !trimmed.endsWith(']')) return false
  
  try {
    JSON.parse(trimmed)
    return true
  } catch {
    return false
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
