
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from './cors.ts';
import { authenticateRequest } from './auth.ts';
import { handleGP51Authentication, refreshGP51Credentials } from './gp51-operations.ts';
import { handleGetGP51Status, handleClearGP51Sessions, handleSessionHealthCheck } from './session-management.ts';
import { handleGP51UserMappingOperations } from './gp51-user-mapping.ts';
import { createErrorResponse, calculateLatency } from './response-utils.ts';
import { GP51TokenValidator } from './token-validation.ts';
import type { SettingsRequest } from './types.ts';

serve(async (req) => {
  const startTime = Date.now();
  console.log(`🔧 Settings Management API: ${req.method} ${req.url}`);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    let body: SettingsRequest;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return createErrorResponse(
        'Invalid JSON in request body', 
        parseError instanceof Error ? parseError.message : 'JSON parse error',
        400,
        calculateLatency(startTime)
      );
    }

    const { action, username, password, apiUrl } = body;
    console.log(`🔧 Settings Management API Action: ${action}`);

    // Authenticate request
    const authHeader = req.headers.get('Authorization');
    let authContext;
    try {
      authContext = await authenticateRequest(authHeader);
    } catch (authError) {
      console.error('❌ Authentication failed:', authError);
      return createErrorResponse(
        authError instanceof Error ? authError.message : 'Authentication failed',
        'Please check your authentication credentials',
        401,
        calculateLatency(startTime)
      );
    }

    const { adminSupabase, envioUser } = authContext;

    // Route to appropriate handler
    switch (action) {
      case 'save-gp51-credentials':
        if (!username || !password) {
          return createErrorResponse(
            'Missing required credentials',
            'Username and password are required',
            400,
            calculateLatency(startTime)
          );
        }
        return await handleGP51Authentication(
          adminSupabase, 
          envioUser.id, 
          username, 
          password, 
          apiUrl, 
          startTime
        );
      
      case 'get-gp51-status':
        return await handleGetGP51Status(adminSupabase, envioUser.id);
      
      case 'clear-gp51-sessions':
        return await handleClearGP51Sessions(adminSupabase, envioUser.id);
      
      case 'refresh-gp51-credentials':
        const refreshResult = await refreshGP51Credentials(adminSupabase, envioUser.id);
        return createResponse(refreshResult, calculateLatency(startTime));
      
      case 'session-health-check':
        return await handleSessionHealthCheck(adminSupabase, envioUser.id);
      
      case 'cleanup-invalid-sessions':
        await GP51TokenValidator.cleanupInvalidSessions(adminSupabase, envioUser.id);
        return createResponse({
          success: true,
          message: 'Invalid sessions cleaned up successfully'
        }, calculateLatency(startTime));
      
      // GP51 User Mapping operations
      case 'get-user-mappings':
      case 'create-mapping':
      case 'verify-mapping':
      case 'delete-mapping':
      case 'migrate-existing-users':
        return await handleGP51UserMappingOperations(adminSupabase, action, body, envioUser.id);
      
      default:
        console.warn(`❌ Unknown action: ${action}`);
        return createErrorResponse(
          `Unknown action: ${action}`,
          'Please check the action parameter and try again',
          400,
          calculateLatency(startTime)
        );
    }
  } catch (error) {
    const latency = calculateLatency(startTime);
    console.error('❌ Settings Management error:', error);
    return createErrorResponse(
      'Internal server error',
      error instanceof Error ? error.message : 'Unknown error occurred',
      500,
      latency
    );
  }
});
