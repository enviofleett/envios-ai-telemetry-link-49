
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiagnosticTest {
  name: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

serve(async (req) => {
  console.log(`🔍 [GP51-DIAGNOSTIC] ${req.method} request received`);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adminSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the most recent valid session
    const { data: session, error: sessionError } = await adminSupabase
      .from('gp51_sessions')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (sessionError || !session) {
      console.error('❌ [GP51-DIAGNOSTIC] No valid session found:', sessionError);
      return new Response(JSON.stringify({
        success: false,
        error: 'No valid GP51 session found',
        details: sessionError
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`✅ [GP51-DIAGNOSTIC] Using session for user: ${session.username}`);

    // Use the specific token format provided by user
    const testToken = '3508e1e100a0030baa887cd7d92e279a';
    console.log(`🔍 [GP51-DIAGNOSTIC] Testing with provided token: ${testToken.substring(0, 8)}...`);

    // Define comprehensive test scenarios with the specific endpoint
    const tests: DiagnosticTest[] = [
      {
        name: "GET querydevicestree (corrected method)",
        url: `https://api.gps51.com/webapi?action=querydevicestree&token=${testToken}&extend=self&serverid=0`,
        method: "GET",
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Envio-GP51-Client/1.0'
        }
      },
      {
        name: "POST querydevicestree (original method)",
        url: `https://api.gps51.com/webapi?action=querydevicestree&token=${testToken}&extend=self&serverid=0`,
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Envio-GP51-Client/1.0'
        }
      },
      {
        name: "GET with stored session token",
        url: `https://api.gps51.com/webapi?action=querydevicestree&token=${session.gp51_token}&extend=self&serverid=0`,
        method: "GET",
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Envio-GP51-Client/1.0'
        }
      },
      {
        name: "GET querymonitorlist (alternative)",
        url: `https://api.gps51.com/webapi?action=querymonitorlist&token=${testToken}`,
        method: "GET",
        headers: {
          'Accept': 'application/json'
        }
      },
      {
        name: "POST with form data",
        url: `https://api.gps51.com/webapi`,
        method: "POST",
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `action=querydevicestree&token=${testToken}&extend=self&serverid=0`
      }
    ];

    const results = [];

    for (const test of tests) {
      console.log(`🧪 [GP51-DIAGNOSTIC] Running test: ${test.name}`);
      
      const startTime = Date.now();
      let result: any = {
        testName: test.name,
        url: test.url.replace(testToken, '[TOKEN_MASKED]').replace(session.gp51_token, '[SESSION_TOKEN_MASKED]'),
        method: test.method,
        requestHeaders: test.headers,
        requestBody: test.body || null,
        timestamp: new Date().toISOString(),
        duration: 0,
        success: false
      };

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch(test.url, {
          method: test.method,
          headers: test.headers,
          body: test.body || undefined,
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        result.duration = Date.now() - startTime;

        // Capture ALL response headers
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        // Capture raw response body
        const responseText = await response.text();
        
        result = {
          ...result,
          success: true,
          httpStatus: response.status,
          httpStatusText: response.statusText,
          responseHeaders,
          responseBodyRaw: responseText,
          responseBodyLength: responseText.length,
          isJsonResponse: responseHeaders['content-type']?.includes('application/json') || false
        };

        // Try to parse as JSON if it looks like JSON
        if (result.isJsonResponse || responseText.trim().startsWith('{')) {
          try {
            const parsedResponse = JSON.parse(responseText);
            result.responseBodyParsed = parsedResponse;
            
            // Check for GP51 API status
            if (parsedResponse.status !== undefined) {
              result.gp51Status = parsedResponse.status;
              result.gp51StatusMessage = parsedResponse.cause || parsedResponse.message || 'No message';
              
              if (parsedResponse.status === 0) {
                result.gp51Success = true;
                console.log(`✅ [GP51-DIAGNOSTIC] Test "${test.name}" - GP51 API success!`);
              } else {
                result.gp51Success = false;
                console.log(`⚠️ [GP51-DIAGNOSTIC] Test "${test.name}" - GP51 API error: ${result.gp51StatusMessage}`);
              }
            }
          } catch (parseError) {
            result.jsonParseError = parseError.message;
          }
        }

        console.log(`✅ [GP51-DIAGNOSTIC] Test "${test.name}" completed in ${result.duration}ms`);
        console.log(`📊 [GP51-DIAGNOSTIC] Status: ${response.status}, Body length: ${responseText.length}`);

      } catch (error) {
        result.duration = Date.now() - startTime;
        result.error = error.message;
        result.errorType = error.name;
        
        if (error.name === 'AbortError') {
          result.timedOut = true;
        }

        console.error(`❌ [GP51-DIAGNOSTIC] Test "${test.name}" failed:`, error);
      }

      results.push(result);
    }

    // Additional system diagnostics
    const diagnosticInfo = {
      timestamp: new Date().toISOString(),
      sessionInfo: {
        username: session.username,
        tokenLength: session.gp51_token?.length || 0,
        tokenExpiry: session.token_expires_at,
        apiUrl: session.api_url,
        sessionAge: Math.floor((Date.now() - new Date(session.created_at).getTime()) / 1000 / 60) // minutes
      },
      testTokenInfo: {
        providedToken: testToken,
        tokenLength: testToken.length,
        tokenFormat: 'hex-md5-like'
      },
      networkInfo: {
        userAgent: req.headers.get('user-agent'),
        origin: req.headers.get('origin'),
        referer: req.headers.get('referer')
      }
    };

    const response = {
      success: true,
      message: 'GP51 diagnostic tests completed with improved token and method testing',
      diagnosticInfo,
      testResults: results,
      summary: {
        totalTests: results.length,
        successfulTests: results.filter(r => r.success).length,
        failedTests: results.filter(r => !r.success).length,
        timeoutTests: results.filter(r => r.timedOut).length,
        gp51SuccessfulTests: results.filter(r => r.gp51Success).length
      }
    };

    console.log(`📋 [GP51-DIAGNOSTIC] All tests completed. Success: ${response.summary.successfulTests}/${response.summary.totalTests}, GP51 Success: ${response.summary.gp51SuccessfulTests}`);

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ [GP51-DIAGNOSTIC] Unexpected error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Diagnostic test failed',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
