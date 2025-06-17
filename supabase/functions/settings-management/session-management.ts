
import { createResponse, createErrorResponse } from './response-utils.ts';

export async function handleGetGP51Status(supabase: any, userId: string) {
  try {
    const { data: sessions, error } = await supabase
      .from('gp51_sessions')
      .select('*')
      .eq('envio_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ Error fetching GP51 status:', error);
      return createErrorResponse('Database error', undefined, 500);
    }

    if (!sessions || sessions.length === 0) {
      return createResponse({
        success: false,
        connected: false,
        message: 'No GP51 sessions found'
      });
    }

    const session = sessions[0];
    const expiresAt = new Date(session.token_expires_at);
    const now = new Date();
    const isExpired = expiresAt <= now;

    return createResponse({
      success: true,
      connected: !isExpired,
      username: session.username,
      expiresAt: session.token_expires_at,
      apiUrl: session.api_url,
      lastValidated: session.last_validated_at,
      isExpired
    });

  } catch (error) {
    console.error('❌ GP51 status check failed:', error);
    return createErrorResponse('Status check failed', undefined, 500);
  }
}

export async function handleClearGP51Sessions(supabase: any, userId: string) {
  try {
    const { error } = await supabase
      .from('gp51_sessions')
      .delete()
      .eq('envio_user_id', userId);

    if (error) {
      console.error('❌ Failed to clear GP51 sessions:', error);
      return createErrorResponse('Failed to clear sessions', undefined, 500);
    }

    console.log('✅ GP51 sessions cleared for user:', userId);
    return createResponse({
      success: true,
      message: 'GP51 sessions cleared successfully'
    });

  } catch (error) {
    console.error('❌ Session clearing failed:', error);
    return createErrorResponse('Session clearing failed', undefined, 500);
  }
}
