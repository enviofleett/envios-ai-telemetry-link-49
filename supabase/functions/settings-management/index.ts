
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const requestData: SettingsRequest = await req.json();
    const { action, username, password, apiUrl, testOnly } = requestData;
    
    console.log(`🔧 Enhanced settings management request: action=${action}, username=${username ? 'provided' : 'missing'}, testOnly=${testOnly || false}`);
    
    if (action === 'save-gp51-credentials') {
      // Use enhanced handler with comprehensive error handling and optional test mode
      return await handleSaveCredentialsWithVehicleImport({ 
        username: username!, 
        password: password!,
        apiUrl: apiUrl,
        testOnly: testOnly || false
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
