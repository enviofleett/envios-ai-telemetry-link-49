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
    return createResponse({
      success: true,
      message: 'GP51 authentication successful',
      session: {
        username: authResult.username,
        expiresAt: expiresAt.toISOString(),
        method: authResult.method
      },
      latency
    });

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
