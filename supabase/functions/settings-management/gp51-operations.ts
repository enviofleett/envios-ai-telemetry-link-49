
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { authenticateWithGP51 } from './gp51-auth.ts';
import { createSuccessResponse, createErrorResponse, calculateLatency } from './response-utils.ts';

export async function handleGP51Authentication(
  adminSupabase: any,
  userId: string,
  username: string,
  password: string,
  apiUrl?: string,
  startTime?: number
) {
  try {
    console.log(`🔐 Starting GP51 authentication for user ${userId} with username: ${username}`);
    
    const authResult = await authenticateWithGP51({
      username,
      password,
      apiUrl
    });

    if (!authResult.success) {
      console.error('❌ GP51 authentication failed:', authResult.error);
      return createErrorResponse(
        authResult.error || 'GP51 authentication failed',
        undefined,
        401,
        startTime ? calculateLatency(startTime) : undefined
      );
    }

    console.log('✅ GP51 authentication successful, saving credentials...');

    // Store encrypted credentials using correct column names
    const { error: insertError } = await adminSupabase
      .from('gp51_sessions')
      .upsert({
        envio_user_id: userId,
        username: authResult.username,
        gp51_token: authResult.token,
        token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        api_url: authResult.apiUrl,
        last_activity_at: new Date().toISOString()
      }, {
        onConflict: 'username'
      });

    if (insertError) {
      console.error('❌ Failed to save GP51 session:', insertError);
      return createErrorResponse(
        'Failed to save GP51 credentials',
        insertError.message,
        500,
        startTime ? calculateLatency(startTime) : undefined
      );
    }

    console.log('✅ GP51 credentials saved successfully');
    
    return createSuccessResponse({
      message: 'GP51 authentication successful',
      username: authResult.username,
      apiUrl: authResult.apiUrl,
      method: authResult.method
    }, startTime ? calculateLatency(startTime) : undefined);

  } catch (error) {
    console.error('❌ Unexpected error in GP51 authentication:', error);
    return createErrorResponse(
      'Internal server error during GP51 authentication',
      error instanceof Error ? error.message : 'Unknown error',
      500,
      startTime ? calculateLatency(startTime) : undefined
    );
  }
}
