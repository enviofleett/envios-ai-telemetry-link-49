
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
  console.log(`🔐 [GP51Auth] Starting enhanced authentication for user: ${userId}, username: ${username}`);
  
  try {
    // First, cleanup any existing invalid sessions for this user
    await GP51TokenValidator.cleanupInvalidSessions(supabase, userId);

    // Prepare GP51 API request
    const gp51ApiUrl = `${apiUrl}/webapi`;
    const authPayload = {
      email: username,
      password: password
    };

    console.log(`🌐 [GP51Auth] Calling GP51 API: ${gp51ApiUrl}`);

    // Call GP51 authentication API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    let response;
    try {
      response = await fetch(`${gp51ApiUrl}/Account/Login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(authPayload),
        signal: controller.signal
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('GP51 API request timed out after 15 seconds');
      }
      throw fetchError;
    }
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`❌ [GP51Auth] HTTP error: ${response.status} ${response.statusText}`);
      return createErrorResponse(
        'GP51 API request failed',
        `HTTP ${response.status}: ${response.statusText}`,
        500,
        calculateLatency(startTime)
      );
    }

    let responseData;
    try {
      responseData = await response.json();
    } catch (parseError) {
      console.error('❌ [GP51Auth] Failed to parse JSON response:', parseError);
      return createErrorResponse(
        'Invalid response from GP51 API',
        'Unable to parse authentication response',
        500,
        calculateLatency(startTime)
      );
    }

    console.log(`📨 [GP51Auth] GP51 API response:`, {
      status: responseData?.status,
      hasToken: !!responseData?.token,
      message: responseData?.message || responseData?.cause,
      responseType: typeof responseData
    });

    // Validate the token response using enhanced validator
    const validation = GP51TokenValidator.validateTokenResponse(responseData);
    
    if (!validation.isValid) {
      console.error('❌ [GP51Auth] Token validation failed:', validation.error);
      
      // Store the failed authentication attempt for audit
      await logAuthenticationAttempt(supabase, userId, username, false, validation.error);
      
      return GP51TokenValidator.createReauthResponse(
        validation.error || 'Invalid authentication response from GP51'
      );
    }

    // Store credentials securely before storing session
    const credentialResult = await storeSecureCredentials(supabase, userId, username, password, apiUrl);
    if (!credentialResult.success) {
      console.warn('⚠️ [GP51Auth] Failed to store credentials, continuing with session creation');
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
    const isValidSession = await GP51TokenValidator.validateStoredSession(supabase, sessionResult.sessionId);
    
    // Log successful authentication
    await logAuthenticationAttempt(supabase, userId, username, true);

    console.log(`✅ [GP51Auth] Authentication completed successfully for ${username}`);
    
    return createResponse({
      success: true,
      message: 'GP51 authentication successful',
      session: {
        id: sessionResult.sessionId,
        username,
        expiresAt: sessionResult.expiresAt,
        tokenLength: validation.token!.length,
        apiUrl,
        isValid: isValidSession
      },
      credentialsStored: credentialResult.success
    }, calculateLatency(startTime));

  } catch (error) {
    console.error('❌ [GP51Auth] Authentication error:', error);
    
    // Log failed authentication attempt
    await logAuthenticationAttempt(supabase, userId, username, false, error.message);
    
    GP51ErrorHandler.logError(error, { userId, username, apiUrl });
    
    return createErrorResponse(
      'GP51 authentication failed',
      error instanceof Error ? error.message : 'Unknown authentication error',
      500,
      calculateLatency(startTime)
    );
  }
}

async function storeSecureCredentials(
  supabase: any,
  userId: string,
  username: string,
  password: string,
  apiUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔐 [GP51Auth] Storing secure credentials...');
    
    // Use the RPC function to store credentials securely
    const { data, error } = await supabase.rpc('store_gp51_credentials', {
      p_username: username,
      p_password: password,
      p_api_url: apiUrl
    });

    if (error) {
      console.error('❌ [GP51Auth] Failed to store credentials:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ [GP51Auth] Credentials stored securely');
    return { success: true };
  } catch (error) {
    console.error('❌ [GP51Auth] Error storing credentials:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to store credentials' 
    };
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

    console.log('💾 [GP51Auth] Storing validated session:', {
      userId,
      username,
      tokenLength: token.length,
      expiresAt: expiresAt.toISOString()
    });

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

    console.log('✅ [GP51Auth] Session stored successfully');
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

async function logAuthenticationAttempt(
  supabase: any,
  userId: string,
  username: string,
  success: boolean,
  errorMessage?: string
): Promise<void> {
  try {
    await supabase
      .from('gp51_security_audit')
      .insert({
        user_id: userId,
        operation_type: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
        operation_details: {
          username,
          timestamp: new Date().toISOString(),
          error: errorMessage
        },
        success
      });
  } catch (error) {
    console.error('❌ [GP51Auth] Failed to log authentication attempt:', error);
  }
}

// Enhanced credential refresh function
export async function refreshGP51Credentials(supabase: any, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔄 [GP51Auth] Starting credential refresh for user:', userId);
    
    // Get stored credentials
    const { data: credentials, error: credError } = await supabase.rpc('get_gp51_credentials', {
      p_user_id: userId
    });

    if (credError || !credentials || credentials.length === 0) {
      console.error('❌ [GP51Auth] No stored credentials found for refresh:', credError);
      return { 
        success: false, 
        error: 'No stored credentials found. Please re-authenticate in Settings.' 
      };
    }

    const credential = credentials[0];
    console.log('🔍 [GP51Auth] Found stored credentials for refresh:', {
      username: credential.username,
      hasPassword: !!credential.password,
      apiUrl: credential.api_url
    });

    // Re-authenticate with stored credentials
    const authResult = await handleGP51Authentication(
      supabase,
      userId,
      credential.username,
      credential.password,
      credential.api_url,
      Date.now()
    );

    const authData = await authResult.json();
    return { 
      success: authData.success, 
      error: authData.success ? undefined : authData.error 
    };

  } catch (error) {
    console.error('❌ [GP51Auth] Credential refresh failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Credential refresh failed' 
    };
  }
}
