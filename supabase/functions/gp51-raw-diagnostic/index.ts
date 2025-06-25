
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { GP51UnifiedClient } from '../_shared/gp51_api_client_fixed.ts';

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

serve(async (req) => {
  console.log(`🔍 GP51 Raw Diagnostic: ${req.method} ${req.url}`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get GP51 credentials for user 'octopus'
    console.log(`🔑 Fetching GP51 credentials for user 'octopus'...`);
    
    const { data: sessions, error: sessionError } = await supabase
      .from('gp51_sessions')
      .select('*')
      .eq('username', 'octopus')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (sessionError) {
      throw new Error(`Failed to fetch session: ${sessionError.message}`);
    }

    if (!sessions || sessions.length === 0) {
      throw new Error('No active session found for user octopus');
    }

    const session = sessions[0];
    console.log(`✅ Found session for user: ${session.username}`);

    // Get credentials from environment (since we need the actual password, not hash)
    const username = Deno.env.get('GP51_ADMIN_USERNAME') || 'octopus';
    const password = Deno.env.get('GP51_ADMIN_PASSWORD');
    
    if (!password) {
      throw new Error('GP51_ADMIN_PASSWORD not found in environment');
    }

    console.log(`🔑 Using credentials - Username: ${username}, Password length: ${password.length}`);

    const testResults: DiagnosticTestResult[] = [];
    
    // Test 1: Use the CORRECTED GP51 client
    const test1Start = Date.now();
    console.log(`🧪 Starting test: GP51 Corrected Client (querymonitorlist)`);
    
    try {
      const client = new GP51UnifiedClient(username, password);
      const result = await client.getDevicesHierarchy();
      
      const test1Duration = Date.now() - test1Start;
      
      testResults.push({
        testName: 'GP51 Corrected Client (querymonitorlist)',
        url: 'https://www.gps51.com/webapi',
        method: 'POST',
        requestHeaders: { 'Content-Type': 'application/json' },
        requestBody: 'Fresh login + querymonitorlist',
        timestamp: new Date().toISOString(),
        duration: test1Duration,
        success: result.success,
        httpStatus: result.success ? 200 : 400,
        httpStatusText: result.success ? 'OK' : 'Failed',
        responseBodyRaw: JSON.stringify(result, null, 2),
        responseBodyLength: JSON.stringify(result).length,
        responseBodyParsed: result,
        isJsonResponse: true,
        error: result.success ? undefined : result.message
      });
      
      console.log(`✅ Test completed: GP51 Corrected Client - ${result.success ? 'SUCCESS' : 'FAILED'} (${test1Duration}ms)`);
    } catch (error) {
      const test1Duration = Date.now() - test1Start;
      testResults.push({
        testName: 'GP51 Corrected Client (querymonitorlist)',
        url: 'https://www.gps51.com/webapi',
        method: 'POST',
        requestHeaders: { 'Content-Type': 'application/json' },
        requestBody: 'Fresh login + querymonitorlist',
        timestamp: new Date().toISOString(),
        duration: test1Duration,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: 'Exception',
        responseBodyRaw: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      console.log(`❌ Test completed: GP51 Corrected Client - FAILED (${test1Duration}ms)`);
    }

    // Test 2: Test with positions
    const test2Start = Date.now();
    console.log(`🧪 Starting test: GP51 Devices with Positions`);
    
    try {
      const client = new GP51UnifiedClient(username, password);
      const result = await client.getDevicesWithPositions();
      
      const test2Duration = Date.now() - test2Start;
      
      testResults.push({
        testName: 'GP51 Devices with Positions',
        url: 'https://www.gps51.com/webapi',
        method: 'POST',
        requestHeaders: { 'Content-Type': 'application/json' },
        requestBody: 'Login + querymonitorlist + lastposition',
        timestamp: new Date().toISOString(),
        duration: test2Duration,
        success: result.success,
        httpStatus: result.success ? 200 : 400,
        httpStatusText: result.success ? 'OK' : 'Failed',
        responseBodyRaw: JSON.stringify(result, null, 2),
        responseBodyLength: JSON.stringify(result).length,
        responseBodyParsed: result,
        isJsonResponse: true,
        error: result.success ? undefined : result.message
      });
      
      console.log(`✅ Test completed: GP51 Devices with Positions - ${result.success ? 'SUCCESS' : 'FAILED'} (${test2Duration}ms)`);
    } catch (error) {
      const test2Duration = Date.now() - test2Start;
      testResults.push({
        testName: 'GP51 Devices with Positions',
        url: 'https://www.gps51.com/webapi',
        method: 'POST',
        requestHeaders: { 'Content-Type': 'application/json' },
        requestBody: 'Login + querymonitorlist + lastposition',
        timestamp: new Date().toISOString(),
        duration: test2Duration,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: 'Exception',
        responseBodyRaw: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      console.log(`❌ Test completed: GP51 Devices with Positions - FAILED (${test2Duration}ms)`);
    }

    const successfulTests = testResults.filter(t => t.success).length;
    console.log(`✅ Diagnostic completed. ${successfulTests}/${testResults.length} tests successful`);

    const response = {
      success: true,
      message: 'GP51 diagnostic tests completed with corrected client',
      diagnosticInfo: {
        timestamp: new Date().toISOString(),
        sessionInfo: {
          username: session.username,
          tokenLength: session.gp51_token?.length || 0,
          tokenExpiry: session.token_expires_at,
          apiUrl: session.api_url,
          sessionAge: Date.now() - new Date(session.created_at).getTime()
        },
        networkInfo: {
          userAgent: req.headers.get('user-agent'),
          origin: req.headers.get('origin'),
          referer: req.headers.get('referer')
        }
      },
      testResults,
      summary: {
        totalTests: testResults.length,
        successfulTests: successfulTests,
        failedTests: testResults.length - successfulTests,
        timeoutTests: testResults.filter(t => t.timedOut).length
      }
    };

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ GP51 Raw Diagnostic error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      message: 'GP51 diagnostic test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, null, 2), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
