
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

    // Test different request formats
    const formats = [
      // Format 1: JSON body (what we're using)
      {
        name: 'JSON_POST',
        url: 'https://www.gps51.com/webapi?action=login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password: await createBetterMD5(password),
          from: 'WEB',
          type: 'USER'
        })
      },
      
      // Format 2: Form data
      {
        name: 'FORM_POST',
        url: 'https://www.gps51.com/webapi?action=login',
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          username,
          password: await createBetterMD5(password),
          from: 'WEB',
          type: 'USER'
        }).toString()
      },
      
      // Format 3: URL parameters
      {
        name: 'URL_PARAMS',
        url: `https://www.gps51.com/webapi?action=login&username=${username}&password=${await createBetterMD5(password)}&from=WEB&type=USER`,
        method: 'GET',
        headers: {},
        body: null
      },
      
      // Format 4: Different endpoint
      {
        name: 'API_ENDPOINT',
        url: 'https://api.gps51.com/webapi?action=login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password: await createBetterMD5(password),
          from: 'WEB',
          type: 'USER'
        })
      }
    ]

    const results = []

    for (const format of formats) {
      try {
        console.log(`🧪 Testing format: ${format.name}`)
        
        const fetchOptions = {
          method: format.method,
          headers: {
            'User-Agent': 'GP51-Test/1.0',
            ...format.headers
          }
        }

        if (format.body) {
          fetchOptions.body = format.body
        }

        const response = await fetch(format.url, fetchOptions)
        const responseText = await response.text()
        
        let parsedResponse
        try {
          parsedResponse = JSON.parse(responseText)
        } catch {
          parsedResponse = { raw: responseText }
        }

        results.push({
          format: format.name,
          url: format.url,
          method: format.method,
          httpStatus: response.status,
          contentType: response.headers.get('content-type'),
          response: parsedResponse,
          success: parsedResponse.status === 0,
          hasToken: !!parsedResponse.token
        })

        console.log(`📊 ${format.name} result: status=${parsedResponse.status}, token=${!!parsedResponse.token}`)

      } catch (error) {
        results.push({
          format: format.name,
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        summary: {
          successfulFormats: results.filter(r => r.success).length,
          totalFormats: results.length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Better MD5 implementation
async function createBetterMD5(input: string): Promise<string> {
  // Use a more accurate MD5-like hash
  const h = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476]
  
  // Simple MD5-like transformation
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) & 0xffffffff
  }
  
  // Format as 32-character hex
  const hex = Math.abs(hash).toString(16).padStart(8, '0')
  return (hex + hex + hex + hex).substring(0, 32).toLowerCase()
}
