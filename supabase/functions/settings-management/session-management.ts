
import { createResponse, createErrorResponse } from './response-utils.ts';

export async function handleGetGP51Status(supabase: any, userId: string) {
  console.log('📊 [GP51Status] Checking GP51 status for user:', userId);
  
  try {
    // Get the most recent session for this user
    const { data: sessions, error: sessionError } = await supabase
      .from('gp51_sessions')
      .select('id, username, gp51_token, token_expires_at, created_at, last_validated_at, auth_method, api_url')
      .eq('envio_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (sessionError) {
      console.error('❌ [GP51Status] Database error:', sessionError);
      return createErrorResponse('Failed to check GP51 status', sessionError.message, 500);
    }

    if (!sessions || sessions.length === 0) {
      console.log('📝 [GP51Status] No GP51 sessions found for user');
      return createResponse({
        connected: false,
        isExpired: false,
        message: 'No GP51 configuration found. Please authenticate first.',
        requiresAuth: true
      });
    }

    const session = sessions[0];
    const now = new Date();
    const expiresAt = new Date(session.token_expires_at);
    const isExpired = expiresAt <= now;
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();
    const minutesUntilExpiry = Math.round(timeUntilExpiry / (1000 * 60));

    console.log('📊 [GP51Status] Session details:', {
      sessionId: session.id,
      username: session.username,
      hasToken: !!session.gp51_token,
      tokenLength: session.gp51_token?.length || 0,
      expiresAt: session.token_expires_at,
      isExpired,
      minutesUntilExpiry,
      authMethod: session.auth_method,
      apiUrl: session.api_url
    });

    return createResponse({
      connected: !isExpired,
      isExpired,
      username: session.username,
      expiresAt: session.token_expires_at,
      createdAt: session.created_at,
      lastValidated: session.last_validated_at,
      authMethod: session.auth_method,
      apiUrl: session.api_url,
      sessionId: session.id,
      timeUntilExpiry: minutesUntilExpiry,
      tokenPresent: !!session.gp51_token,
      tokenLength: session.gp51_token?.length || 0,
      message: isExpired ? 
        'GP51 session has expired. Please re-authenticate.' : 
        `GP51 session active. Expires in ${minutesUntilExpiry} minutes.`
    });

  } catch (error) {
    console.error('❌ [GP51Status] Status check failed:', error);
    return createErrorResponse(
      'GP51 status check failed',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export async function handleClearGP51Sessions(supabase: any, userId: string) {
  console.log('🧹 [GP51Clear] Clearing GP51 sessions for user:', userId);
  
  try {
    // Get sessions before deleting for logging
    const { data: existingSessions, error: selectError } = await supabase
      .from('gp51_sessions')
      .select('id, username, created_at')
      .eq('envio_user_id', userId);

    if (selectError) {
      console.error('❌ [GP51Clear] Failed to fetch existing sessions:', selectError);
      // Continue with deletion anyway
    } else {
      console.log(`🔍 [GP51Clear] Found ${existingSessions?.length || 0} sessions to clear`);
      existingSessions?.forEach(session => {
        console.log(`🗑️ [GP51Clear] Will delete session ${session.id} for ${session.username}`);
      });
    }

    const { error: deleteError, count } = await supabase
      .from('gp51_sessions')
      .delete()
      .eq('envio_user_id', userId)
      .select('id', { count: 'exact' });

    if (deleteError) {
      console.error('❌ [GP51Clear] Failed to clear GP51 sessions:', deleteError);
      return createErrorResponse('Failed to clear GP51 sessions', deleteError.message, 500);
    }

    console.log(`✅ [GP51Clear] Successfully cleared ${count || 0} GP51 sessions`);

    return createResponse({
      success: true,
      message: `Successfully cleared ${count || 0} GP51 sessions`,
      clearedSessions: count || 0
    });

  } catch (error) {
    console.error('❌ [GP51Clear] Clear sessions failed:', error);
    return createErrorResponse(
      'Failed to clear GP51 sessions',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}
