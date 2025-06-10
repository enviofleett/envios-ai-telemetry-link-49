
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { handleCorsPreflightRequest, createResponse } from './cors.ts';
import { handleSaveCredentials, handleGetStatus } from './handlers.ts';
import { handleSaveCredentialsWithVehicleImport, handleHealthCheck } from './enhanced-handlers.ts';
import { GP51ErrorHandler } from './error-handling.ts';
import type { SettingsRequest } from './types.ts';

serve(async (req) => {
  console.log(`🔧 Settings Management Request: ${req.method} ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight request');
    return handleCorsPreflightRequest();
  }

  try {
    // Initialize Supabase client for auth validation
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Missing Supabase environment variables');
      return createResponse({
        success: false,
        error: 'Server configuration error',
        code: 'MISSING_ENV_VARS'
      }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
    console.log('🔑 Validating JWT token...');
    
    // Validate the JWT token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('❌ JWT validation failed:', authError?.message || 'No user found');
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
      console.error('❌ Envio user profile not found:', envioUserError?.message || 'No user profile');
      return createResponse({
        success: false,
        error: 'User profile not found. Please contact support.',
        code: 'USER_PROFILE_NOT_FOUND'
      }, 404);
    }

    console.log('✅ Envio user found:', envioUser.id);

    // Parse request body
    let requestData: SettingsRequest;
    try {
      const body = await req.text();
      console.log('📝 Request body received, length:', body.length);
      requestData = JSON.parse(body);
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return createResponse({
        success: false,
        error: 'Invalid request format',
        code: 'INVALID_JSON'
      }, 400);
    }

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

    console.error('❌ Invalid action received:', action);
    
    return createResponse({
      success: false,
      error: 'Invalid action',
      code: 'INVALID_ACTION',
      availableActions: ['save-gp51-credentials', 'get-gp51-status', 'health-check', 'save-gp51-credentials-basic']
    }, 400);

  } catch (error) {
    console.error('❌ Settings management function error:', error);
    console.error('📊 Error details:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack?.substring(0, 500)
    });
    
    return createResponse({
      success: false,
      error: 'Internal server error',
      code: 'SYSTEM_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }, 500);
  }
});
