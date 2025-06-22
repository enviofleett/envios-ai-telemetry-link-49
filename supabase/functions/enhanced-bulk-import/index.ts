
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  console.log(`🚀 [enhanced-bulk-import] ${req.method} ${req.url}`);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createSuccessResponse({
        success: false,
        error: 'No authorization header',
        errorType: 'authentication_error'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return createSuccessResponse({
        success: false,
        error: 'Invalid authentication',
        errorType: 'authentication_error'
      });
    }

    const { action, username, password } = await req.json();
    console.log(`🔧 [enhanced-bulk-import] Action: ${action}`);

    switch (action) {
      case 'test_connection':
        return await handleConnectionTest(supabase, username, password);
      
      case 'start_import':
        return await handleStartImport(supabase);
      
      default:
        return createSuccessResponse({
          success: false,
          error: `Unknown action: ${action}`,
          errorType: 'validation_error'
        });
    }
  } catch (error) {
    console.error('❌ [enhanced-bulk-import] Error:', error);
    
    return createSuccessResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: 'internal_error',
      timestamp: new Date().toISOString()
    });
  }
});

function createSuccessResponse(data: any) {
  return new Response(
    JSON.stringify(data),
    { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

async function handleConnectionTest(supabase: any, username?: string, password?: string) {
  console.log(`🧪 [enhanced-bulk-import] Testing GP51 connection`);
  
  try {
    // First, try to use existing session
    const sessionResult = await getValidGP51Session(supabase);
    
    if (sessionResult.success && sessionResult.session) {
      console.log(`✅ [enhanced-bulk-import] Using existing valid session for ${sessionResult.session.username}`);
      
      // Test the session with a simple GP51 API call
      const testResult = await testGP51SessionValidity(sessionResult.session);
      
      if (testResult.success) {
        return createSuccessResponse({
          success: true,
          authMethod: 'existing_session',
          tokenValid: true,
          message: `Successfully using existing GP51 session for ${sessionResult.session.username}`,
          diagnostics: {
            strategy: 'existing_session',
            username: sessionResult.session.username,
            sessionId: sessionResult.session.id,
            expiresAt: sessionResult.session.token_expires_at,
            details: testResult.details,
            timestamp: new Date().toISOString()
          }
        });
      }
    }

    // If no valid session exists and credentials provided, try authentication
    if (username && password) {
      console.log(`🔐 [enhanced-bulk-import] No valid session found, attempting authentication for: ${username}`);
      
      const authResult = await authenticateWithGP51(supabase, username, password);
      
      if (authResult.success) {
        return createSuccessResponse({
          success: true,
          authMethod: 'new_authentication',
          tokenValid: true,
          message: `Successfully authenticated with GP51 for ${username}`,
          diagnostics: {
            strategy: 'form_data_post',
            username: authResult.username,
            details: authResult.details,
            timestamp: new Date().toISOString()
          }
        });
      } else {
        return createSuccessResponse({
          success: false,
          error: authResult.error,
          errorType: 'authentication_failed',
          diagnostics: authResult.details
        });
      }
    }

    // No session and no credentials
    return createSuccessResponse({
      success: false,
      error: 'No valid GP51 session found and no credentials provided',
      errorType: 'session_required',
      message: 'Please authenticate with GP51 first or provide credentials',
      diagnostics: {
        hasValidSession: false,
        credentialsProvided: false,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error(`❌ [enhanced-bulk-import] Connection test failed:`, error);
    return createSuccessResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Connection test failed',
      errorType: 'system_error',
      timestamp: new Date().toISOString()
    });
  }
}

async function getValidGP51Session(supabase: any) {
  try {
    console.log('🔍 [enhanced-bulk-import] Checking for valid GP51 sessions...');
    
    const { data: sessions, error } = await supabase
      .from('gp51_sessions')
      .select('*')
      .gt('token_expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ [enhanced-bulk-import] Database error:', error);
      return { success: false, error: error.message };
    }

    if (!sessions || sessions.length === 0) {
      console.log('📝 [enhanced-bulk-import] No valid GP51 sessions found');
      return { success: false, error: 'No valid sessions found' };
    }

    const session = sessions[0];
    console.log(`✅ [enhanced-bulk-import] Found valid session for ${session.username}`);
    
    return { success: true, session };
  } catch (error) {
    console.error('❌ [enhanced-bulk-import] Session check failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function testGP51SessionValidity(session: any) {
  try {
    console.log(`🧪 [enhanced-bulk-import] Testing session validity for ${session.username}`);
    
    const baseUrl = session.api_url || 'https://www.gps51.com/webapi';
    const formData = new URLSearchParams();
    formData.append('token', session.gp51_token);
    formData.append('action', 'querymonitorlist');

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'FleetIQ/1.0'
      },
      body: formData.toString(),
      signal: AbortSignal.timeout(15000)
    });

    const responseText = await response.text();
    console.log(`📊 [enhanced-bulk-import] Session test response: ${response.status}`);

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        details: { statusCode: response.status, responseText: responseText.substring(0, 200) }
      };
    }

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { rawResponse: responseText };
    }

    if (responseData.status === 0 || (responseData.groups && Array.isArray(responseData.groups))) {
      console.log(`✅ [enhanced-bulk-import] Session is valid`);
      return {
        success: true,
        details: {
          responseStatus: responseData.status,
          hasData: !!responseData.groups,
          dataCount: responseData.groups?.length || 0
        }
      };
    } else {
      return {
        success: false,
        error: responseData.cause || 'Session validation failed',
        details: responseData
      };
    }
  } catch (error) {
    console.error(`❌ [enhanced-bulk-import] Session test failed:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Session test failed',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}

async function authenticateWithGP51(supabase: any, username: string, password: string) {
  try {
    console.log(`🔐 [enhanced-bulk-import] Authenticating with GP51 for: ${username}`);
    
    // Use the proven working pattern from other Edge Functions
    const baseUrl = 'https://www.gps51.com/webapi';
    
    // Import the MD5 function
    const { md5_for_gp51_only } = await import('../_shared/crypto_utils.ts');
    const hashedPassword = await md5_for_gp51_only(password);
    
    console.log(`🔐 [enhanced-bulk-import] Password hashed successfully`);
    
    // Use form-data POST without action=login (proven working pattern)
    const formData = new URLSearchParams();
    formData.append('username', username.trim());
    formData.append('password', hashedPassword);
    formData.append('from', 'WEB');
    formData.append('type', 'USER');
    
    // Add global token if available
    const globalToken = Deno.env.get('GP51_GLOBAL_API_TOKEN');
    if (globalToken) {
      formData.append('token', globalToken);
      console.log(`🔑 [enhanced-bulk-import] Using global API token`);
    }

    console.log(`📡 [enhanced-bulk-import] Making authentication request to GP51`);

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'FleetIQ/1.0'
      },
      body: formData.toString(),
      signal: AbortSignal.timeout(15000)
    });

    const responseText = await response.text();
    console.log(`📊 [enhanced-bulk-import] Auth response: ${response.status} - ${responseText.substring(0, 100)}`);

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        details: { statusCode: response.status, responseText: responseText.substring(0, 200) }
      };
    }

    // Parse response
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      // Treat as plain text token
      const token = responseText.trim();
      if (token && token.length > 0 && !token.includes('error') && !token.includes('<html')) {
        responseData = { token, status: 0 };
      } else {
        return {
          success: false,
          error: `Invalid response format: ${responseText.substring(0, 100)}`,
          details: { responseText }
        };
      }
    }

    if (responseData.status === 0 && responseData.token) {
      console.log(`✅ [enhanced-bulk-import] Authentication successful`);
      
      // Store the session in the database
      await storeGP51Session(supabase, username, responseData.token, baseUrl);
      
      return {
        success: true,
        username,
        token: responseData.token,
        details: {
          method: 'form_data_post',
          hasGlobalToken: !!globalToken,
          responseStatus: responseData.status
        }
      };
    } else {
      const errorMsg = responseData.cause || responseData.message || 'Authentication failed';
      return {
        success: false,
        error: errorMsg,
        details: responseData
      };
    }
  } catch (error) {
    console.error(`❌ [enhanced-bulk-import] Authentication failed:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}

async function storeGP51Session(supabase: any, username: string, token: string, apiUrl: string) {
  try {
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours from now
    
    const { error } = await supabase
      .from('gp51_sessions')
      .upsert({
        username,
        gp51_token: token,
        token_expires_at: expiresAt.toISOString(),
        api_url: apiUrl,
        auth_method: 'form_data_post',
        created_at: new Date().toISOString(),
        last_validated_at: new Date().toISOString()
      }, {
        onConflict: 'username'
      });

    if (error) {
      console.error('❌ [enhanced-bulk-import] Failed to store session:', error);
    } else {
      console.log(`✅ [enhanced-bulk-import] Session stored for ${username}`);
    }
  } catch (error) {
    console.error('❌ [enhanced-bulk-import] Error storing session:', error);
  }
}

async function handleStartImport(supabase: any) {
  console.log(`🚀 [enhanced-bulk-import] Starting bulk import`);
  
  try {
    // Check for valid session first
    const sessionResult = await getValidGP51Session(supabase);
    
    if (!sessionResult.success || !sessionResult.session) {
      return createSuccessResponse({
        success: false,
        error: 'No valid GP51 session found for import',
        errorType: 'session_required',
        message: 'Please authenticate with GP51 first before starting import'
      });
    }

    // Placeholder for actual import logic
    return createSuccessResponse({
      success: true,
      message: 'Import functionality will be implemented in Phase 2',
      phase: 'Phase 1 Complete - Authentication Fixed',
      sessionInfo: {
        username: sessionResult.session.username,
        sessionId: sessionResult.session.id,
        expiresAt: sessionResult.session.token_expires_at
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`❌ [enhanced-bulk-import] Import start failed:`, error);
    return createSuccessResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Import start failed',
      errorType: 'system_error',
      timestamp: new Date().toISOString()
    });
  }
}
