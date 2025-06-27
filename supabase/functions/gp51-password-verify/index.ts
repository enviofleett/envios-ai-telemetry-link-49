
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createHash } from 'https://deno.land/std@0.177.0/node/crypto.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { testPassword } = await req.json()
    
    console.log("🧪 Testing MD5 implementation...")
    
    // Test known MD5 values to verify our implementation
    const testCases = [
      { input: 'password', expected: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8' },
      { input: 'test', expected: '098f6bcd4621d373cade4e832627b4f6' },
      { input: '123456', expected: 'e10adc3949ba59abbe56e057f20f883e' },
      { input: 'hello', expected: '5d41402abc4b2a76b9719d911017c592' }
    ]

    const results = []

    for (const testCase of testCases) {
      try {
        const hash = createHash('md5')
        hash.update(testCase.input, 'utf8')
        const computed = hash.digest('hex').toLowerCase()
        
        results.push({
          input: testCase.input,
          expected: testCase.expected,
          computed,
          matches: computed === testCase.expected
        })

        console.log(`📝 Test "${testCase.input}": ${computed === testCase.expected ? '✅' : '❌'}`)
      } catch (error) {
        results.push({
          input: testCase.input,
          expected: testCase.expected,
          computed: 'ERROR',
          matches: false,
          error: error.message
        })
      }
    }

    // Test your password
    let yourPasswordHash = null
    if (testPassword) {
      try {
        const hash = createHash('md5')
        hash.update(testPassword, 'utf8')
        yourPasswordHash = hash.digest('hex').toLowerCase()
        console.log(`🔐 Your password hash: ${yourPasswordHash}`)
      } catch (error) {
        yourPasswordHash = `ERROR: ${error.message}`
      }
    }

    const allTestsPassed = results.every(r => r.matches)
    console.log(`📊 MD5 Tests: ${allTestsPassed ? '✅ ALL PASSED' : '❌ SOME FAILED'}`)

    return new Response(
      JSON.stringify({
        success: true,
        md5Tests: results,
        allTestsPassed,
        yourPasswordHash,
        md5Available: true,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error("💥 Password verify error:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        md5Available: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
