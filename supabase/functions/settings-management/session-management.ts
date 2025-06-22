
import { createSuccessResponse, createErrorResponse } from './response-utils.ts';

export async function handleGetGP51Status(adminSupabase: any, userId: string) {
  try {
    console.log(`📊 [GP51Status] Checking GP51 status for user: ${userId}`);

    // Get the most recent GP51 session for this user
    const { data: session, error: sessionError } = await adminSupabase
      .from('gp51_sessions')
      .select('*')
      .eq('envio_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessionError) {
      console.error('❌ [GP51Status] Database error:', sessionError);
      return createErrorResponse('Database error checking GP51 status', sessionError.message, 500);
    }

    if (!session) {
      console.log('📊 [GP51Status] No GP51 session found for user');
      return createSuccessResponse({
        connected: false,
        username: null,
        apiUrl: null,
        lastActivity: null,
        tokenExpiry: null,
        message: 'GP51 not configured for this user'
      });
    }

    // Check if token is expired
    const now = new Date();
    const tokenExpiry = session.token_expires_at ? new Date(session.token_expires_at) : null;
    const isExpired = tokenExpiry ? tokenExpiry <= now : false;

    // Calculate minutes until expiry
    const minutesUntilExpiry = tokenExpiry ? Math.floor((tokenExpiry.getTime() - now.getTime()) / (1000 * 60)) : null;

    const statusInfo = {
      sessionId: session.id,
      username: session.username,
      hasToken: !!session.gp51_token,
      tokenLength: session.gp51_token ? session.gp51_token.length : 0,
      expiresAt: session.token_expires_at,
      isExpired,
      minutesUntilExpiry,
      authMethod: session.auth_method,
      apiUrl: session.api_url
    };

    console.log(`📊 [GP51Status] Session details:`, JSON.stringify(statusInfo, null, 2));

    return createSuccessResponse({
      connected: !isExpired && !!session.gp51_token,
      username: session.username,
      apiUrl: session.api_url,
      lastActivity: session.last_activity_at,
      tokenExpiry: session.token_expires_at,
      isExpired,
      minutesUntilExpiry,
      sessionId: session.id,
      message: isExpired ? 'GP51 session expired - please re-authenticate' : 'GP51 session active'
    });

  } catch (error) {
    console.error('❌ [GP51Status] Unexpected error:', error);
    return createErrorResponse(
      'Unexpected error checking GP51 status',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export async function handleClearGP51Sessions(adminSupabase: any, userId: string) {
  try {
    console.log(`🗑️ [GP51Clear] Clearing GP51 sessions for user: ${userId}`);

    const { data: deletedSessions, error: deleteError } = await adminSupabase
      .from('gp51_sessions')
      .delete()
      .eq('envio_user_id', userId)
      .select();

    if (deleteError) {
      console.error('❌ [GP51Clear] Error deleting sessions:', deleteError);
      return createErrorResponse('Failed to clear GP51 sessions', deleteError.message, 500);
    }

    const deletedCount = deletedSessions ? deletedSessions.length : 0;
    console.log(`✅ [GP51Clear] Cleared ${deletedCount} GP51 sessions`);

    return createSuccessResponse({
      message: `Cleared ${deletedCount} GP51 session(s)`,
      deletedCount
    });

  } catch (error) {
    console.error('❌ [GP51Clear] Unexpected error:', error);
    return createErrorResponse(
      'Unexpected error clearing GP51 sessions',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}
