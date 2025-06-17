
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

  try {
    console.log(`🔧 Testing GP51 API with unified client for user: ${session.username}`);

    // Use the unified client to test the API with the stored token
    const testResponse = await gp51ApiClient.queryMonitorList(
      session.gp51_token!, 
      session.username
    );

    const responseLatency = Date.now() - startTime;
    console.log(`✅ GP51 API test successful using unified client (${responseLatency}ms)`);

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
      details: `Successfully connected to GP51 as ${session.username}. API responded in ${responseLatency}ms.`
    }, 200);

  } catch (apiError) {
    const responseLatency = Date.now() - startTime;
    console.error('❌ GP51 API test failed using unified client:', apiError);
    
    // Determine if this is an authentication error
    const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown API error';
    const isAuthError = errorMessage.includes('login') || 
                       errorMessage.includes('authentication') || 
                       errorMessage.includes('unauthorized') ||
                       errorMessage.includes('token');

    return jsonResponse({
      status: 'critical',
      isValid: false,
      username: session.username,
      latency: responseLatency,
      isAuthError: isAuthError,
      errorMessage: errorMessage
    }, 200);
  }
}
