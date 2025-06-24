
import { createSuccessResponse, createErrorResponse, calculateLatency } from './response-utils.ts';

export async function handleGetGP51Status(adminSupabase: any, userId: string) {
  const startTime = Date.now();
  
  try {
    console.log('🔍 [SESSION-MANAGEMENT] Checking GP51 status for user:', userId);
    
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
      console.error('❌ [SESSION-MANAGEMENT] Database error:', sessionError);
      return createErrorResponse(
        'Failed to check GP51 status',
        sessionError.message,
        500,
        calculateLatency(startTime)
      );
    }

    if (!session) {
      console.log('📭 [SESSION-MANAGEMENT] No active session found');
      return createSuccessResponse({
        connected: false,
        message: 'No active GP51 session found',
        requiresAuth: true,
        warningLevel: 'error'
      }, calculateLatency(startTime));
    }

    // Check token expiration
    const expiresAt = new Date(session.token_expires_at);
    const now = new Date();
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();
    const hoursUntilExpiry = timeUntilExpiry / (1000 * 60 * 60);

    let warningLevel = 'none';
    let message = `Connected as ${session.username}`;
    let requiresAuth = false;

    if (timeUntilExpiry <= 0) {
      // Token expired
      warningLevel = 'error';
      message = 'GP51 session has expired. Please re-authenticate.';
      requiresAuth = true;
      
      // Mark session as inactive
      await adminSupabase
        .from('gp51_sessions')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', session.id);
        
    } else if (hoursUntilExpiry <= 2) {
      // Token expires soon
      warningLevel = 'warning';
      message = `GP51 session expires in ${Math.round(hoursUntilExpiry * 60)} minutes`;
    } else if (hoursUntilExpiry <= 24) {
      // Token expires within a day
      warningLevel = 'info';
      message = `GP51 session expires in ${Math.round(hoursUntilExpiry)} hours`;
    }

    const statusResponse = {
      connected: timeUntilExpiry > 0,
      isExpired: timeUntilExpiry <= 0,
      username: session.username,
      expiresAt: session.token_expires_at,
      message,
      warningLevel,
      requiresAuth,
      statusDetails: {
        sessionId: session.id,
        hoursUntilExpiry: Math.round(hoursUntilExpiry * 100) / 100,
        lastActivity: session.updated_at
      }
    };

    console.log('✅ [SESSION-MANAGEMENT] Status check complete:', {
      connected: statusResponse.connected,
      warningLevel,
      hoursUntilExpiry: Math.round(hoursUntilExpiry * 100) / 100
    });

    return createSuccessResponse(statusResponse, calculateLatency(startTime));
    
  } catch (error) {
    console.error('❌ [SESSION-MANAGEMENT] Status check failed:', error);
    return createErrorResponse(
      'GP51 status check failed',
      error instanceof Error ? error.message : 'Unknown error',
      500,
      calculateLatency(startTime)
    );
  }
}

export async function handleClearGP51Sessions(adminSupabase: any, userId: string) {
  const startTime = Date.now();
  
  try {
    console.log('🧹 [SESSION-MANAGEMENT] Clearing GP51 sessions for user:', userId);
    
    // Get count of sessions to be cleared
    const { data: sessions, error: countError } = await adminSupabase
      .from('gp51_sessions')
      .select('id')
      .eq('envio_user_id', userId);

    if (countError) {
      console.error('❌ [SESSION-MANAGEMENT] Failed to count sessions:', countError);
      return createErrorResponse(
        'Failed to clear sessions',
        countError.message,
        500,
        calculateLatency(startTime)
      );
    }

    const sessionCount = sessions?.length || 0;

    // Clear all sessions for the user
    const { error: deleteError } = await adminSupabase
      .from('gp51_sessions')
      .delete()
      .eq('envio_user_id', userId);

    if (deleteError) {
      console.error('❌ [SESSION-MANAGEMENT] Failed to delete sessions:', deleteError);
      return createErrorResponse(
        'Failed to clear sessions',
        deleteError.message,
        500,
        calculateLatency(startTime)
      );
    }

    console.log(`✅ [SESSION-MANAGEMENT] Cleared ${sessionCount} sessions`);
    
    return createSuccessResponse({
      clearedSessions: sessionCount,
      message: `Successfully cleared ${sessionCount} GP51 sessions`
    }, calculateLatency(startTime));
    
  } catch (error) {
    console.error('❌ [SESSION-MANAGEMENT] Session clearing failed:', error);
    return createErrorResponse(
      'Session clearing failed',
      error instanceof Error ? error.message : 'Unknown error',
      500,
      calculateLatency(startTime)
    );
  }
}

export async function handleSessionHealthCheck(adminSupabase: any, userId: string) {
  const startTime = Date.now();
  
  try {
    console.log('🏥 [SESSION-MANAGEMENT] Running session health check for user:', userId);
    
    // Get all sessions for analysis
    const { data: sessions, error: sessionError } = await adminSupabase
      .from('gp51_sessions')
      .select('*')
      .eq('envio_user_id', userId)
      .order('created_at', { ascending: false });

    if (sessionError) {
      console.error('❌ [SESSION-MANAGEMENT] Health check database error:', sessionError);
      return createErrorResponse(
        'Health check failed',
        sessionError.message,
        500,
        calculateLatency(startTime)
      );
    }

    const now = new Date();
    const activeSessions = sessions?.filter(s => s.is_active) || [];
    const expiredSessions = sessions?.filter(s => new Date(s.token_expires_at) <= now) || [];
    const validSessions = activeSessions.filter(s => new Date(s.token_expires_at) > now);

    // Clean up expired sessions
    if (expiredSessions.length > 0) {
      await adminSupabase
        .from('gp51_sessions')
        .update({ is_active: false, updated_at: now.toISOString() })
        .in('id', expiredSessions.map(s => s.id));
    }

    const healthStatus = validSessions.length > 0 ? 'healthy' : 'unhealthy';
    const message = validSessions.length > 0 
      ? `Health check passed. ${validSessions.length} valid sessions found.`
      : 'No valid sessions found. Re-authentication required.';

    console.log(`🏥 [SESSION-MANAGEMENT] Health check complete:`, {
      healthStatus,
      totalSessions: sessions?.length || 0,
      activeSessions: activeSessions.length,
      expiredSessions: expiredSessions.length,
      validSessions: validSessions.length
    });

    return createSuccessResponse({
      healthStatus,
      message,
      sessionStats: {
        total: sessions?.length || 0,
        active: activeSessions.length,
        expired: expiredSessions.length,
        valid: validSessions.length
      }
    }, calculateLatency(startTime));
    
  } catch (error) {
    console.error('❌ [SESSION-MANAGEMENT] Health check failed:', error);
    return createErrorResponse(
      'Health check failed',
      error instanceof Error ? error.message : 'Unknown error',
      500,
      calculateLatency(startTime)
    );
  }
}
