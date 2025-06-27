
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { username, password } = await req.json()
    
    console.log(`🧪 Testing credentials for user: ${username}`)

    // Test multiple MD5 implementations
    const hashResults = {
      method1: await createMD5Method1(password),
      method2: createMD5Method2(password),
      method3: createMD5Method3(password),
      simple: createSimpleHash(password)
    }

    console.log("🔐 Hash comparison:", hashResults)

    // Test each hash method against GP51
    const testResults = []

    for (const [method, hash] of Object.entries(hashResults)) {
      try {
        console.log(`🌐 Testing ${method} with hash: ${hash}`)

        const response = await fetch('https://www.gps51.com/webapi?action=login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Test/1.0'
          },
          body: JSON.stringify({
            username,
            password: hash,
            from: 'WEB',
            type: 'USER'
          })
        })

        const responseText = await response.text()
        let parsedResponse
        
        try {
          parsedResponse = JSON.parse(responseText)
        } catch {
          parsedResponse = { raw: responseText }
        }

        testResults.push({
          method,
          hash,
          httpStatus: response.status,
          gp51Response: parsedResponse,
          success: parsedResponse.status === 0
        })

        console.log(`📊 ${method} result:`, parsedResponse)

      } catch (error) {
        testResults.push({
          method,
          hash,
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        username,
        hashComparison: hashResults,
        testResults,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Method 1: Web Crypto API (SHA-256 truncated)
async function createMD5Method1(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hex.substring(0, 32).toLowerCase()
}

// Method 2: Simple MD5-like algorithm
function createMD5Method2(input: string): string {
  let hash = 0x67452301
  let i = 0
  
  while (i < input.length) {
    hash = Math.imul(hash ^ input.charCodeAt(i++), 2654435761)
  }
  
  hash = (hash ^ hash >>> 16) >>> 0
  let result = hash.toString(16)
  while (result.length < 32) {
    result = '0' + result
  }
  return result.toLowerCase()
}

// Method 3: Another MD5 simulation
function createMD5Method3(input: string): string {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  
  // Convert to hex and pad to 32 chars
  let hex = Math.abs(hash).toString(16)
  while (hex.length < 32) {
    hex = '0' + hex
  }
  return hex.toLowerCase()
}

// Simple hash (what we were using before)
function createSimpleHash(input: string): string {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i)
    hash = hash & hash
  }
  
  let result = Math.abs(hash).toString(16)
  while (result.length < 32) {
    result = '0' + result
  }
  return result.toLowerCase()
}
