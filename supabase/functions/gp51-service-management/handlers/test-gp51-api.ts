import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { jsonResponse, errorResponse as generalErrorResponse } from "../response-helpers.ts";
import { getLatestGp51Session } from "../supabase-helpers.ts";
import { calculateMd5, md5_sync, GP51_API_URL } from "../utils.ts";

export async function handleTestGp51Api(supabase: SupabaseClient, startTime: number) {
  console.log('Testing real GP51 API connectivity...');

  const { session, error: sessionFetchError, response: sessionFetchErrorResponse } = await getLatestGp51Session(supabase);

  if (sessionFetchError) {
     const enrichedResponseDetails = sessionFetchErrorResponse?.body ? JSON.parse(await sessionFetchErrorResponse.text()) : {};
    return jsonResponse({
      ...enrichedResponseDetails,
      status: 'critical',
      isValid: false,
      latency: Date.now() - startTime,
      errorMessage: 'Database connection failed while fetching session for API test.'
    }, 200);
  }

  if (!session) {
    console.log('No GP51 sessions found - GP51 not configured (test_gp51_api)');
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
    console.error('GP51 session expired (test_gp51_api):', { expiresAt, now });
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
    const hashedPassword = md5_sync(session.password_hash); // Use correct synchronous hashing!
    console.log(`Authenticating with GP51 username: ${session.username}`);

    const formData = new URLSearchParams({
      action: 'querymonitorlist',
      username: session.username,
      password: hashedPassword,
      from: 'WEB',
      type: 'USER'
    });

    const apiUrlToUse = session.api_url || GP51_API_URL;
    console.log(`📡 Making real GP51 API call to: ${apiUrlToUse} (action: querymonitorlist)`);

    const testResponse = await fetch(apiUrlToUse, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'EnvioFleet/1.0 Deno/Test'
      },
      body: formData.toString()
    });

    const responseLatency = Date.now() - startTime;
    console.log("GP51 API call result status:", testResponse.status);

    if (!testResponse.ok) {
      const errorText = await testResponse.text().catch(() => "Could not read error response body");
      console.error('❌ GP51 API HTTP error:', testResponse.status, errorText);
      return jsonResponse({
        status: 'critical',
        isValid: false,
        username: session.username,
        latency: responseLatency,
        isAuthError: testResponse.status === 401 || testResponse.status === 403,
        errorMessage: `GP51 API HTTP error: ${testResponse.status}. Response: ${errorText.substring(0, 100)}`
      }, 200);
    }

    const responseText = await testResponse.text();
    console.log('📊 Raw GP51 API response (test_gp51_api):', responseText.substring(0, 200) + '...');

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ GP51 API response JSON parse error:', parseError.message);
      return jsonResponse({
        status: 'critical',
        isValid: false,
        username: session.username,
        latency: responseLatency,
        errorMessage: `GP51 API response was not valid JSON: ${responseText.substring(0, 100)}`
      }, 200);
    }

    if (responseData.status !== 0) {
      console.error('❌ GP51 API returned error status:', responseData);
      return jsonResponse({
        status: 'critical',
        isValid: false,
        username: session.username,
        latency: responseLatency,
        isAuthError: true, // Typically API errors with status != 0 are auth related
        errorMessage: responseData.message || responseData.cause || `GP51 API logic error (status: ${responseData.status})`
      }, 200);
    }

    const timeUntilExpiry = expiresAt.getTime() - now.getTime();
    const needsRefresh = timeUntilExpiry < 10 * 60 * 1000; // 10 minutes

    console.log('✅ GP51 API test successful (test_gp51_api)');
    return jsonResponse({
      status: needsRefresh ? 'degraded' : 'healthy',
      isValid: true,
      username: session.username,
      expiresAt: expiresAt,
      latency: responseLatency,
      needsRefresh: needsRefresh,
      errorMessage: null,
      deviceCount: responseData.groups ? responseData.groups.reduce((acc: number, group: any) => acc + (group.devices ? group.devices.length : 0), 0) : (responseData.devices ? responseData.devices.length : 0),
      details: `Successfully connected to GP51 as ${session.username}. API responded in ${responseLatency}ms.`
    }, 200);

  } catch (apiError) {
    console.error('❌ GP51 API connection processing failed (test_gp51_api):', apiError);
    return jsonResponse({
      status: 'critical',
      isValid: false,
      username: session?.username,
      latency: Date.now() - startTime,
      errorMessage: apiError instanceof Error ? apiError.message : 'General error during API test.'
    }, 200);
  }
}
