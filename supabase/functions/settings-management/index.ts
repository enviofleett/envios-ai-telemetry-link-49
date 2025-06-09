
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { handleCorsPreflightRequest, createResponse } from './cors.ts';
import { handleSaveCredentials, handleGetStatus } from './handlers.ts';
import { handleSaveCredentialsWithVehicleImport, handleHealthCheck } from './enhanced-handlers.ts';
import { GP51ErrorHandler } from './error-handling.ts';
import type { SettingsRequest } from './types.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  try {
    // Initialize Supabase client for auth validation
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Extract and validate JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid Authorization header');
      return createResponse({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Validate the JWT token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('❌ JWT validation failed:', authError);
      return createResponse({
        success: false,
        error: 'Invalid authentication token',
        code: 'AUTH_INVALID'
      }, 401);
    }

    console.log('✅ User authenticated:', user.id);

    // Get user from envio_users table
    const { data: envioUser, error: envioUserError } = await supabase
      .from('envio_users')
      .select('id, email')
      .eq('email', user.email)
      .single();

    if (envioUserError || !envioUser) {
      console.error('❌ Envio user profile not found:', envioUserError);
      return createResponse({
        success: false,
        error: 'User profile not found. Please contact support.',
        code: 'USER_PROFILE_NOT_FOUND'
      }, 404);
    }

    console.log('✅ Envio user found:', envioUser.id);

    const requestData: SettingsRequest = await req.json();
    const { action, username, password, apiUrl, testOnly } = requestData;
    
    console.log(`🔧 Enhanced settings management request: action=${action}, username=${username ? 'provided' : 'missing'}, testOnly=${testOnly || false}, authenticatedUser=${envioUser.id}`);
    
    if (action === 'save-gp51-credentials') {
      // Use enhanced handler with authenticated user ID
      return await handleSaveCredentialsWithVehicleImport({ 
        username: username!, 
        password: password!,
        apiUrl: apiUrl,
        testOnly: testOnly || false,
        userId: envioUser.id // Pass the authenticated user ID
      });
    } else if (action === 'get-gp51-status') {
      return await handleGetStatus();
    } else if (action === 'health-check') {
      return await handleHealthCheck();
    } else if (action === 'save-gp51-credentials-basic') {
      // Fallback to basic save without enhanced features
      return await handleSaveCredentials({ 
        username: username!, 
        password: password!,
        apiUrl: apiUrl 
      });
    }

    const validationError = GP51ErrorHandler.createDetailedError(
      new Error('Invalid action received'),
      { receivedAction: action, availableActions: ['save-gp51-credentials', 'get-gp51-status', 'health-check', 'save-gp51-credentials-basic'] }
    );
    validationError.code = 'INVALID_ACTION';
    validationError.category = 'validation';
    validationError.details = 'The requested action is not supported by this endpoint.';
    validationError.suggestions = [
      'Use "save-gp51-credentials" to save and test credentials',
      'Use "get-gp51-status" to check current status',
      'Use "health-check" for comprehensive health monitoring',
      'Use "save-gp51-credentials-basic" for basic credential saving'
    ];

    console.error('❌ Invalid action received:', action);
    GP51ErrorHandler.logError(validationError, { endpoint: 'settings-management' });
    
    return createResponse(GP51ErrorHandler.formatErrorForClient(validationError), 400);

  } catch (error) {
    console.error('❌ Settings management function error:', error);
    console.error('📊 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    const systemError = GP51ErrorHandler.createDetailedError(error, {
      endpoint: 'settings-management',
      timestamp: new Date().toISOString()
    });
    systemError.code = 'SYSTEM_ERROR';
    systemError.category = 'api';
    systemError.severity = 'critical';

    GP51ErrorHandler.logError(systemError, { operation: 'request_processing' });
    
    return createResponse(GP51ErrorHandler.formatErrorForClient(systemError), 500);
  }
});
