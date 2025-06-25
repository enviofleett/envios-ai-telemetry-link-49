
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiagnosticTestResult {
  testName: string;
  url: string;
  method: string;
  requestHeaders: Record<string, string>;
  requestBody?: string;
  timestamp: string;
  duration: number;
  success: boolean;
  httpStatus?: number;
  httpStatusText?: string;
  responseHeaders?: Record<string, string>;
  responseBodyRaw?: string;
  responseBodyLength?: number;
  responseBodyParsed?: any;
  isJsonResponse?: boolean;
  jsonParseError?: string;
  error?: string;
  errorType?: string;
  timedOut?: boolean;
}

interface DiagnosticResponse {
  success: boolean;
  message: string;
  diagnosticInfo: {
    timestamp: string;
    sessionInfo: {
      username: string;
      tokenLength: number;
      tokenExpiry: string;
      apiUrl: string;
      sessionAge: number;
    };
    networkInfo: {
      userAgent?: string;
      origin?: string;
      referer?: string;
    };
  };
  testResults: DiagnosticTestResult[];
  summary: {
    totalTests: number;
    successfulTests: number;
    failedTests: number;
    timeoutTests: number;
  };
}

serve(async (req) => {
  console.log(`🔍 GP51 Raw Diagnostic: ${req.method} ${req.url}`);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Fetch authentication token for 'octopus' user
    console.log(`🔑 Fetching authentication token for user 'octopus'...`);
    
    const { data: sessions, error: sessionError } = await supabase
      .from('gp51_sessions')
      .select('*')
      .eq('username', 'octopus')
      .order('created_at', { ascending: false })
      .limit(1);

    if (sessionError) {
      throw new Error(`Failed to fetch GP51 session: ${sessionError.message}`);
    }

    if (!sessions || sessions.length === 0) {
      throw new Error(`No GP51 session found for user 'octopus'`);
    }

    const session = sessions[0];
    const token = session.gp51_token;
    const tokenExpiry = new Date(session.token_expires_at);
    const now = new Date();

    console.log(`✅ Found session for user: ${session.username}`);
    console.log(`🔑 Token length: ${token.length}`);
    console.log(`⏰ Token expires: ${tokenExpiry.toISOString()}`);
    console.log(`⏱️ Time until expiry: ${Math.round((tokenExpiry.getTime() - now.getTime()) / 1000)} seconds`);

    // Check if token is expired
    if (tokenExpiry <= now) {
      throw new Error(`GP51 token for 'octopus' has expired at ${tokenExpiry.toISOString()}`);
    }

    const testResults: DiagnosticTestResult[] = [];
    const timestamp = new Date().toISOString();

    // Network info from request headers
    const networkInfo = {
      userAgent: req.headers.get('user-agent') || undefined,
      origin: req.headers.get('origin') || undefined,
      referer: req.headers.get('referer') || undefined,
    };

    // Test 1: POST to querydevicestree with body parameters
    await runDiagnosticTest(
      testResults,
      'GP51 querydevicestree (POST with body)',
      'POST',
      `https://api.gps51.com/webapi?action=querydevicestree`,
      {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Envio-GP51-Diagnostic/1.0'
      },
      JSON.stringify({
        token: token,
        extend: 'self',
        serverid: '0'
      })
    );

    // Test 2: POST with URL parameters
    await runDiagnosticTest(
      testResults,
      'GP51 querydevicestree (POST with URL params)',
      'POST',
      `https://api.gps51.com/webapi?action=querydevicestree&token=${token}&extend=self&serverid=0`,
      {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Envio-GP51-Diagnostic/1.0'
      },
      JSON.stringify({})
    );

    // Test 3: GET with URL parameters (as specified in prompt)
    await runDiagnosticTest(
      testResults,
      'GP51 querydevicestree (GET with URL params)',
      'GET',
      `https://api.gps51.com/webapi?action=querydevicestree&token=${token}&extend=self&serverid=0`,
      {
        'Accept': 'application/json',
        'User-Agent': 'Envio-GP51-Diagnostic/1.0'
      }
    );

    // Test 4: Alternative POST format as mentioned in logs
    await runDiagnosticTest(
      testResults,
      'GP51 querydevicestree (POST alternative format)',
      'POST',
      `https://api.gps51.com/webapi`,
      {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'Envio-GP51-Diagnostic/1.0'
      },
      `action=querydevicestree&token=${token}&extend=self&serverid=0`
    );

    // Calculate summary
    const summary = {
      totalTests: testResults.length,
      successfulTests: testResults.filter(t => t.success && !t.timedOut).length,
      failedTests: testResults.filter(t => !t.success && !t.timedOut).length,
      timeoutTests: testResults.filter(t => t.timedOut).length
    };

    const diagnosticResponse: DiagnosticResponse = {
      success: summary.failedTests === 0,
      message: summary.failedTests === 0 
        ? `All ${summary.totalTests} tests completed successfully` 
        : `${summary.failedTests} of ${summary.totalTests} tests failed`,
      diagnosticInfo: {
        timestamp,
        sessionInfo: {
          username: session.username,
          tokenLength: token.length,
          tokenExpiry: tokenExpiry.toISOString(),
          apiUrl: 'https://api.gps51.com/webapi',
          sessionAge: Math.round((now.getTime() - new Date(session.created_at).getTime()) / 1000)
        },
        networkInfo
      },
      testResults,
      summary
    };

    console.log(`✅ Diagnostic completed. ${summary.successfulTests}/${summary.totalTests} tests successful`);

    return new Response(JSON.stringify(diagnosticResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ GP51 Raw Diagnostic failed:', error);
    
    const errorResponse: DiagnosticResponse = {
      success: false,
      message: `Diagnostic failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      diagnosticInfo: {
        timestamp: new Date().toISOString(),
        sessionInfo: {
          username: 'unknown',
          tokenLength: 0,
          tokenExpiry: '',
          apiUrl: 'https://api.gps51.com/webapi',
          sessionAge: 0
        },
        networkInfo: {}
      },
      testResults: [],
      summary: {
        totalTests: 0,
        successfulTests: 0,
        failedTests: 0,
        timeoutTests: 0
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function runDiagnosticTest(
  testResults: DiagnosticTestResult[],
  testName: string,
  method: string,
  url: string,
  headers: Record<string, string>,
  body?: string
): Promise<void> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  console.log(`🧪 Starting test: ${testName}`);
  console.log(`📡 ${method} ${url}`);
  
  const testResult: DiagnosticTestResult = {
    testName,
    url,
    method,
    requestHeaders: headers,
    requestBody: body,
    timestamp,
    duration: 0,
    success: false
  };

  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const fetchOptions: RequestInit = {
      method,
      headers,
      signal: controller.signal
    };

    if (body && method !== 'GET') {
      fetchOptions.body = body;
    }

    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);
    
    const endTime = Date.now();
    testResult.duration = endTime - startTime;
    testResult.httpStatus = response.status;
    testResult.httpStatusText = response.statusText;

    // Capture all response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    testResult.responseHeaders = responseHeaders;

    // Capture raw response body
    const responseBodyRaw = await response.text();
    testResult.responseBodyRaw = responseBodyRaw;
    testResult.responseBodyLength = responseBodyRaw.length;

    // Try to parse as JSON
    try {
      const parsed = JSON.parse(responseBodyRaw);
      testResult.responseBodyParsed = parsed;
      testResult.isJsonResponse = true;
    } catch (parseError) {
      testResult.isJsonResponse = false;
      testResult.jsonParseError = parseError instanceof Error ? parseError.message : 'Unknown JSON parse error';
    }

    // Determine success
    testResult.success = response.ok && testResult.isJsonResponse && 
      (!testResult.responseBodyParsed?.status || testResult.responseBodyParsed.status === 0);

    if (!testResult.success && testResult.responseBodyParsed) {
      testResult.error = testResult.responseBodyParsed.cause || 
                        testResult.responseBodyParsed.message || 
                        `HTTP ${response.status}: ${response.statusText}`;
    } else if (!testResult.success) {
      testResult.error = `HTTP ${response.status}: ${response.statusText}`;
    }

    console.log(`✅ Test completed: ${testName} - ${testResult.success ? 'SUCCESS' : 'FAILED'} (${testResult.duration}ms)`);

  } catch (error) {
    const endTime = Date.now();
    testResult.duration = endTime - startTime;
    testResult.success = false;
    
    if (error instanceof Error && error.name === 'AbortError') {
      testResult.timedOut = true;
      testResult.error = 'Request timed out after 30 seconds';
      testResult.errorType = 'TIMEOUT';
    } else {
      testResult.error = error instanceof Error ? error.message : 'Unknown error';
      testResult.errorType = error instanceof Error ? error.name : 'UNKNOWN';
    }

    console.log(`❌ Test failed: ${testName} - ${testResult.error} (${testResult.duration}ms)`);
  }

  testResults.push(testResult);
}
