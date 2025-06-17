
import { authenticateWithGP51 } from './gp51-auth.ts';
import { createResponse, createErrorResponse, calculateLatency } from './response-utils.ts';
import type { AuthResult, ImportResult } from './types.ts';

export async function handleGP51Authentication(
  supabase: any,
  userId: string,
  username: string,
  password: string,
  apiUrl?: string,
  startTime?: number
) {
  console.log('🔐 [GP51Auth] Starting authentication audit for user:', userId);
  console.log('🔐 [GP51Auth] Username:', username);
  console.log('🔐 [GP51Auth] API URL:', apiUrl || 'default');
  const latency = startTime ? calculateLatency(startTime) : 0;
  
  try {
    // Step 1: Clear any existing sessions for this user
    console.log('🧹 [GP51Auth] Clearing existing GP51 sessions for user...');
    const { error: deleteError, count: deletedCount } = await supabase
      .from('gp51_sessions')
      .delete()
      .eq('envio_user_id', userId)
      .select('id', { count: 'exact' });

    if (deleteError) {
      console.error('❌ [GP51Auth] Failed to clear existing sessions:', deleteError);
      // Continue anyway, don't fail the whole process
    } else {
      console.log(`✅ [GP51Auth] Cleared ${deletedCount || 0} existing sessions`);
    }

    // Step 2: Authenticate with GP51
    console.log('🔄 [GP51Auth] Calling GP51 authentication service...');
    const authResult = await authenticateWithGP51({
      username: username.trim(),
      password,
      apiUrl
    });

    console.log('🔐 [GP51Auth] Authentication result:', {
      success: authResult.success,
      hasToken: !!authResult.token,
      tokenLength: authResult.token?.length || 0,
      username: authResult.username,
      method: authResult.method,
      error: authResult.error
    });

    if (!authResult.success) {
      console.error('❌ [GP51Auth] GP51 authentication failed:', authResult.error);
      return createErrorResponse(
        authResult.error || 'GP51 authentication failed',
        { 
          step: 'authentication',
          username: authResult.username,
          apiUrl: authResult.apiUrl 
        },
        401,
        latency
      );
    }

    if (!authResult.token) {
      console.error('❌ [GP51Auth] No token received from GP51');
      return createErrorResponse(
        'No authentication token received from GP51',
        { step: 'token_validation' },
        500,
        latency
      );
    }

    // Step 3: Store the session in database with detailed logging
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours
    console.log('💾 [GP51Auth] Storing session in database...');
    console.log('💾 [GP51Auth] Session data:', {
      envio_user_id: userId,
      username: authResult.username,
      hashedPassword: !!authResult.hashedPassword,
      token: authResult.token ? `${authResult.token.substring(0, 8)}...` : 'MISSING',
      tokenLength: authResult.token?.length || 0,
      expiresAt: expiresAt.toISOString(),
      apiUrl: authResult.apiUrl,
      method: authResult.method
    });

    const { data: sessionData, error: sessionError } = await supabase
      .from('gp51_sessions')
      .insert({
        envio_user_id: userId,
        username: authResult.username,
        password_hash: authResult.hashedPassword,
        gp51_token: authResult.token,
        token_expires_at: expiresAt.toISOString(),
        api_url: authResult.apiUrl,
        auth_method: authResult.method || 'UNIFIED_CLIENT',
        created_at: new Date().toISOString(),
        last_validated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (sessionError) {
      console.error('❌ [GP51Auth] Failed to store GP51 session:', sessionError);
      console.error('❌ [GP51Auth] Session error details:', {
        message: sessionError.message,
        details: sessionError.details,
        hint: sessionError.hint,
        code: sessionError.code
      });
      return createErrorResponse(
        'Failed to store authentication session',
        { 
          step: 'database_storage',
          error: sessionError.message,
          details: sessionError.details 
        },
        500,
        latency
      );
    }

    console.log('✅ [GP51Auth] Session stored successfully with ID:', sessionData.id);

    // Step 4: Verify the stored session by reading it back
    console.log('🔍 [GP51Auth] Verifying stored session...');
    const { data: verifySession, error: verifyError } = await supabase
      .from('gp51_sessions')
      .select('id, username, gp51_token, token_expires_at, created_at')
      .eq('id', sessionData.id)
      .single();

    if (verifyError || !verifySession) {
      console.error('❌ [GP51Auth] Failed to verify stored session:', verifyError);
      return createErrorResponse(
        'Session stored but verification failed',
        { step: 'verification' },
        500,
        latency
      );
    }

    console.log('✅ [GP51Auth] Session verification successful:', {
      sessionId: verifySession.id,
      username: verifySession.username,
      hasToken: !!verifySession.gp51_token,
      tokenLength: verifySession.gp51_token?.length || 0,
      expiresAt: verifySession.token_expires_at,
      createdAt: verifySession.created_at
    });

    // Step 5: Test the stored token with GP51 API
    console.log('🧪 [GP51Auth] Testing stored token with GP51 API...');
    let tokenTestResult = null;
    try {
      const { data: testData, error: testError } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'test_gp51_api' }
      });

      if (testError) {
        console.warn('⚠️ [GP51Auth] Token test failed:', testError);
        tokenTestResult = { success: false, error: testError.message };
      } else {
        console.log('✅ [GP51Auth] Token test result:', testData);
        tokenTestResult = { success: testData.isValid, details: testData };
      }
    } catch (testException) {
      console.warn('⚠️ [GP51Auth] Token test exception:', testException);
      tokenTestResult = { success: false, error: 'Test function unavailable' };
    }

    console.log('✅ [GP51Auth] GP51 authentication process completed successfully');

    return createResponse({
      success: true,
      message: 'GP51 authentication successful and session stored',
      session: {
        id: sessionData.id,
        username: authResult.username,
        expiresAt: expiresAt.toISOString(),
        method: authResult.method,
        tokenLength: authResult.token?.length || 0,
        storedAt: sessionData.created_at
      },
      verification: {
        sessionStored: true,
        sessionVerified: true,
        tokenTest: tokenTestResult
      },
      latency
    });

  } catch (error) {
    console.error('❌ [GP51Auth] Authentication process failed with exception:', error);
    console.error('❌ [GP51Auth] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return createErrorResponse(
      'Authentication process failed',
      { 
        step: 'general_exception',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      500,
      latency
    );
  }
}

async function triggerGP51Import(supabase: any, userId: string, authResult: AuthResult): Promise<ImportResult> {
  console.log('📡 Starting GP51 vehicle data import for user:', userId);
  
  try {
    // Call the gp51-live-import function
    const { data: importData, error: importError } = await supabase.functions.invoke('gp51-live-import', {
      body: {
        action: 'import-vehicles',
        userId: userId,
        gp51Token: authResult.token,
        gp51Username: authResult.username,
        apiUrl: authResult.apiUrl
      }
    });

    if (importError) {
      console.error('❌ GP51 import function error:', importError);
      throw new Error(`Import function failed: ${importError.message}`);
    }

    console.log('✅ GP51 import completed:', importData);
    
    return {
      success: true,
      importedVehicles: importData?.vehiclesProcessed || 0,
      message: 'Vehicle data import completed successfully'
    };
  } catch (error) {
    console.error('❌ Failed to trigger GP51 import:', error);
    throw error;
  }
}
