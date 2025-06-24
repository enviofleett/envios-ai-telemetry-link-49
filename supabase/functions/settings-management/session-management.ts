
import { createResponse, createErrorResponse } from './response-utils.ts';
import { GP51TokenValidator } from './token-validation.ts';
import { refreshGP51Credentials } from './gp51-operations.ts';

export async function handleGetGP51Status(supabase: any, userId: string) {
  console.log('📊 [GP51Status] Checking enhanced GP51 status for user:', userId);
  
  try {
    // Get the most recent session for this user
    const { data: sessions, error: sessionError } = await supabase
      .from('gp51_sessions')
      .select('id, username, gp51_token, token_expires_at, created_at, last_validated_at, auth_method, api_url, is_active')
      .eq('envio_user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (sessionError) {
      console.error('❌ [GP51Status] Database error:', sessionError);
      return createErrorResponse('Failed to check GP51 status', sessionError.message, 500);
    }

    if (!sessions || sessions.length === 0) {
      console.log('📝 [GP51Status] No active GP51 sessions found for user');
      
      // Check if there are any inactive sessions that might need cleanup
      const { data: inactiveSessions } = await supabase
        .from('gp51_sessions')
        .select('id')
        .eq('envio_user_id', userId)
        .eq('is_active', false);

      const hasInactiveSessions = inactiveSessions && inactiveSessions.length > 0;

      return createResponse({
        connected: false,
        isExpired: false,
        message: 'No GP51 configuration found. Please authenticate first.',
        requiresAuth: true,
        hasInactiveSessions,
        statusDetails: {
          sessionsFound: 0,
          inactiveSessionsFound: inactiveSessions?.length || 0
        }
      });
    }

    const session = sessions[0];
    const now = new Date();
    const expiresAt = new Date(session.token_expires_at);
    const isExpired = expiresAt <= now;
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();
    const minutesUntilExpiry = Math.round(timeUntilExpiry / (1000 * 60));

    // Validate the stored session
    const isSessionValid = await GP51TokenValidator.validateStoredSession(supabase, session.id);

    console.log('📊 [GP51Status] Session analysis:', {
      sessionId: session.id,
      username: session.username,
      hasToken: !!session.gp51_token,
      tokenLength: session.gp51_token?.length || 0,
      expiresAt: session.token_expires_at,
      isExpired,
      minutesUntilExpiry,
      authMethod: session.auth_method,
      apiUrl: session.api_url,
      isActive: session.is_active,
      isSessionValid
    });

    // If session is invalid but not expired, try to refresh
    if (!isSessionValid && !isExpired) {
      console.log('🔄 [GP51Status] Session invalid but not expired, attempting refresh...');
      
      const refreshResult = await refreshGP51Credentials(supabase, userId);
      if (refreshResult.success) {
        console.log('✅ [GP51Status] Session refreshed successfully');
        return createResponse({
          connected: true,
          isExpired: false,
          username: session.username,
          message: 'Session refreshed successfully',
          refreshed: true
        });
      } else {
        console.error('❌ [GP51Status] Session refresh failed:', refreshResult.error);
        // Mark session as inactive
        await supabase
          .from('gp51_sessions')
          .update({ is_active: false })
          .eq('id', session.id);
      }
    }

    // Determine connection status
    const connected = !isExpired && isSessionValid;
    let message = '';
    let warningLevel = 'none';

    if (isExpired) {
      message = 'GP51 session has expired. Please re-authenticate.';
      warningLevel = 'error';
    } else if (!isSessionValid) {
      message = 'GP51 session is invalid. Please re-authenticate.';
      warningLevel = 'error';
    } else if (minutesUntilExpiry < 60) {
      message = `GP51 session expires in ${minutesUntilExpiry} minutes.`;
      warningLevel = 'warning';
    } else {
      message = `GP51 session active. Expires in ${Math.round(minutesUntilExpiry / 60)} hours.`;
      warningLevel = 'info';
    }

    return createResponse({
      connected,
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
      isSessionValid,
      message,
      warningLevel,
      statusDetails: {
        sessionActive: session.is_active,
        validationPassed: isSessionValid,
        timeToExpiry: timeUntilExpiry
      }
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
  console.log('🧹 [GP51Clear] Enhanced session clearing for user:', userId);
  
  try {
    // Get sessions before deleting for logging
    const { data: existingSessions, error: selectError } = await supabase
      .from('gp51_sessions')
      .select('id, username, created_at, is_active, token_expires_at')
      .eq('envio_user_id', userId);

    if (selectError) {
      console.error('❌ [GP51Clear] Failed to fetch existing sessions:', selectError);
    } else {
      console.log(`🔍 [GP51Clear] Found ${existingSessions?.length || 0} sessions to clear`);
      existingSessions?.forEach(session => {
        console.log(`🗑️ [GP51Clear] Will delete session ${session.id} for ${session.username} (active: ${session.is_active})`);
      });
    }

    // Delete sessions and get count
    const { error: deleteError, count } = await supabase
      .from('gp51_sessions')
      .delete()
      .eq('envio_user_id', userId)
      .select('id', { count: 'exact' });

    if (deleteError) {
      console.error('❌ [GP51Clear] Failed to clear GP51 sessions:', deleteError);
      return createErrorResponse('Failed to clear GP51 sessions', deleteError.message, 500);
    }

    // Also cleanup any related security audit entries (optional)
    try {
      await supabase
        .from('gp51_security_audit')
        .insert({
          user_id: userId,
          operation_type: 'SESSIONS_CLEARED',
          operation_details: {
            clearedSessions: count || 0,
            timestamp: new Date().toISOString()
          },
          success: true
        });
    } catch (auditError) {
      console.warn('⚠️ [GP51Clear] Failed to log session clearing:', auditError);
    }

    console.log(`✅ [GP51Clear] Successfully cleared ${count || 0} GP51 sessions`);

    return createResponse({
      success: true,
      message: `Successfully cleared ${count || 0} GP51 sessions`,
      clearedSessions: count || 0,
      sessionDetails: existingSessions?.map(s => ({
        id: s.id,
        username: s.username,
        wasActive: s.is_active
      })) || []
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

// New function to handle session health checks
export async function handleSessionHealthCheck(supabase: any, userId: string) {
  console.log('🏥 [GP51Health] Running session health check for user:', userId);
  
  try {
    // Run comprehensive session validation and cleanup
    await GP51TokenValidator.cleanupInvalidSessions(supabase, userId);
    
    // Get current status after cleanup
    const statusResult = await handleGetGP51Status(supabase, userId);
    const statusData = await statusResult.json();
    
    return createResponse({
      success: true,
      message: 'Session health check completed',
      healthStatus: statusData.connected ? 'healthy' : 'unhealthy',
      recommendations: generateHealthRecommendations(statusData),
      statusData
    });
    
  } catch (error) {
    console.error('❌ [GP51Health] Health check failed:', error);
    return createErrorResponse(
      'Session health check failed',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

function generateHealthRecommendations(statusData: any): string[] {
  const recommendations: string[] = [];
  
  if (!statusData.connected) {
    recommendations.push('Re-authenticate with your GP51 credentials');
  }
  
  if (statusData.isExpired) {
    recommendations.push('Your session has expired - please login again');
  }
  
  if (statusData.timeUntilExpiry && statusData.timeUntilExpiry < 60) {
    recommendations.push('Session expires soon - consider refreshing your session');
  }
  
  if (statusData.hasInactiveSessions) {
    recommendations.push('Clear inactive sessions to improve performance');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Your GP51 connection is healthy');
  }
  
  return recommendations;
}
