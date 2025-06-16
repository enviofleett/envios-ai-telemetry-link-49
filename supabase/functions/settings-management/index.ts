
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders, createResponse } from './cors.ts';
import { handleSaveCredentials, handleGetStatus } from './handlers.ts';
import { authenticateWithGP51 } from './gp51-auth.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const { action, username, password, apiUrl } = body;

    console.log(`🔧 Settings Management API: ${action}`);

    // Get current user for database operations
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createResponse({
        success: false,
        error: 'Authentication required'
      }, 401);
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return createResponse({
        success: false,
        error: 'Invalid authentication token'
      }, 401);
    }

    // Get user from envio_users table
    const { data: envioUser, error: envioUserError } = await supabase
      .from('envio_users')
      .select('id')
      .eq('email', user.email)
      .single();

    if (envioUserError || !envioUser) {
      return createResponse({
        success: false,
        error: 'User profile not found'
      }, 404);
    }

    switch (action) {
      case 'save-gp51-credentials':
        return await handleGP51Authentication(supabase, envioUser.id, username, password, apiUrl);
      
      case 'get-gp51-status':
        return await handleGetGP51Status(supabase, envioUser.id);
      
      case 'clear-gp51-sessions':
        return await handleClearGP51Sessions(supabase, envioUser.id);
      
      default:
        // Legacy support for old actions
        if (action === 'save-credentials') {
          return await handleSaveCredentials({ username, password, apiUrl });
        } else if (action === 'get-status') {
          return await handleGetStatus();
        }
        
        return createResponse({
          success: false,
          error: `Unknown action: ${action}`
        }, 400);
    }
  } catch (error) {
    console.error('❌ Settings Management error:', error);
    return createResponse({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

async function handleGP51Authentication(
  supabase: any,
  userId: string,
  username: string,
  password: string,
  apiUrl?: string
) {
  console.log('🔐 GP51 Authentication for user:', userId);
  
  try {
    // Clear any existing sessions for this user
    await supabase
      .from('gp51_sessions')
      .delete()
      .eq('envio_user_id', userId);

    // Authenticate with GP51
    const authResult = await authenticateWithGP51({
      username: username.trim(),
      password,
      apiUrl
    });

    if (!authResult.success) {
      return createResponse({
        success: false,
        error: authResult.error || 'GP51 authentication failed'
      }, 401);
    }

    // Store the session in database
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours
    const { data: sessionData, error: sessionError } = await supabase
      .from('gp51_sessions')
      .insert({
        envio_user_id: userId,
        username: authResult.username,
        gp51_token: authResult.token,
        token_expires_at: expiresAt.toISOString(),
        api_url: authResult.apiUrl,
        auth_method: authResult.method || 'POST',
        created_at: new Date().toISOString(),
        last_validated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (sessionError) {
      console.error('❌ Failed to store GP51 session:', sessionError);
      return createResponse({
        success: false,
        error: 'Failed to store session'
      }, 500);
    }

    console.log('✅ GP51 authentication successful, session stored');
    return createResponse({
      success: true,
      message: 'GP51 authentication successful',
      session: {
        username: authResult.username,
        expiresAt: expiresAt.toISOString(),
        method: authResult.method
      }
    });

  } catch (error) {
    console.error('❌ GP51 authentication failed:', error);
    return createResponse({
      success: false,
      error: 'Authentication process failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
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
