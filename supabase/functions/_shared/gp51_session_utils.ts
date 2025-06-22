
import { getSupabaseClient } from "./supabase_client.ts";
import { createErrorResponse } from "./response_utils.ts";

export interface GP51Session {
  id: string;
  envio_user_id: string;
  username: string;
  gp51_token: string;
  token_expires_at: string;
  created_at: string;
  last_validated_at?: string;
  auth_method?: string;
  api_url?: string;
}

export interface SessionValidationResult {
  session: GP51Session | null;
  errorResponse: Response | null;
}

export async function getValidGp51Session(): Promise<SessionValidationResult> {
  console.log('🔍 [GP51SessionUtils] Validating GP51 session...');
  
  try {
    const supabase = getSupabaseClient();

    // Get the most recent active session
    const { data: sessions, error: sessionError } = await supabase
      .from('gp51_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (sessionError) {
      console.error('❌ [GP51SessionUtils] Database error:', sessionError);
      return {
        session: null,
        errorResponse: createErrorResponse(
          'Failed to retrieve GP51 session',
          sessionError.message,
          500
        )
      };
    }

    if (!sessions || sessions.length === 0) {
      console.log('📝 [GP51SessionUtils] No GP51 sessions found');
      return {
        session: null,
        errorResponse: createErrorResponse(
          'No GP51 configuration found',
          'Please authenticate with GP51 first',
          401
        )
      };
    }

    const session = sessions[0] as GP51Session;
    
    // Check if session is expired
    const now = new Date();
    const expiresAt = new Date(session.token_expires_at);
    
    if (expiresAt <= now) {
      console.log('⏰ [GP51SessionUtils] Session expired:', {
        sessionId: session.id,
        username: session.username,
        expiresAt: session.token_expires_at
      });
      
      return {
        session: null,
        errorResponse: createErrorResponse(
          'GP51 session expired',
          'Please re-authenticate with GP51',
          401
        )
      };
    }

    // Validate required fields
    if (!session.gp51_token || !session.username || !session.envio_user_id) {
      console.error('❌ [GP51SessionUtils] Invalid session data:', {
        hasToken: !!session.gp51_token,
        hasUsername: !!session.username,
        hasUserId: !!session.envio_user_id
      });
      
      return {
        session: null,
        errorResponse: createErrorResponse(
          'Invalid GP51 session data',
          'Session is missing required fields',
          400
        )
      };
    }

    const timeUntilExpiry = expiresAt.getTime() - now.getTime();
    const minutesUntilExpiry = Math.round(timeUntilExpiry / (1000 * 60));

    console.log('✅ [GP51SessionUtils] Valid session found:', {
      sessionId: session.id,
      username: session.username,
      userId: session.envio_user_id,
      minutesUntilExpiry,
      authMethod: session.auth_method || 'unknown'
    });

    return {
      session,
      errorResponse: null
    };

  } catch (error) {
    console.error('❌ [GP51SessionUtils] Session validation failed:', error);
    return {
      session: null,
      errorResponse: createErrorResponse(
        'Session validation failed',
        error instanceof Error ? error.message : 'Unknown error',
        500
      )
    };
  }
}

export async function updateSessionActivity(sessionId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('gp51_sessions')
      .update({
        last_validated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) {
      console.error('❌ [GP51SessionUtils] Failed to update session activity:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ [GP51SessionUtils] Error updating session activity:', error);
    return false;
  }
}
