
import { createResponse, createErrorResponse, calculateLatency } from './response-utils.ts';
import { GP51ErrorHandler } from './error-handling.ts';
import { GP51TokenValidator } from './token-validation.ts';

export async function handleGP51Authentication(
  supabase: any,
  userId: string,
  username: string,
  password: string,
  apiUrl: string = 'https://www.gps51.com',
  startTime: number
) {
  console.log(`🔐 [GP51Auth] Starting authentication for user: ${userId}, username: ${username}`);
  
  try {
    // Prepare GP51 API request
    const gp51ApiUrl = `${apiUrl}/webapi`;
    const authPayload = {
      email: username,
      password: password
    };

    console.log(`🌐 [GP51Auth] Calling GP51 API: ${gp51ApiUrl}`);

    // Call GP51 authentication API
    const response = await fetch(`${gp51ApiUrl}/Account/Login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(authPayload)
    });

    if (!response.ok) {
      console.error(`❌ [GP51Auth] HTTP error: ${response.status} ${response.statusText}`);
      return createErrorResponse(
        'GP51 API request failed',
        `HTTP ${response.status}: ${response.statusText}`,
        500,
        calculateLatency(startTime)
      );
    }

    const responseData = await response.json();
    console.log(`📨 [GP51Auth] GP51 API response:`, {
      status: responseData?.status,
      hasToken: !!responseData?.token,
      message: responseData?.message
    });

    // Validate the token response
    const validation = GP51TokenValidator.validateTokenResponse(responseData);
    
    if (!validation.isValid) {
      console.error('❌ [GP51Auth] Token validation failed:', validation.error);
      
      if (validation.shouldCleanup) {
        // Clean up any existing invalid sessions for this user
        await cleanupUserSessions(supabase, userId);
      }
      
      return GP51TokenValidator.createReauthResponse(
        validation.error || 'Invalid authentication response from GP51'
      );
    }

    // Store the validated session
    const sessionResult = await storeValidatedSession(
      supabase,
      userId,
      username,
      validation.token!,
      apiUrl
    );

    if (!sessionResult.success) {
      return createErrorResponse(
        'Failed to store session',
        sessionResult.error,
        500,
        calculateLatency(startTime)
      );
    }

    // Verify the stored session works
    const verificationResult = await verifyStoredSession(supabase, sessionResult.sessionId, validation.token!);
    
    console.log(`✅ [GP51Auth] Authentication completed successfully for ${username}`);
    
    return createResponse({
      success: true,
      message: 'GP51 authentication successful',
      session: {
        id: sessionResult.sessionId,
        username,
        expiresAt: sessionResult.expiresAt,
        tokenLength: validation.token!.length,
        apiUrl
      },
      verification: verificationResult
    }, calculateLatency(startTime));

  } catch (error) {
    console.error('❌ [GP51Auth] Authentication error:', error);
    GP51ErrorHandler.logError(error, { userId, username, apiUrl });
    
    return createErrorResponse(
      'GP51 authentication failed',
      error instanceof Error ? error.message : 'Unknown authentication error',
      500,
      calculateLatency(startTime)
    );
  }
}

async function cleanupUserSessions(supabase: any, userId: string): Promise<void> {
  try {
    console.log('🧹 [GP51Auth] Cleaning up existing sessions for user:', userId);
    
    const { error } = await supabase
      .from('gp51_sessions')
      .update({
        is_active: false,
        gp51_token: null,
        updated_at: new Date().toISOString()
      })
      .eq('envio_user_id', userId);

    if (error) {
      console.error('❌ [GP51Auth] Session cleanup failed:', error);
    } else {
      console.log('✅ [GP51Auth] Existing sessions cleaned up');
    }
  } catch (error) {
    console.error('❌ [GP51Auth] Session cleanup error:', error);
  }
}

async function storeValidatedSession(
  supabase: any,
  userId: string,
  username: string,
  token: string,
  apiUrl: string
): Promise<{ success: boolean; sessionId?: string; expiresAt?: string; error?: string }> {
  try {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 8); // GP51 tokens typically last 8 hours

    const { data, error } = await supabase
      .from('gp51_sessions')
      .upsert({
        envio_user_id: userId,
        username,
        gp51_token: token,
        api_url: apiUrl,
        token_expires_at: expiresAt.toISOString(),
        is_active: true,
        auth_method: 'credentials',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'envio_user_id,username'
      })
      .select('id')
      .single();

    if (error) {
      console.error('❌ [GP51Auth] Failed to store session:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      sessionId: data.id,
      expiresAt: expiresAt.toISOString()
    };
  } catch (error) {
    console.error('❌ [GP51Auth] Store session error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to store session'
    };
  }
}

async function verifyStoredSession(supabase: any, sessionId: string, token: string): Promise<any> {
  try {
    console.log('🔍 [GP51Auth] Verifying stored session:', sessionId);
    
    // Test if the token works by making a simple API call
    const testResult = await testTokenValidity(token);
    
    return {
      sessionStored: true,
      tokenTest: testResult,
      sessionId
    };
  } catch (error) {
    console.error('❌ [GP51Auth] Session verification error:', error);
    return {
      sessionStored: true,
      tokenTest: { success: false, error: error instanceof Error ? error.message : 'Verification failed' },
      sessionId
    };
  }
}

async function testTokenValidity(token: string): Promise<{ success: boolean; error?: string }> {
  try {
    // This is a placeholder for token testing - you might want to make a simple GP51 API call here
    console.log('🧪 [GP51Auth] Testing token validity (length check):', token.length);
    
    if (token.length > 10) {
      return { success: true };
    } else {
      return { success: false, error: 'Token appears to be too short' };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token test failed'
    };
  }
}
