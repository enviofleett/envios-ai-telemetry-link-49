
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { jsonResponse } from "../response-helpers.ts";
import { getLatestGp51Session } from "../supabase-helpers.ts";

export async function handleTestConnection(supabase: SupabaseClient, startTime: number) {
  console.log('Testing GP51 connection by validating session...');

  const { session, error: sessionFetchError, response: sessionFetchErrorResponse } = await getLatestGp51Session(supabase);

  if (sessionFetchError) {
    // Enrich with latency before sending
    const enrichedResponseDetails = sessionFetchErrorResponse?.body ? JSON.parse(await sessionFetchErrorResponse.text()) : {};
    return jsonResponse({
      ...enrichedResponseDetails,
      latency: Date.now() - startTime,
      consecutiveFailures: 1, // Assuming failure if DB error
      isAuthError: false,
      needsRefresh: false,
    }, 200);
  }
  
  if (!session) {
    console.log('No GP51 sessions found - GP51 not configured');
    return jsonResponse({
      status: 'not_configured',
      isValid: false,
      expiresAt: null,
      username: null,
      lastCheck: new Date(),
      consecutiveFailures: 0,
      isAuthError: false,
      latency: Date.now() - startTime,
      needsRefresh: false,
      errorMessage: 'GP51 integration not configured. Please add GP51 credentials in admin settings.'
    }, 200);
  }

  const expiresAt = new Date(session.token_expires_at);
  const now = new Date();

  if (expiresAt <= now) {
    console.error('GP51 session expired:', { expiresAt, now });
    return jsonResponse({
      status: 'critical',
      isValid: false,
      expiresAt: expiresAt,
      username: session.username,
      lastCheck: new Date(),
      consecutiveFailures: 1,
      isAuthError: true,
      latency: Date.now() - startTime,
      needsRefresh: true,
      errorMessage: 'GP51 session expired'
    }, 200);
  }

  const timeUntilExpiry = expiresAt.getTime() - now.getTime();
  const needsRefresh = timeUntilExpiry < 10 * 60 * 1000; // 10 minutes

  console.log('✅ GP51 session validation successful for test_connection action');
  return jsonResponse({
    status: needsRefresh ? 'degraded' : 'healthy',
    isValid: true,
    expiresAt: expiresAt,
    username: session.username,
    lastCheck: new Date(),
    consecutiveFailures: 0,
    isAuthError: false,
    latency: Date.now() - startTime,
    needsRefresh: needsRefresh,
    errorMessage: null
  }, 200);
}
