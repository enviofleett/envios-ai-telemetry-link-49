
import { authenticateWithGP51 } from './gp51-auth.ts';
import { createResponse, createErrorResponse, calculateLatency } from './response-utils.ts';
import type { AuthResult, ImportResult } from './types.ts';

export async function handleGP51Authentication(
  supabase: any,
  userId: string,
  username: string,
  password: string,
  apiUrl?: string,
  startTime?: number
) {
  console.log('🔐 GP51 Authentication for user:', userId);
  const latency = startTime ? calculateLatency(startTime) : 0;
  
  try {
    // Clear any existing sessions for this user
    await supabase
      .from('gp51_sessions')
      .delete()
      .eq('envio_user_id', userId);

    console.log('🧹 Cleared existing GP51 sessions');

    // Authenticate with GP51
    const authResult = await authenticateWithGP51({
      username: username.trim(),
      password,
      apiUrl
    });

    if (!authResult.success) {
      console.error('❌ GP51 authentication failed:', authResult.error);
      return createErrorResponse(
        authResult.error || 'GP51 authentication failed',
        undefined,
        401,
        latency
      );
    }

    // Store the session in database with password hash
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours
    const { data: sessionData, error: sessionError } = await supabase
      .from('gp51_sessions')
      .insert({
        envio_user_id: userId,
        username: authResult.username,
        password_hash: authResult.hashedPassword,
        gp51_token: authResult.token,
        token_expires_at: expiresAt.toISOString(),
        api_url: authResult.apiUrl,
        auth_method: authResult.method || 'GET',
        created_at: new Date().toISOString(),
        last_validated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (sessionError) {
      console.error('❌ Failed to store GP51 session:', sessionError);
      return createErrorResponse('Failed to store session', undefined, 500, latency);
    }

    console.log('✅ GP51 authentication successful, session stored');

    // Trigger immediate GP51 vehicle data import
    console.log('🚀 Triggering GP51 vehicle data import...');
    try {
      const importResult = await triggerGP51Import(supabase, userId, authResult);
      
      return createResponse({
        success: true,
        message: 'GP51 authentication successful',
        session: {
          username: authResult.username,
          expiresAt: expiresAt.toISOString(),
          method: authResult.method
        },
        importResult: importResult,
        latency
      });
    } catch (importError) {
      console.warn('⚠️ GP51 authentication succeeded but import failed:', importError);
      
      // Return success for authentication but note import failure
      return createResponse({
        success: true,
        message: 'GP51 authentication successful, but vehicle import failed',
        session: {
          username: authResult.username,
          expiresAt: expiresAt.toISOString(),
          method: authResult.method
        },
        importError: importError instanceof Error ? importError.message : 'Import failed',
        latency
      });
    }

  } catch (error) {
    console.error('❌ GP51 authentication failed:', error);
    return createErrorResponse(
      'Authentication process failed',
      error instanceof Error ? error.message : 'Unknown error',
      500,
      latency
    );
  }
}

async function triggerGP51Import(supabase: any, userId: string, authResult: AuthResult): Promise<ImportResult> {
  console.log('📡 Starting GP51 vehicle data import for user:', userId);
  
  try {
    // Call the gp51-live-import function
    const { data: importData, error: importError } = await supabase.functions.invoke('gp51-live-import', {
      body: {
        action: 'import-vehicles',
        userId: userId,
        gp51Token: authResult.token,
        gp51Username: authResult.username,
        apiUrl: authResult.apiUrl
      }
    });

    if (importError) {
      console.error('❌ GP51 import function error:', importError);
      throw new Error(`Import function failed: ${importError.message}`);
    }

    console.log('✅ GP51 import completed:', importData);
    
    return {
      success: true,
      importedVehicles: importData?.vehiclesProcessed || 0,
      message: 'Vehicle data import completed successfully'
    };
  } catch (error) {
    console.error('❌ Failed to trigger GP51 import:', error);
    throw error;
  }
}
