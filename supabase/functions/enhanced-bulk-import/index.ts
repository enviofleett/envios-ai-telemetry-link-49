
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createErrorResponse, createSuccessResponse } from '../_shared/response_utils.ts';
import { getValidGp51Session } from '../_shared/gp51_session_utils.ts';
import { authStrategies } from './gp51-auth-strategies.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SessionDiagnosticResult {
  sessionFound: boolean;
  sessionDetails?: {
    username: string;
    tokenExists: boolean;
    tokenLength: number;
    expiresAt: string;
    timeUntilExpiry: number;
    sessionAge: number;
    authMethod?: string;
    apiUrl?: string;
  };
  apiTest?: {
    success: boolean;
    responseTime: number;
    deviceCount?: number;
    error?: string;
    strategy?: string;
  };
  error?: string;
}

async function performComprehensiveSessionDiagnostics(): Promise<SessionDiagnosticResult> {
  console.log('🔍 [DIAGNOSTICS] Starting comprehensive GP51 session diagnostics...');
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Phase 1: Enhanced Session Retrieval with Detailed Logging
    console.log('📊 [DIAGNOSTICS] Phase 1: Retrieving GP51 sessions...');
    
    const { data: allSessions, error: sessionError } = await supabase
      .from('gp51_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (sessionError) {
      console.error('❌ [DIAGNOSTICS] Database error:', sessionError);
      return {
        sessionFound: false,
        error: `Database error: ${sessionError.message}`
      };
    }

    console.log(`📋 [DIAGNOSTICS] Found ${allSessions?.length || 0} total sessions in database`);
    
    if (!allSessions || allSessions.length === 0) {
      console.log('📝 [DIAGNOSTICS] No GP51 sessions found in database');
      return {
        sessionFound: false,
        error: 'No GP51 sessions exist in database'
      };
    }

    // Analyze all sessions for debugging
    const now = new Date();
    console.log(`🕐 [DIAGNOSTICS] Current time: ${now.toISOString()}`);
    
    for (const session of allSessions) {
      const expiresAt = new Date(session.token_expires_at);
      const isExpired = expiresAt <= now;
      const timeUntilExpiry = Math.round((expiresAt.getTime() - now.getTime()) / 1000);
      
      console.log(`📄 [DIAGNOSTICS] Session: ${session.username}`);
      console.log(`   - Token exists: ${!!session.gp51_token}`);
      console.log(`   - Token length: ${session.gp51_token?.length || 0}`);
      console.log(`   - Expires at: ${session.token_expires_at}`);
      console.log(`   - Is expired: ${isExpired}`);
      console.log(`   - Time until expiry: ${timeUntilExpiry} seconds`);
      console.log(`   - Auth method: ${session.auth_method || 'unknown'}`);
    }

    // Find the most recent valid session with robust date comparison
    let validSession = null;
    for (const session of allSessions) {
      // Check if session has required fields
      if (!session.gp51_token || !session.username) {
        console.log(`⚠️ [DIAGNOSTICS] Session ${session.username || 'unknown'} missing required fields`);
        continue;
      }

      // Robust date comparison
      const expiresAt = new Date(session.token_expires_at);
      const isValid = expiresAt > now;
      
      if (isValid) {
        validSession = session;
        console.log(`✅ [DIAGNOSTICS] Found valid session for user: ${session.username}`);
        break;
      }
    }

    if (!validSession) {
      console.log('❌ [DIAGNOSTICS] No valid sessions found after filtering');
      return {
        sessionFound: false,
        error: 'All sessions are expired or missing required fields'
      };
    }

    // Phase 2: Calculate session details
    const expiresAt = new Date(validSession.token_expires_at);
    const createdAt = new Date(validSession.created_at);
    const timeUntilExpiry = Math.round((expiresAt.getTime() - now.getTime()) / 1000);
    const sessionAge = Math.round((now.getTime() - createdAt.getTime()) / 1000);

    const sessionDetails = {
      username: validSession.username,
      tokenExists: !!validSession.gp51_token,
      tokenLength: validSession.gp51_token?.length || 0,
      expiresAt: validSession.token_expires_at,
      timeUntilExpiry,
      sessionAge,
      authMethod: validSession.auth_method || 'unknown',
      apiUrl: validSession.api_url || 'default'
    };

    console.log('✅ [DIAGNOSTICS] Session details compiled:', sessionDetails);

    // Phase 3: Improved GP51 API Testing
    console.log('🧪 [DIAGNOSTICS] Phase 3: Testing GP51 API connectivity...');
    
    const apiTestStartTime = Date.now();
    let apiTestResult = null;

    try {
      // Use the authentication strategies to test the API
      const baseUrl = Deno.env.get('GP51_BASE_URL') || 'https://www.gps51.com';
      
      // Test with the stored token directly
      const testUrl = new URL(`${baseUrl}/webapi`);
      testUrl.searchParams.set('action', 'getmonitorlist');
      testUrl.searchParams.set('token', validSession.gp51_token);

      console.log(`🔗 [DIAGNOSTICS] Testing API with URL: ${testUrl.toString().replace(validSession.gp51_token, '[TOKEN]')}`);

      const response = await fetch(testUrl.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/plain',
          'User-Agent': 'FleetIQ/1.0'
        },
        signal: AbortSignal.timeout(15000)
      });

      const responseTime = Date.now() - apiTestStartTime;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      console.log(`📋 [DIAGNOSTICS] API Response (first 200 chars): ${responseText.substring(0, 200)}`);

      let deviceCount = 0;
      try {
        const jsonResponse = JSON.parse(responseText);
        if (jsonResponse.status === 0) {
          // Count devices from groups
          if (jsonResponse.groups && Array.isArray(jsonResponse.groups)) {
            deviceCount = jsonResponse.groups.reduce((acc: number, group: any) => 
              acc + (group.devices ? group.devices.length : 0), 0
            );
          }
          
          apiTestResult = {
            success: true,
            responseTime,
            deviceCount,
            strategy: 'direct_token_test'
          };
          
          console.log(`✅ [DIAGNOSTICS] API test successful - found ${deviceCount} devices`);
        } else {
          throw new Error(`GP51 API error: ${jsonResponse.cause || 'Unknown error'}`);
        }
      } catch (parseError) {
        // Handle plain text responses
        if (responseText && !responseText.includes('error') && !responseText.includes('<html')) {
          apiTestResult = {
            success: true,
            responseTime,
            deviceCount: 0,
            strategy: 'plain_text_response'
          };
          console.log('✅ [DIAGNOSTICS] API test successful (plain text response)');
        } else {
          throw new Error(`Invalid API response: ${responseText.substring(0, 100)}`);
        }
      }

    } catch (apiError) {
      console.error('❌ [DIAGNOSTICS] API test failed:', apiError);
      apiTestResult = {
        success: false,
        responseTime: Date.now() - apiTestStartTime,
        error: apiError instanceof Error ? apiError.message : 'Unknown API error',
        strategy: 'direct_token_test'
      };
    }

    return {
      sessionFound: true,
      sessionDetails,
      apiTest: apiTestResult
    };

  } catch (error) {
    console.error('❌ [DIAGNOSTICS] Comprehensive diagnostics failed:', error);
    return {
      sessionFound: false,
      error: `Diagnostics failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

async function handleConnectionTest(): Promise<Response> {
  console.log('🧪 [enhanced-bulk-import] Starting comprehensive connection test...');
  
  try {
    const diagnostics = await performComprehensiveSessionDiagnostics();
    
    if (!diagnostics.sessionFound) {
      return createErrorResponse(
        'No valid GP51 session found',
        diagnostics.error || 'Session diagnostics failed',
        401
      );
    }

    const response = {
      success: true,
      message: 'GP51 connection test completed',
      session: diagnostics.sessionDetails,
      apiTest: diagnostics.apiTest,
      overall_status: diagnostics.apiTest?.success ? 'healthy' : 'degraded',
      recommendations: diagnostics.apiTest?.success 
        ? ['GP51 integration is working properly']
        : ['Check GP51 service status', 'Verify token validity', 'Review API endpoint configuration']
    };

    console.log('✅ [enhanced-bulk-import] Connection test completed successfully');
    return createSuccessResponse(response);

  } catch (error) {
    console.error('❌ [enhanced-bulk-import] Connection test failed:', error);
    return createErrorResponse(
      'Connection test failed',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action } = await req.json();
    console.log(`🔧 [enhanced-bulk-import] Action: ${action}`);

    switch (action) {
      case 'test_connection':
        return await handleConnectionTest();
      
      default:
        return createErrorResponse(
          'Invalid action',
          `Unknown action: ${action}`,
          400
        );
    }

  } catch (error) {
    console.error('❌ [enhanced-bulk-import] Request processing failed:', error);
    return createErrorResponse(
      'Request processing failed',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
});
