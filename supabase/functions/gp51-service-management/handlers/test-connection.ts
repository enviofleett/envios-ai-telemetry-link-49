
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getLatestGp51Session, validateGp51Session } from '../supabase-helpers.ts';
import { successResponse, errorResponse } from '../response-helpers.ts';

export async function handleTestConnection(supabase: SupabaseClient, startTime: number) {
  try {
    console.log('🔍 Testing GP51 connection...');
    
    // Get the latest session
    const { session, error: sessionError, response: sessionErrorResponse } = await getLatestGp51Session(supabase);
    
    if (sessionError) {
      return sessionErrorResponse;
    }
    
    if (!session) {
      return errorResponse('No GP51 session found. Please authenticate first.', 404);
    }
    
    // Validate the session
    const { valid, reason } = await validateGp51Session(session);
    
    if (!valid) {
      return errorResponse(`GP51 session invalid: ${reason}`, 401);
    }
    
    const responseTime = Date.now() - startTime;
    
    console.log('✅ GP51 connection test successful');
    
    return successResponse({
      isValid: true,
      username: session.username,
      expiresAt: session.token_expires_at,
      responseTime,
      status: 'connected',
      lastActivity: session.last_activity_at
    });
    
  } catch (error) {
    console.error('❌ GP51 connection test failed:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Connection test failed',
      500
    );
  }
}
