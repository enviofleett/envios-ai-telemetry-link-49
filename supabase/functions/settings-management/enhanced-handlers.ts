
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createResponse } from './cors.ts';
import { authenticateWithGP51 } from './gp51-auth.ts';

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
    // Test GP51 authentication
    console.log('🔍 Testing GP51 authentication...');
    const authResult = await authenticateWithGP51({
      username,
      password,
      apiUrl
    });

    if (!authResult.success) {
      console.error('❌ GP51 authentication failed:', authResult.error);
      return createResponse({
        success: false,
        error: 'GP51 authentication failed',
        details: authResult.error || 'Invalid credentials',
        code: 'GP51_AUTH_FAILED'
      }, 400);
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

    // Save credentials to database
    console.log('💾 Saving GP51 credentials to database...');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check if session already exists for this user
    const { data: existingSessions } = await supabase
      .from('gp51_sessions')
      .select('id')
      .eq('envio_user_id', userId)
      .limit(1);

    if (existingSessions && existingSessions.length > 0) {
      // Update existing session
      console.log('🔄 Updating existing GP51 session');
      const { error: updateError } = await supabase
        .from('gp51_sessions')
        .update({
          gp51_token: authResult.token,
          gp51_username: authResult.username,
          api_url: authResult.apiUrl,
          expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours
          updated_at: new Date().toISOString()
        })
        .eq('envio_user_id', userId);

      if (updateError) {
        console.error('❌ Failed to update GP51 session:', updateError);
        throw new Error(`Database update failed: ${updateError.message}`);
      }
    } else {
      // Create new session
      console.log('➕ Creating new GP51 session');
      const { error: insertError } = await supabase
        .from('gp51_sessions')
        .insert({
          envio_user_id: userId,
          gp51_token: authResult.token,
          gp51_username: authResult.username,
          api_url: authResult.apiUrl,
          expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours
        });

      if (insertError) {
        console.error('❌ Failed to create GP51 session:', insertError);
        throw new Error(`Database insert failed: ${insertError.message}`);
      }
    }

    console.log('✅ GP51 credentials saved successfully');

    return createResponse({
      success: true,
      message: 'GP51 credentials saved and connection established',
      username: authResult.username,
      apiUrl: authResult.apiUrl
    });

  } catch (error) {
    console.error('❌ Enhanced credential save failed:', error);
    return createResponse({
      success: false,
      error: 'Failed to save GP51 credentials',
      details: error instanceof Error ? error.message : 'Unknown error',
      code: 'SAVE_FAILED'
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
    return createResponse({
      success: false,
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
}
