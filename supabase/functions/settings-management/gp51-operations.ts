
import { createSuccessResponse, createErrorResponse, calculateLatency } from './response-utils.ts';
import { authenticateWithGP51 } from './gp51-auth.ts';
import { GP51TokenValidator } from './token-validation.ts';

export async function handleGP51Authentication(
  adminSupabase: any,
  userId: string,
  username: string,
  password: string,
  apiUrl: string = 'https://www.gps51.com',
  startTime: number
) {
  try {
    console.log(`🔐 [GP51-OPERATIONS] Starting authentication for user ${userId}, username: ${username}`);

    // Authenticate with GP51
    const authResult = await authenticateWithGP51({
      username,
      password,
      apiUrl
    });

    if (!authResult.success) {
      console.error('❌ [GP51-OPERATIONS] GP51 authentication failed:', authResult.error);
      return createErrorResponse(
        'GP51 authentication failed',
        authResult.error || 'Invalid credentials',
        401,
        calculateLatency(startTime)
      );
    }

    // Validate the received token
    const tokenValidation = GP51TokenValidator.validateTokenResponse({
      status: 0,
      token: authResult.token
    });

    if (!tokenValidation.isValid) {
      console.error('❌ [GP51-OPERATIONS] Token validation failed:', tokenValidation.error);
      return createErrorResponse(
        'Token validation failed',
        tokenValidation.error || 'Invalid token received',
        400,
        calculateLatency(startTime)
      );
    }

    // Clear any existing sessions for this user
    await adminSupabase
      .from('gp51_sessions')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('envio_user_id', userId);

    // Create new session
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 23); // GP51 tokens typically last 24 hours

    const { data: session, error: sessionError } = await adminSupabase
      .from('gp51_sessions')
      .insert({
        envio_user_id: userId,
        username: authResult.username,
        gp51_token: authResult.token,
        api_url: authResult.apiUrl,
        token_expires_at: expiresAt.toISOString(),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (sessionError) {
      console.error('❌ [GP51-OPERATIONS] Failed to store session:', sessionError);
      return createErrorResponse(
        'Failed to store GP51 session',
        sessionError.message,
        500,
        calculateLatency(startTime)
      );
    }

    console.log('✅ [GP51-OPERATIONS] Authentication successful, session created:', session.id);

    return createSuccessResponse({
      message: 'GP51 authentication successful',
      username: authResult.username,
      apiUrl: authResult.apiUrl,
      sessionId: session.id,
      expiresAt: expiresAt.toISOString()
    }, calculateLatency(startTime));

  } catch (error) {
    console.error('❌ [GP51-OPERATIONS] Authentication error:', error);
    return createErrorResponse(
      'GP51 authentication failed',
      error instanceof Error ? error.message : 'Unknown error',
      500,
      calculateLatency(startTime)
    );
  }
}

export async function refreshGP51Credentials(adminSupabase: any, userId: string) {
  try {
    console.log(`🔄 [GP51-OPERATIONS] Refreshing credentials for user: ${userId}`);

    // Get the most recent session
    const { data: session, error: sessionError } = await adminSupabase
      .from('gp51_sessions')
      .select('*')
      .eq('envio_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessionError || !session) {
      console.error('❌ [GP51-OPERATIONS] No session found for refresh:', sessionError);
      return {
        success: false,
        error: 'No GP51 session found to refresh'
      };
    }

    // Mark current session as inactive
    await adminSupabase
      .from('gp51_sessions')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.id);

    console.log('🔄 [GP51-OPERATIONS] Session marked as inactive, requires re-authentication');

    return {
      success: true,
      message: 'Session refresh initiated. Re-authentication required.',
      requiresReauth: true
    };

  } catch (error) {
    console.error('❌ [GP51-OPERATIONS] Refresh error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Refresh failed'
    };
  }
}
