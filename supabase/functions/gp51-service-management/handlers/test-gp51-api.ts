
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { jsonResponse } from "../response-helpers.ts";
import { getLatestGp51Session } from "../supabase-helpers.ts";
import { gp51ApiClient } from "../../_shared/gp51_api_client_unified.ts";

export async function handleTestGp51Api(supabase: SupabaseClient, startTime: number) {
  console.log('🔧 Testing GP51 API connectivity using unified client...');

  const { session, error: sessionFetchError } = await getLatestGp51Session(supabase);

  if (sessionFetchError) {
    console.error('❌ Database error fetching GP51 session:', sessionFetchError);
    return jsonResponse({
      status: 'critical',
      isValid: false,
      latency: Date.now() - startTime,
      errorMessage: 'Database connection failed while fetching session for API test.'
    }, 200);
  }

  if (!session) {
    console.log('📝 No GP51 sessions found - GP51 not configured (test_gp51_api)');
    return jsonResponse({
      status: 'not_configured',
      isValid: false,
      latency: Date.now() - startTime,
      errorMessage: 'GP51 integration not configured. Cannot test API.'
    }, 200);
  }

  const expiresAt = new Date(session.token_expires_at);
  const now = new Date();

  if (expiresAt <= now) {
    console.error('❌ GP51 session expired (test_gp51_api):', { expiresAt, now });
    return jsonResponse({
      status: 'critical',
      isValid: false,
      username: session.username,
      expiresAt: expiresAt,
      isAuthError: true,
      latency: Date.now() - startTime,
      needsRefresh: true,
      errorMessage: 'GP51 session expired. Cannot test API.'
    }, 200);
  }

  // Comprehensive token validation and debugging
  console.log(`🔑 [TestGP51] Session found for user: ${session.username}`);
  console.log(`🔑 [TestGP51] Token exists: ${!!session.gp51_token}`);
  console.log(`🔑 [TestGP51] Token length: ${session.gp51_token?.length || 0}`);
  console.log(`🔑 [TestGP51] Token (first 8 chars): ${session.gp51_token ? session.gp51_token.substring(0, 8) + '...' : 'MISSING'}`);
  console.log(`🔑 [TestGP51] Full token (for debugging): ${session.gp51_token}`); // Temporary for debugging
  console.log(`🔑 [TestGP51] Token expires at: ${expiresAt.toISOString()}`);
  console.log(`🔑 [TestGP51] Current time: ${now.toISOString()}`);
  console.log(`🔑 [TestGP51] Time until expiry: ${Math.round((expiresAt.getTime() - now.getTime()) / 1000)} seconds`);

  // Additional token validation checks
  if (!session.gp51_token) {
    console.error('❌ [TestGP51] No token found in session');
    return jsonResponse({
      status: 'critical',
      isValid: false,
      username: session.username,
      latency: Date.now() - startTime,
      errorMessage: 'No GP51 token found in session. Please re-authenticate.'
    }, 200);
  }

  if (session.gp51_token.length < 10) {
    console.error('❌ [TestGP51] Token appears to be too short:', session.gp51_token.length);
    return jsonResponse({
      status: 'critical',
      isValid: false,
      username: session.username,
      latency: Date.now() - startTime,
      errorMessage: 'GP51 token appears to be invalid (too short). Please re-authenticate.'
    }, 200);
  }

  try {
    console.log(`🔧 Testing GP51 API with unified client for user: ${session.username}`);
    console.log(`🔧 Using token for API test: ${session.gp51_token ? 'YES' : 'NO'}`);
    console.log(`🔧 Starting comprehensive GP51 API test with multiple request formats...`);

    // Use the unified client to test the API with the stored token
    const testResponse = await gp51ApiClient.queryMonitorList(
      session.gp51_token!, 
      session.username
    );

    const responseLatency = Date.now() - startTime;
    console.log(`✅ GP51 API test successful using unified client (${responseLatency}ms)`);
    console.log(`✅ Successful response:`, testResponse);

    const timeUntilExpiry = expiresAt.getTime() - now.getTime();
    const needsRefresh = timeUntilExpiry < 10 * 60 * 1000; // 10 minutes

    // Count devices from the response
    let deviceCount = 0;
    if (testResponse.groups) {
      deviceCount = testResponse.groups.reduce((acc: number, group: any) => 
        acc + (group.devices ? group.devices.length : 0), 0
      );
    } else if (testResponse.devices) {
      deviceCount = testResponse.devices.length;
    }

    return jsonResponse({
      status: needsRefresh ? 'degraded' : 'healthy',
      isValid: true,
      username: session.username,
      expiresAt: expiresAt,
      latency: responseLatency,
      needsRefresh: needsRefresh,
      errorMessage: null,
      deviceCount: deviceCount,
      details: `Successfully connected to GP51 as ${session.username}. API responded in ${responseLatency}ms.`,
      debugInfo: {
        tokenLength: session.gp51_token?.length || 0,
        timeUntilExpiry: Math.round(timeUntilExpiry / 1000),
        responseGroups: testResponse.groups?.length || 0,
        responseDevices: testResponse.devices?.length || 0
      }
    }, 200);

  } catch (apiError) {
    const responseLatency = Date.now() - startTime;
    console.error('❌ GP51 API test failed using unified client:', apiError);
    
    // Enhanced error logging and analysis
    console.error('❌ [TestGP51] Full error details:', {
      message: apiError instanceof Error ? apiError.message : 'Unknown error',
      name: apiError instanceof Error ? apiError.name : 'Unknown',
      stack: apiError instanceof Error ? apiError.stack : undefined,
      sessionUsername: session.username,
      tokenExists: !!session.gp51_token,
      tokenLength: session.gp51_token?.length || 0,
      tokenFirstChars: session.gp51_token ? session.gp51_token.substring(0, 8) + '...' : 'MISSING'
    });
    
    // Attempt token refresh if this looks like an auth error
    const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown API error';
    const isAuthError = errorMessage.includes('login') || 
                       errorMessage.includes('authentication') || 
                       errorMessage.includes('unauthorized') ||
                       errorMessage.includes('token') ||
                       errorMessage.includes('global_error_not_find_token');

    if (isAuthError) {
      console.log('🔄 [TestGP51] Auth error detected, attempting token refresh...');
      try {
        // Import the authentication function
        const { authenticateWithGP51 } = await import('../../settings-management/gp51-auth.ts');
        
        // Get the stored credentials (this would require decryption in a real scenario)
        // For now, we'll log that a refresh is needed
        console.log('🔄 [TestGP51] Token refresh required but credentials not available in this context');
        console.log('🔄 [TestGP51] User should re-authenticate via settings');
      } catch (refreshError) {
        console.error('❌ [TestGP51] Token refresh attempt failed:', refreshError);
      }
    }

    return jsonResponse({
      status: 'critical',
      isValid: false,
      username: session.username,
      latency: responseLatency,
      isAuthError: isAuthError,
      errorMessage: errorMessage,
      debugInfo: {
        tokenExists: !!session.gp51_token,
        tokenLength: session.gp51_token?.length || 0,
        tokenFirstChars: session.gp51_token ? session.gp51_token.substring(0, 8) + '...' : 'MISSING',
        expiresAt: expiresAt.toISOString(),
        timeUntilExpiry: Math.round((expiresAt.getTime() - now.getTime()) / 1000),
        errorType: apiError instanceof Error ? apiError.name : 'Unknown',
        suggestedAction: isAuthError ? 'Re-authenticate GP51 in settings' : 'Check GP51 service status'
      }
    }, 200);
  }
}
