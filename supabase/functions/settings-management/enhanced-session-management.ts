
import { createSuccessResponse, createErrorResponse, calculateLatency } from './response-utils.ts';
import { handleImprovedGP51Authentication, refreshGP51SessionSafely, validateGP51SessionHealth } from './improved-gp51-operations.ts';

export async function handleEnhancedGetGP51Status(adminSupabase: any, userId: string) {
  const startTime = Date.now();
  
  try {
    console.log('🔍 [ENHANCED-SESSION] Checking GP51 status for user:', userId);
    
    // First, run health validation
    const healthCheck = await validateGP51SessionHealth(adminSupabase, userId);
    
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
      console.error('❌ [ENHANCED-SESSION] Database error:', sessionError);
      return createErrorResponse(
        'Failed to check GP51 status',
        sessionError.message,
        500,
        calculateLatency(startTime)
      );
    }

    if (!session) {
      console.log('📭 [ENHANCED-SESSION] No active session found');
      return createSuccessResponse({
        connected: false,
        message: 'No active GP51 session found',
        requiresAuth: true,
        warningLevel: 'error',
        healthCheck: healthCheck
      }, calculateLatency(startTime));
    }

    // Check token expiration with enhanced logic
    const expiresAt = new Date(session.token_expires_at);
    const now = new Date();
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();
    const hoursUntilExpiry = timeUntilExpiry / (1000 * 60 * 60);

    let warningLevel = 'none';
    let message = `Connected as ${session.username}`;
    let requiresAuth = false;

    if (timeUntilExpiry <= 0) {
      // Token expired - mark as inactive
      warningLevel = 'error';
      message = 'GP51 session has expired. Please re-authenticate.';
      requiresAuth = true;
      
      await adminSupabase
        .from('gp51_sessions')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', session.id);
        
    } else if (hoursUntilExpiry <= 1) {
      // Token expires very soon
      warningLevel = 'error';
      message = `GP51 session expires in ${Math.round(hoursUntilExpiry * 60)} minutes. Re-authentication recommended.`;
      requiresAuth = true;
    } else if (hoursUntilExpiry <= 2) {
      // Token expires soon
      warningLevel = 'warning';
      message = `GP51 session expires in ${Math.round(hoursUntilExpiry * 60)} minutes`;
    } else if (hoursUntilExpiry <= 6) {
      // Token expires within 6 hours
      warningLevel = 'info';
      message = `GP51 session expires in ${Math.round(hoursUntilExpiry)} hours`;
    }

    // Check last activity
    const lastActivity = new Date(session.last_activity_at || session.updated_at);
    const timeSinceActivity = now.getTime() - lastActivity.getTime();
    const hoursSinceActivity = timeSinceActivity / (1000 * 60 * 60);

    if (hoursSinceActivity > 24) {
      warningLevel = Math.max(warningLevel === 'none' ? 0 : warningLevel === 'info' ? 1 : warningLevel === 'warning' ? 2 : 3, 1);
      message += ` (inactive for ${Math.round(hoursSinceActivity)} hours)`;
    }

    const statusResponse = {
      connected: timeUntilExpiry > 0,
      isExpired: timeUntilExpiry <= 0,
      username: session.username,
      expiresAt: session.token_expires_at,
      message,
      warningLevel,
      requiresAuth,
      healthCheck: healthCheck,
      statusDetails: {
        sessionId: session.id,
        hoursUntilExpiry: Math.round(hoursUntilExpiry * 100) / 100,
        hoursSinceActivity: Math.round(hoursSinceActivity * 100) / 100,
        lastActivity: session.last_activity_at || session.updated_at,
        sessionFingerprint: session.session_fingerprint
      }
    };

    console.log('✅ [ENHANCED-SESSION] Enhanced status check complete:', {
      connected: statusResponse.connected,
      warningLevel,
      hoursUntilExpiry: Math.round(hoursUntilExpiry * 100) / 100,
      healthScore: healthCheck.isHealthy
    });

    return createSuccessResponse(statusResponse, calculateLatency(startTime));
    
  } catch (error) {
    console.error('❌ [ENHANCED-SESSION] Enhanced status check failed:', error);
    return createErrorResponse(
      'GP51 status check failed',
      error instanceof Error ? error.message : 'Unknown error',
      500,
      calculateLatency(startTime)
    );
  }
}

export async function handleSmartGP51SessionRefresh(adminSupabase: any, userId: string) {
  const startTime = Date.now();
  
  try {
    console.log('🔄 [ENHANCED-SESSION] Smart session refresh for user:', userId);
    
    const refreshResult = await refreshGP51SessionSafely(adminSupabase, userId);
    
    return createSuccessResponse({
      refreshed: refreshResult.success,
      message: refreshResult.message,
      requiresReauth: refreshResult.requiresReauth,
      error: refreshResult.error
    }, calculateLatency(startTime));
    
  } catch (error) {
    console.error('❌ [ENHANCED-SESSION] Smart refresh failed:', error);
    return createErrorResponse(
      'Session refresh failed',
      error instanceof Error ? error.message : 'Unknown error',
      500,
      calculateLatency(startTime)
    );
  }
}

export async function handleGP51HealthCheck(adminSupabase: any, userId: string) {
  const startTime = Date.now();
  
  try {
    console.log('🏥 [ENHANCED-SESSION] Running comprehensive health check for user:', userId);
    
    const healthResult = await validateGP51SessionHealth(adminSupabase, userId);
    
    return createSuccessResponse({
      healthStatus: healthResult.isHealthy ? 'healthy' : 'unhealthy',
      message: healthResult.isHealthy 
        ? `Health check passed. ${healthResult.validSessions} valid sessions found.`
        : `Health issues detected. ${healthResult.error || 'Multiple issues found.'}`,
      sessionStats: {
        total: healthResult.totalSessions,
        valid: healthResult.validSessions,
        expiringSoon: healthResult.expiringSoon
      },
      recommendations: healthResult.recommendations,
      isHealthy: healthResult.isHealthy
    }, calculateLatency(startTime));
    
  } catch (error) {
    console.error('❌ [ENHANCED-SESSION] Health check failed:', error);
    return createErrorResponse(
      'Health check failed',
      error instanceof Error ? error.message : 'Unknown error',
      500,
      calculateLatency(startTime)
    );
  }
}
