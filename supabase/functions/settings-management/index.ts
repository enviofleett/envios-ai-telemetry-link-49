
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { handleCorsPreflightRequest, createResponse } from './cors.ts';
import { handleSaveCredentials, handleGetStatus } from './handlers.ts';
import { handleSaveCredentialsWithVehicleImport, handleHealthCheck } from './enhanced-handlers.ts';
import { handleAdminAutoAuth, isAdminUser } from './admin-auth-handler.ts';
import { GP51ErrorHandler } from './error-handling.ts';
import type { SettingsRequest } from './types.ts';

const FUNCTION_VERSION = "1.4.0";
const FUNCTION_NAME = "settings-management";

serve(async (req) => {
  console.log(`🔧 ${FUNCTION_NAME} v${FUNCTION_VERSION} Request: ${req.method} ${req.url}`);
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return createResponse({
        success: false,
        error: 'Server configuration error',
        code: 'MISSING_ENV_VARS'
      }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // JWT validation
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createResponse({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return createResponse({
        success: false,
        error: 'Invalid authentication token',
        code: 'AUTH_INVALID'
      }, 401);
    }

    // Get envio user
    const { data: envioUser, error: envioUserError } = await supabase
      .from('envio_users')
      .select('id, email')
      .eq('email', user.email)
      .single();

    if (envioUserError || !envioUser) {
      return createResponse({
        success: false,
        error: 'User profile not found',
        code: 'USER_PROFILE_NOT_FOUND'
      }, 404);
    }

    // Parse request
    const body = await req.text();
    const requestData: SettingsRequest = JSON.parse(body);
    const { action } = requestData;
    
    console.log(`🔧 Processing action: ${action} for user: ${envioUser.email}`);
    
    // Handle admin auto-authentication
    if (action === 'admin-auto-auth' && isAdminUser(envioUser.email)) {
      return await handleAdminAutoAuth(envioUser.email, envioUser.id);
    }
    
    // Handle regular actions
    if (action === 'save-gp51-credentials') {
      // Check if this is an admin user - if so, suggest auto-auth instead
      if (isAdminUser(envioUser.email)) {
        return createResponse({
          success: false,
          error: 'Admin users should use auto-authentication',
          code: 'USE_ADMIN_AUTO_AUTH',
          suggestion: 'Use admin-auto-auth action instead'
        }, 400);
      }
      
      return await handleSaveCredentialsWithVehicleImport({ 
        username: requestData.username!, 
        password: requestData.password!,
        apiUrl: requestData.apiUrl,
        testOnly: requestData.testOnly || false,
        userId: envioUser.id
      });
    } else if (action === 'get-gp51-status') {
      return await handleGetStatus();
    } else if (action === 'health-check') {
      return await handleHealthCheck();
    } else {
      return createResponse({
        success: false,
        error: 'Invalid action',
        code: 'INVALID_ACTION'
      }, 400);
    }

  } catch (error) {
    console.error('❌ Settings management function error:', error);
    return createResponse({
      success: false,
      error: 'Internal server error',
      code: 'SYSTEM_ERROR'
    }, 500);
  }
});
