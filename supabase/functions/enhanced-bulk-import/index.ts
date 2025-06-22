
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GP51Session {
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

async function getValidGP51Session(supabase: any): Promise<{
  session: GP51Session | null;
  error: string | null;
  sessionCount: number;
}> {
  console.log('🔍 [enhanced-bulk-import] Checking for valid GP51 sessions...');
  
  try {
    // Get ALL sessions first to see what's available
    const { data: allSessions, error: allSessionsError } = await supabase
      .from('gp51_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (allSessionsError) {
      console.error('❌ [enhanced-bulk-import] Database error fetching all sessions:', allSessionsError);
      return { session: null, error: `Database error: ${allSessionsError.message}`, sessionCount: 0 };
    }

    console.log(`📊 [enhanced-bulk-import] Found ${allSessions?.length || 0} total GP51 sessions in database`);
    
    if (allSessions && allSessions.length > 0) {
      allSessions.forEach((session, index) => {
        console.log(`📋 [enhanced-bulk-import] Session ${index + 1}: ${session.username}, expires: ${session.token_expires_at}, created: ${session.created_at}`);
      });
    }

    // Now get the most recent session that hasn't expired
    const { data: sessions, error: sessionError } = await supabase
      .from('gp51_sessions')
      .select('*')
      .gt('token_expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (sessionError) {
      console.error('❌ [enhanced-bulk-import] Database error fetching valid sessions:', sessionError);
      return { session: null, error: `Database error: ${sessionError.message}`, sessionCount: allSessions?.length || 0 };
    }

    if (!sessions || sessions.length === 0) {
      console.log('⚠️ [enhanced-bulk-import] No valid (non-expired) GP51 sessions found');
      
      // Check if we have expired sessions
      const now = new Date();
      const expiredSessions = allSessions?.filter(session => new Date(session.token_expires_at) <= now) || [];
      
      if (expiredSessions.length > 0) {
        console.log(`⏰ [enhanced-bulk-import] Found ${expiredSessions.length} expired sessions`);
        expiredSessions.forEach((session, index) => {
          const expiresAt = new Date(session.token_expires_at);
          const minutesAgo = Math.round((now.getTime() - expiresAt.getTime()) / (1000 * 60));
          console.log(`⏰ [enhanced-bulk-import] Expired session ${index + 1}: ${session.username}, expired ${minutesAgo} minutes ago`);
        });
        
        return { 
          session: null, 
          error: `All ${expiredSessions.length} GP51 sessions have expired. Please re-authenticate.`, 
          sessionCount: allSessions?.length || 0 
        };
      }
      
      return { session: null, error: 'No GP51 sessions found', sessionCount: 0 };
    }

    const session = sessions[0] as GP51Session;
    const expiresAt = new Date(session.token_expires_at);
    const now = new Date();
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();
    const minutesUntilExpiry = Math.round(timeUntilExpiry / (1000 * 60));

    console.log('✅ [enhanced-bulk-import] Found valid session for', session.username);
    console.log(`📅 [enhanced-bulk-import] Session expires in ${minutesUntilExpiry} minutes`);
    console.log(`🔑 [enhanced-bulk-import] Token present: ${!!session.gp51_token}, length: ${session.gp51_token?.length || 0}`);

    return { session, error: null, sessionCount: allSessions?.length || 0 };

  } catch (error) {
    console.error('❌ [enhanced-bulk-import] Exception during session validation:', error);
    return { 
      session: null, 
      error: `Session validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 
      sessionCount: 0 
    };
  }
}

async function testGP51Connection(session: GP51Session): Promise<{
  success: boolean;
  responseTime: number;
  deviceCount?: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    console.log('🧪 [enhanced-bulk-import] Testing session validity for', session.username);
    
    // Use the simple getmonitorlist endpoint to test the session
    const apiUrl = session.api_url || 'https://www.gps51.com/webapi';
    const testUrl = new URL(apiUrl);
    testUrl.searchParams.set('action', 'getmonitorlist');
    testUrl.searchParams.set('token', session.gp51_token);

    console.log(`🔗 [enhanced-bulk-import] Testing with URL: ${testUrl.toString().replace(session.gp51_token, '[TOKEN]')}`);

    const response = await fetch(testUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'EnvioFleet/1.0'
      },
      signal: AbortSignal.timeout(15000)
    });

    const responseTime = Date.now() - startTime;
    console.log(`📊 [enhanced-bulk-import] Session test response: ${response.status}`);

    if (!response.ok) {
      return {
        success: false,
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }

    const responseText = await response.text();
    
    try {
      const data = JSON.parse(responseText);
      
      if (data.status === 0) {
        // Count devices from the response
        let deviceCount = 0;
        if (data.groups && Array.isArray(data.groups)) {
          deviceCount = data.groups.reduce((acc: number, group: any) => 
            acc + (group.devices ? group.devices.length : 0), 0
          );
        }
        
        console.log(`✅ [enhanced-bulk-import] Session test successful, found ${deviceCount} devices`);
        
        return {
          success: true,
          responseTime,
          deviceCount
        };
      } else {
        return {
          success: false,
          responseTime,
          error: data.cause || data.message || `GP51 API error: status ${data.status}`
        };
      }
    } catch (parseError) {
      // If it's not JSON, check if it's a plain text response
      if (responseText && !responseText.includes('<html') && !responseText.includes('error')) {
        console.log(`✅ [enhanced-bulk-import] Session test successful (plain text response)`);
        return {
          success: true,
          responseTime
        };
      }
      
      return {
        success: false,
        responseTime,
        error: `Invalid response format: ${responseText.substring(0, 100)}`
      };
    }

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('❌ [enhanced-bulk-import] Session test failed:', error);
    
    return {
      success: false,
      responseTime,
      error: error instanceof Error ? error.message : 'Connection test failed'
    };
  }
}

async function handleConnectionTest(supabase: any): Promise<Response> {
  console.log('🧪 [enhanced-bulk-import] Testing GP51 connection');
  
  const { session, error: sessionError, sessionCount } = await getValidGP51Session(supabase);
  
  if (sessionError || !session) {
    console.log('❌ [enhanced-bulk-import] No valid session available:', sessionError);
    
    return new Response(JSON.stringify({
      success: false,
      status: 'not_configured',
      message: sessionError || 'No valid GP51 session found',
      sessionCount,
      details: {
        hasActiveSessions: sessionCount > 0,
        requiresReAuthentication: sessionCount > 0,
        timestamp: new Date().toISOString()
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  console.log('✅ [enhanced-bulk-import] Using existing valid session for', session.username);
  
  // Test the session by making an API call
  const connectionTest = await testGP51Connection(session);
  
  const expiresAt = new Date(session.token_expires_at);
  const now = new Date();
  const timeUntilExpiry = expiresAt.getTime() - now.getTime();
  const minutesUntilExpiry = Math.round(timeUntilExpiry / (1000 * 60));
  
  return new Response(JSON.stringify({
    success: connectionTest.success,
    status: connectionTest.success ? 'healthy' : 'failed',
    message: connectionTest.success 
      ? `GP51 connection successful for ${session.username}`
      : `GP51 connection failed: ${connectionTest.error}`,
    sessionCount,
    details: {
      username: session.username,
      expiresAt: session.token_expires_at,
      minutesUntilExpiry,
      tokenPresent: !!session.gp51_token,
      tokenLength: session.gp51_token?.length || 0,
      apiUrl: session.api_url,
      authMethod: session.auth_method,
      lastValidated: session.last_validated_at,
      responseTime: connectionTest.responseTime,
      deviceCount: connectionTest.deviceCount,
      sessionId: session.id,
      timestamp: new Date().toISOString(),
      connectionError: connectionTest.error
    }
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

serve(async (req) => {
  console.log(`🚀 [enhanced-bulk-import] ${req.method} ${req.url}`);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action } = await req.json();
    console.log(`🔧 [enhanced-bulk-import] Action: ${action}`);

    switch (action) {
      case 'test_connection':
        return await handleConnectionTest(supabase);
      
      default:
        return new Response(JSON.stringify({
          success: false,
          error: `Unknown action: ${action}`
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    console.error('❌ [enhanced-bulk-import] Function error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
