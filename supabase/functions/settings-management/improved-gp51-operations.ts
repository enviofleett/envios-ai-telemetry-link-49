
import { createSuccessResponse, createErrorResponse, calculateLatency } from './response-utils.ts';
import { authenticateWithGP51 } from './gp51-auth.ts';
import { GP51TokenValidator } from './token-validation.ts';
import { md5_sync } from '../_shared/crypto_utils.ts';

export async function handleImprovedGP51Authentication(
  adminSupabase: any,
  userId: string,
  username: string,
  password: string,
  apiUrl: string = 'https://www.gps51.com',
  startTime: number
) {
  try {
    console.log(`🔐 [IMPROVED-GP51-OPS] Starting enhanced authentication for user ${userId}, username: ${username}`);

    // Generate MD5 hash of the password for storage
    const passwordHash = md5_sync(password);
    const sessionFingerprint = md5_sync(`${username}_${Date.now()}_${Math.random()}`);

    // Authenticate with GP51
    const authResult = await authenticateWithGP51({
      username,
      password,
      apiUrl
    });

    if (!authResult.success) {
      console.error('❌ [IMPROVED-GP51-OPS] GP51 authentication failed:', authResult.error);
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
      console.error('❌ [IMPROVED-GP51-OPS] Token validation failed:', tokenValidation.error);
      return createErrorResponse(
        'Token validation failed',
        tokenValidation.error || 'Invalid token received',
        400,
        calculateLatency(startTime)
      );
    }

    // Calculate token expiration (GP51 tokens typically last 24 hours)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 23);

    // Use the new upsert function to safely store the session
    const { data: sessionResult, error: sessionError } = await adminSupabase
      .rpc('upsert_gp51_session', {
        p_envio_user_id: userId,
        p_username: username,
        p_password_hash: passwordHash,
        p_gp51_token: authResult.token,
        p_api_url: apiUrl,
        p_token_expires_at: expiresAt.toISOString(),
        p_session_fingerprint: sessionFingerprint
      });

    if (sessionError) {
      console.error('❌ [IMPROVED-GP51-OPS] Failed to upsert session:', sessionError);
      return createErrorResponse(
        'Failed to store GP51 session',
        sessionError.message,
        500,
        calculateLatency(startTime)
      );
    }

    console.log('✅ [IMPROVED-GP51-OPS] Authentication successful, session upserted:', sessionResult);

    return createSuccessResponse({
      message: 'GP51 authentication successful',
      username: username,
      apiUrl: apiUrl,
      sessionId: sessionResult,
      expiresAt: expiresAt.toISOString(),
      sessionFingerprint: sessionFingerprint
    }, calculateLatency(startTime));

  } catch (error) {
    console.error('❌ [IMPROVED-GP51-OPS] Authentication error:', error);
    return createErrorResponse(
      'GP51 authentication failed',
      error instanceof Error ? error.message : 'Unknown error',
      500,
      calculateLatency(startTime)
    );
  }
}

export async function refreshGP51SessionSafely(adminSupabase: any, userId: string) {
  try {
    console.log(`🔄 [IMPROVED-GP51-OPS] Safely refreshing session for user: ${userId}`);

    // Get the most recent active session
    const { data: session, error: sessionError } = await adminSupabase
      .from('gp51_sessions')
      .select('*')
      .eq('envio_user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessionError) {
      console.error('❌ [IMPROVED-GP51-OPS] Database error during refresh:', sessionError);
      return {
        success: false,
        error: 'Failed to retrieve session for refresh'
      };
    }

    if (!session) {
      console.log('📭 [IMPROVED-GP51-OPS] No active session found for refresh');
      return {
        success: false,
        error: 'No active GP51 session found to refresh',
        requiresReauth: true
      };
    }

    // Check if session is close to expiring (within 2 hours)
    const expiresAt = new Date(session.token_expires_at);
    const now = new Date();
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();
    const hoursUntilExpiry = timeUntilExpiry / (1000 * 60 * 60);

    if (hoursUntilExpiry > 2) {
      console.log(`⏰ [IMPROVED-GP51-OPS] Session still valid for ${hoursUntilExpiry.toFixed(1)} hours`);
      return {
        success: true,
        message: `Session is still valid for ${hoursUntilExpiry.toFixed(1)} hours`,
        requiresReauth: false
      };
    }

    // Session needs refresh - mark as inactive and require re-authentication
    await adminSupabase
      .from('gp51_sessions')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.id);

    console.log('🔄 [IMPROVED-GP51-OPS] Session marked for refresh, requires re-authentication');

    return {
      success: true,
      message: 'Session refresh initiated. Re-authentication required.',
      requiresReauth: true
    };

  } catch (error) {
    console.error('❌ [IMPROVED-GP51-OPS] Refresh error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Refresh failed'
    };
  }
}

export async function validateGP51SessionHealth(adminSupabase: any, userId: string) {
  try {
    console.log(`🏥 [IMPROVED-GP51-OPS] Validating session health for user: ${userId}`);

    // Cleanup expired sessions first
    await adminSupabase.rpc('cleanup_expired_gp51_sessions');

    // Get current active sessions
    const { data: sessions, error: sessionError } = await adminSupabase
      .from('gp51_sessions')
      .select('*')
      .eq('envio_user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (sessionError) {
      console.error('❌ [IMPROVED-GP51-OPS] Health check database error:', sessionError);
      return {
        isHealthy: false,
        error: sessionError.message,
        recommendations: ['Check database connectivity', 'Review session permissions']
      };
    }

    const now = new Date();
    const validSessions = sessions?.filter(s => new Date(s.token_expires_at) > now) || [];
    const expiringSoon = validSessions.filter(s => {
      const expiresAt = new Date(s.token_expires_at);
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();
      return timeUntilExpiry < (2 * 60 * 60 * 1000); // Less than 2 hours
    });

    const healthStatus = {
      isHealthy: validSessions.length > 0,
      totalSessions: sessions?.length || 0,
      validSessions: validSessions.length,
      expiringSoon: expiringSoon.length,
      recommendations: []
    };

    if (validSessions.length === 0) {
      healthStatus.recommendations.push('Re-authenticate with GP51 credentials');
    } else if (expiringSoon.length > 0) {
      healthStatus.recommendations.push('Session expires soon - consider refreshing');
    }

    if (healthStatus.totalSessions > 3) {
      healthStatus.recommendations.push('Multiple sessions detected - consider cleanup');
    }

    console.log('🏥 [IMPROVED-GP51-OPS] Health check complete:', healthStatus);
    return healthStatus;

  } catch (error) {
    console.error('❌ [IMPROVED-GP51-OPS] Health validation error:', error);
    return {
      isHealthy: false,
      error: error instanceof Error ? error.message : 'Health check failed',
      recommendations: ['Check system connectivity', 'Review error logs']
    };
  }
}
