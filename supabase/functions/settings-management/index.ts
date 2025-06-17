import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders, createResponse } from './cors.ts';
import { authenticateWithGP51 } from './gp51-auth.ts';

serve(async (req) => {
  const startTime = Date.now();
  console.log(`🔧 Settings Management API: ${req.method} ${req.url}`);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create dual Supabase clients for proper authentication handling
    const userSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const adminSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return createResponse({
        success: false,
        error: 'Invalid JSON in request body'
      }, 400);
    }

    const { action, username, password, apiUrl } = body;
    console.log(`🔧 Settings Management API: ${action}`);

    // Extract and validate the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ No authorization header or malformed header');
      return createResponse({
        success: false,
        error: 'Authorization header missing or malformed'
      }, 401);
    }

    // Validate user authentication using the user client with ANON_KEY
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await userSupabase.auth.getUser(token);

    if (userError || !user) {
      console.error('❌ Invalid authentication token:', userError?.message || 'No user found');
      return createResponse({
        success: false,
        error: 'Invalid or expired user session'
      }, 401);
    }

    console.log(`✅ User ${user.email || user.id} authenticated successfully`);

    // Get user from envio_users table using admin client for database operations
    const { data: envioUser, error: envioUserError } = await adminSupabase
      .from('envio_users')
      .select('id')
      .eq('email', user.email)
      .single();

    if (envioUserError || !envioUser) {
      console.error('❌ User profile not found:', envioUserError);
      return createResponse({
        success: false,
        error: 'User profile not found'
      }, 404);
    }

    switch (action) {
      case 'save-gp51-credentials':
        return await handleGP51Authentication(adminSupabase, envioUser.id, username, password, apiUrl, startTime);
      
      case 'get-gp51-status':
        return await handleGetGP51Status(adminSupabase, envioUser.id);
      
      case 'clear-gp51-sessions':
        return await handleClearGP51Sessions(adminSupabase, envioUser.id);
      
      default:
        console.warn(`❌ Unknown action: ${action}`);
        return createResponse({
          success: false,
          error: `Unknown action: ${action}`
        }, 400);
    }
  } catch (error) {
    const latency = Date.now() - startTime;
    console.error('❌ Settings Management error:', error);
    return createResponse({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      latency
    }, 500);
  }
});

async function handleGP51Authentication(
  supabase: any,
  userId: string,
  username: string,
  password: string,
  apiUrl?: string,
  startTime?: number
) {
  console.log('🔐 GP51 Authentication for user:', userId);
  const latency = startTime ? Date.now() - startTime : 0;
  
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
      return createResponse({
        success: false,
        error: authResult.error || 'GP51 authentication failed',
        latency
      }, 401);
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
      return createResponse({
        success: false,
        error: 'Failed to store session',
        latency
      }, 500);
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
    return createResponse({
      success: false,
      error: 'Authentication process failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      latency
    }, 500);
  }
}

async function triggerGP51Import(supabase: any, userId: string, authResult: any) {
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

async function handleGetGP51Status(supabase: any, userId: string) {
  try {
    const { data: sessions, error } = await supabase
      .from('gp51_sessions')
      .select('*')
      .eq('envio_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ Error fetching GP51 status:', error);
      return createResponse({
        connected: false,
        error: 'Database error'
      }, 500);
    }

    if (!sessions || sessions.length === 0) {
      return createResponse({
        connected: false,
        message: 'No GP51 sessions found'
      });
    }

    const session = sessions[0];
    const expiresAt = new Date(session.token_expires_at);
    const now = new Date();
    const isExpired = expiresAt <= now;

    return createResponse({
      connected: !isExpired,
      username: session.username,
      expiresAt: session.token_expires_at,
      apiUrl: session.api_url,
      lastValidated: session.last_validated_at,
      isExpired
    });

  } catch (error) {
    console.error('❌ GP51 status check failed:', error);
    return createResponse({
      connected: false,
      error: 'Status check failed'
    }, 500);
  }
}

async function handleClearGP51Sessions(supabase: any, userId: string) {
  try {
    const { error } = await supabase
      .from('gp51_sessions')
      .delete()
      .eq('envio_user_id', userId);

    if (error) {
      console.error('❌ Failed to clear GP51 sessions:', error);
      return createResponse({
        success: false,
        error: 'Failed to clear sessions'
      }, 500);
    }

    console.log('✅ GP51 sessions cleared for user:', userId);
    return createResponse({
      success: true,
      message: 'GP51 sessions cleared successfully'
    });

  } catch (error) {
    console.error('❌ Session clearing failed:', error);
    return createResponse({
      success: false,
      error: 'Session clearing failed'
    }, 500);
  }
}
