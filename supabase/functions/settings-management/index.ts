
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { handleCorsPreflightRequest, createResponse } from './cors.ts';
import { handleSaveCredentials, handleGetStatus } from './handlers.ts';
import { handleSaveCredentialsWithVehicleImport, handleHealthCheck } from './enhanced-handlers.ts';
import { GP51ErrorHandler } from './error-handling.ts';
import type { SettingsRequest } from './types.ts';

// Add unhandled promise rejection logging at the very top
addEventListener("unhandledrejection", event => {
  console.error("🚨 Unhandled promise rejection in settings-management:", event.reason);
  console.error("📊 Stack trace:", event.reason?.stack);
});

// Function versioning and deployment tracking
const FUNCTION_VERSION = "1.3.0";
const FUNCTION_NAME = "settings-management";

serve(async (req) => {
  console.log(`🔧 ${FUNCTION_NAME} v${FUNCTION_VERSION} Request: ${req.method} ${req.url}`);
  console.log(`📅 Request timestamp: ${new Date().toISOString()}`);
  console.log(`🌐 Request headers:`, Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight request');
    return handleCorsPreflightRequest();
  }

  try {
    // Enhanced environment variable validation with detailed logging
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    console.log('🔍 Enhanced environment validation:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseAnonKey: !!supabaseAnonKey,
      supabaseUrlFormat: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'missing',
      envVarCount: Object.keys(Deno.env.toObject()).length
    });
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Critical: Missing Supabase environment variables');
      console.error('🔑 Available env vars:', Object.keys(Deno.env.toObject()).filter(key => !key.includes('SECRET')));
      return createResponse({
        success: false,
        error: 'Server configuration error',
        code: 'MISSING_ENV_VARS',
        details: 'SUPABASE_URL or SUPABASE_ANON_KEY not configured',
        functionVersion: FUNCTION_VERSION
      }, 500);
    }

    let supabase;
    try {
      supabase = createClient(supabaseUrl, supabaseAnonKey);
      console.log('✅ Supabase client created successfully');
    } catch (clientError) {
      console.error('❌ Failed to create Supabase client:', clientError);
      console.error('📊 Client creation error details:', {
        name: clientError?.name,
        message: clientError?.message
      });
      return createResponse({
        success: false,
        error: 'Database connection failed',
        code: 'DB_CLIENT_ERROR',
        details: clientError instanceof Error ? clientError.message : 'Client creation failed',
        functionVersion: FUNCTION_VERSION
      }, 500);
    }

    // Enhanced JWT token extraction and validation
    const authHeader = req.headers.get('Authorization');
    console.log('🔐 Enhanced auth header analysis:', {
      present: !!authHeader,
      format: authHeader ? authHeader.substring(0, 30) + '...' : 'missing',
      type: authHeader?.startsWith('Bearer ') ? 'Bearer' : 'invalid',
      length: authHeader?.length || 0
    });
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid Authorization header');
      console.error('📋 Request headers analysis:', {
        authHeaderPresent: !!authHeader,
        authHeaderType: authHeader?.split(' ')[0] || 'none',
        headerCount: req.headers.entries().length
      });
      return createResponse({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
        details: 'Missing or malformed Authorization header. Expected: Bearer <token>',
        functionVersion: FUNCTION_VERSION
      }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🔑 Enhanced token analysis:', {
      length: token.length,
      prefix: token.substring(0, 20) + '...',
      format: token.includes('.') ? 'JWT-like' : 'non-JWT',
      segments: token.split('.').length
    });
    
    // Enhanced JWT validation with detailed error handling
    let user;
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
      
      console.log('🔍 Enhanced JWT validation result:', {
        hasUser: !!authUser,
        hasError: !!authError,
        errorCode: authError?.message?.substring(0, 100),
        userEmail: authUser?.email || 'none',
        userId: authUser?.id || 'none'
      });
      
      if (authError || !authUser) {
        console.error('❌ JWT validation failed with enhanced context:', {
          error: authError?.message,
          status: authError?.status,
          user: !!authUser,
          tokenLength: token.length
        });
        return createResponse({
          success: false,
          error: 'Invalid authentication token',
          code: 'AUTH_INVALID',
          details: authError?.message || 'Token validation failed',
          functionVersion: FUNCTION_VERSION
        }, 401);
      }
      
      user = authUser;
      console.log('✅ User authenticated with enhanced confirmation:', {
        id: user.id,
        email: user.email,
        emailVerified: user.email_confirmed_at ? 'yes' : 'no',
        lastSignIn: user.last_sign_in_at || 'unknown'
      });
    } catch (authException) {
      console.error('❌ Auth validation threw exception with enhanced context:', {
        name: authException?.name,
        message: authException?.message,
        stack: authException?.stack?.substring(0, 300)
      });
      return createResponse({
        success: false,
        error: 'Authentication service error',
        code: 'AUTH_EXCEPTION',
        details: authException instanceof Error ? authException.message : 'Unknown auth error',
        functionVersion: FUNCTION_VERSION
      }, 500);
    }

    // Enhanced user profile validation
    let envioUser;
    try {
      console.log('🔍 Enhanced user profile lookup for:', user.email);
      const { data: userData, error: envioUserError } = await supabase
        .from('envio_users')
        .select('id, email')
        .eq('email', user.email)
        .single();

      console.log('📋 Enhanced user profile query result:', {
        hasData: !!userData,
        hasError: !!envioUserError,
        errorCode: envioUserError?.code,
        errorMessage: envioUserError?.message,
        userFound: !!userData?.id
      });

      if (envioUserError || !userData) {
        console.error('❌ Envio user profile not found with enhanced context:', {
          error: envioUserError?.message,
          code: envioUserError?.code,
          email: user.email,
          authUserId: user.id
        });
        return createResponse({
          success: false,
          error: 'User profile not found. Please contact support.',
          code: 'USER_PROFILE_NOT_FOUND',
          details: envioUserError?.message || 'No user profile in envio_users table',
          functionVersion: FUNCTION_VERSION
        }, 404);
      }
      
      envioUser = userData;
      console.log('✅ Envio user found with enhanced confirmation:', {
        id: envioUser.id,
        email: envioUser.email,
        profileComplete: true
      });
    } catch (userQueryException) {
      console.error('❌ User query threw exception with enhanced context:', {
        name: userQueryException?.name,
        message: userQueryException?.message,
        email: user.email
      });
      return createResponse({
        success: false,
        error: 'User profile service error',
        code: 'USER_QUERY_EXCEPTION',
        details: userQueryException instanceof Error ? userQueryException.message : 'User query failed',
        functionVersion: FUNCTION_VERSION
      }, 500);
    }

    // Enhanced request body parsing with detailed logging
    let requestData: SettingsRequest;
    try {
      const body = await req.text();
      console.log('📝 Enhanced request body analysis:', {
        length: body.length,
        isEmpty: body.length === 0,
        preview: body.length > 0 ? body.substring(0, 150) + '...' : 'empty',
        contentType: req.headers.get('Content-Type') || 'none'
      });
      
      if (body.length === 0) {
        throw new Error('Request body is empty');
      }
      
      requestData = JSON.parse(body);
      console.log('✅ Enhanced request data parsed:', {
        action: requestData.action,
        hasUsername: !!requestData.username,
        hasPassword: !!requestData.password,
        hasApiUrl: !!requestData.apiUrl,
        testOnly: requestData.testOnly,
        requestValid: !!requestData.action
      });
    } catch (parseError) {
      console.error('❌ Failed to parse request body with enhanced context:', {
        name: parseError?.name,
        message: parseError?.message,
        bodyLength: (await req.text()).length
      });
      return createResponse({
        success: false,
        error: 'Invalid request format',
        code: 'INVALID_JSON',
        details: parseError instanceof Error ? parseError.message : 'JSON parsing failed',
        functionVersion: FUNCTION_VERSION
      }, 400);
    }

    const { action, username, password, apiUrl, testOnly } = requestData;
    
    console.log(`🔧 Enhanced action processing: ${action}`, {
      username: username ? 'provided' : 'missing',
      password: password ? 'provided' : 'missing',
      apiUrl: apiUrl ? 'provided' : 'missing',
      testOnly: testOnly || false,
      authenticatedUser: envioUser.id,
      functionVersion: FUNCTION_VERSION
    });
    
    try {
      let result;
      
      if (action === 'save-gp51-credentials') {
        console.log('💾 Executing enhanced credentials save with vehicle import');
        result = await handleSaveCredentialsWithVehicleImport({ 
          username: username!, 
          password: password!,
          apiUrl: apiUrl,
          testOnly: testOnly || false,
          userId: envioUser.id
        });
      } else if (action === 'get-gp51-status') {
        console.log('📊 Executing status check');
        result = await handleGetStatus();
      } else if (action === 'health-check') {
        console.log('🏥 Executing enhanced health check');
        result = await handleHealthCheck();
      } else if (action === 'save-gp51-credentials-basic') {
        console.log('💾 Executing basic credentials save (fallback)');
        result = await handleSaveCredentials({ 
          username: username!, 
          password: password!,
          apiUrl: apiUrl 
        });
      } else {
        console.error('❌ Invalid action received with enhanced context:', {
          action,
          availableActions: ['save-gp51-credentials', 'get-gp51-status', 'health-check', 'save-gp51-credentials-basic']
        });
        return createResponse({
          success: false,
          error: 'Invalid action',
          code: 'INVALID_ACTION',
          availableActions: ['save-gp51-credentials', 'get-gp51-status', 'health-check', 'save-gp51-credentials-basic'],
          details: `Unknown action: ${action}`,
          functionVersion: FUNCTION_VERSION
        }, 400);
      }

      console.log('✅ Enhanced handler execution completed successfully');
      return result;

    } catch (handlerError) {
      console.error('❌ Handler execution failed with enhanced context:', {
        name: handlerError?.name,
        message: handlerError?.message,
        stack: handlerError?.stack?.substring(0, 400),
        action,
        userId: envioUser.id
      });
      
      GP51ErrorHandler.logError(handlerError, { 
        action, 
        userId: envioUser.id,
        functionVersion: FUNCTION_VERSION,
        timestamp: new Date().toISOString()
      });
      
      return createResponse({
        success: false,
        error: 'Request handler failed',
        code: 'HANDLER_ERROR',
        details: handlerError instanceof Error ? handlerError.message : 'Handler execution error',
        action: action,
        functionVersion: FUNCTION_VERSION
      }, 500);
    }

  } catch (error) {
    console.error('❌ Settings management function error with enhanced context:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack?.substring(0, 600),
      url: req.url,
      method: req.method
    });
    
    GP51ErrorHandler.logError(error, { 
      operation: 'main_handler',
      functionVersion: FUNCTION_VERSION,
      functionName: FUNCTION_NAME,
      timestamp: new Date().toISOString()
    });
    
    return createResponse({
      success: false,
      error: 'Internal server error',
      code: 'SYSTEM_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error occurred',
      functionVersion: FUNCTION_VERSION,
      timestamp: new Date().toISOString()
    }, 500);
  }
});
