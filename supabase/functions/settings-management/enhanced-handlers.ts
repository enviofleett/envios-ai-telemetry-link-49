
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createResponse } from './cors.ts';
import { authenticateWithGP51 } from './gp51-auth.ts';
import { GP51ErrorHandler } from './error-handling.ts';

export async function handleSaveCredentialsWithVehicleImport({ 
  username, 
  password, 
  apiUrl,
  testOnly,
  userId 
}: { 
  username: string; 
  password: string; 
  apiUrl?: string;
  testOnly: boolean;
  userId: string;
}) {
  console.log('🚀 Enhanced GP51 credential save handler');
  console.log('📝 Parameters:', { username, testOnly, userId, hasApiUrl: !!apiUrl });
  
  try {
    // Test GP51 authentication with comprehensive error handling
    console.log('🔍 Testing GP51 authentication...');
    let authResult;
    
    try {
      authResult = await authenticateWithGP51({
        username,
        password,
        apiUrl
      });
    } catch (authError) {
      console.error('❌ GP51 authentication threw exception:', authError);
      GP51ErrorHandler.logError(authError, { username, apiUrl, operation: 'authenticate' });
      
      return createResponse({
        success: false,
        error: 'GP51 authentication failed',
        details: authError instanceof Error ? authError.message : 'Authentication service error',
        code: 'GP51_AUTH_EXCEPTION'
      }, 401);
    }

    if (!authResult || !authResult.success) {
      console.error('❌ GP51 authentication failed:', authResult?.error);
      GP51ErrorHandler.logError(authResult?.error || 'Unknown auth error', { username, apiUrl });
      
      return createResponse({
        success: false,
        error: 'GP51 authentication failed',
        details: authResult?.error || 'Invalid credentials or server error',
        code: 'GP51_AUTH_FAILED'
      }, 401);
    }

    console.log('✅ GP51 authentication successful');

    // If this is just a test, return success without saving
    if (testOnly) {
      console.log('🧪 Test-only mode, not saving credentials');
      return createResponse({
        success: true,
        message: 'GP51 connection test successful',
        username: authResult.username,
        apiUrl: authResult.apiUrl,
        testOnly: true
      });
    }

    // Save credentials to database with error handling
    console.log('💾 Saving GP51 credentials to database...');
    let supabase;
    
    try {
      supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
    } catch (clientError) {
      console.error('❌ Failed to create Supabase client:', clientError);
      GP51ErrorHandler.logError(clientError, { operation: 'create_supabase_client' });
      
      return createResponse({
        success: false,
        error: 'Database connection failed',
        details: 'Unable to connect to database service',
        code: 'DB_CONNECTION_FAILED'
      }, 500);
    }

    try {
      // Check if session already exists for this user
      const { data: existingSessions, error: queryError } = await supabase
        .from('gp51_sessions')
        .select('id')
        .eq('envio_user_id', userId)
        .limit(1);

      if (queryError) {
        console.error('❌ Failed to query existing sessions:', queryError);
        return createResponse({
          success: false,
          error: 'Database query failed',
          details: queryError.message,
          code: 'DB_QUERY_FAILED'
        }, 500);
      }

      // Use correct column names that match the database schema
      const sessionData = {
        gp51_token: authResult.token,
        username: authResult.username, // Fixed: was gp51_username
        api_url: authResult.apiUrl,
        token_expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // Fixed: was expires_at
        updated_at: new Date().toISOString()
      };

      console.log('💾 Saving session with data:', { 
        ...sessionData, 
        gp51_token: '[REDACTED]' 
      });

      if (existingSessions && existingSessions.length > 0) {
        // Update existing session
        console.log('🔄 Updating existing GP51 session');
        const { error: updateError } = await supabase
          .from('gp51_sessions')
          .update(sessionData)
          .eq('envio_user_id', userId);

        if (updateError) {
          console.error('❌ Failed to update GP51 session:', updateError);
          return createResponse({
            success: false,
            error: 'Failed to update GP51 session',
            details: updateError.message,
            code: 'DB_UPDATE_FAILED'
          }, 500);
        }
      } else {
        // Create new session
        console.log('➕ Creating new GP51 session');
        const { error: insertError } = await supabase
          .from('gp51_sessions')
          .insert({
            envio_user_id: userId,
            ...sessionData
          });

        if (insertError) {
          console.error('❌ Failed to create GP51 session:', insertError);
          return createResponse({
            success: false,
            error: 'Failed to create GP51 session',
            details: insertError.message,
            code: 'DB_INSERT_FAILED'
          }, 500);
        }
      }

      // Verify the session was actually saved
      console.log('🔍 Verifying GP51 session was saved...');
      const { data: verificationSessions, error: verificationError } = await supabase
        .from('gp51_sessions')
        .select('id, username, token_expires_at')
        .eq('envio_user_id', userId)
        .limit(1);

      if (verificationError) {
        console.error('❌ Failed to verify session save:', verificationError);
        return createResponse({
          success: false,
          error: 'Failed to verify session creation',
          details: verificationError.message,
          code: 'DB_VERIFICATION_FAILED'
        }, 500);
      }

      if (!verificationSessions || verificationSessions.length === 0) {
        console.error('❌ GP51 session not found after save operation');
        return createResponse({
          success: false,
          error: 'GP51 session not created after saving credentials',
          details: 'Session verification failed - no session found in database',
          code: 'SESSION_CREATION_FAILED'
        }, 500);
      }

      console.log('✅ GP51 session verified successfully:', {
        sessionId: verificationSessions[0].id,
        username: verificationSessions[0].username,
        expiresAt: verificationSessions[0].token_expires_at
      });

      console.log('✅ GP51 credentials saved successfully');

      return createResponse({
        success: true,
        message: 'GP51 credentials saved and connection established',
        username: authResult.username,
        apiUrl: authResult.apiUrl,
        sessionVerified: true
      });

    } catch (dbError) {
      console.error('❌ Database operation failed:', dbError);
      GP51ErrorHandler.logError(dbError, { userId, operation: 'save_session' });
      
      return createResponse({
        success: false,
        error: 'Failed to save GP51 session',
        details: dbError instanceof Error ? dbError.message : 'Database operation failed',
        code: 'DB_SAVE_FAILED'
      }, 500);
    }

  } catch (error) {
    console.error('❌ Enhanced credential save failed with unexpected error:', error);
    GP51ErrorHandler.logError(error, { username, userId, operation: 'save_credentials' });
    
    return createResponse({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unexpected error occurred',
      code: 'INTERNAL_ERROR'
    }, 500);
  }
}

export async function handleHealthCheck() {
  console.log('🏥 Performing GP51 health check...');
  
  try {
    const timestamp = new Date().toISOString();
    
    return createResponse({
      success: true,
      timestamp,
      status: 'healthy',
      message: 'GP51 settings management service is operational'
    });
  } catch (error) {
    console.error('❌ Health check failed:', error);
    GP51ErrorHandler.logError(error, { operation: 'health_check' });
    
    return createResponse({
      success: false,
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      code: 'HEALTH_CHECK_FAILED'
    }, 500);
  }
}
