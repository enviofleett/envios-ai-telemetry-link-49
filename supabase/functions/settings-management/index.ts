
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCorsPreflightRequest, createResponse } from './cors.ts';
import { handleSaveCredentials, handleGetStatus } from './handlers.ts';
import { handleSaveCredentialsWithVehicleImport, handleHealthCheck } from './enhanced-handlers.ts';
import type { SettingsRequest } from './types.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  try {
    const requestData: SettingsRequest = await req.json();
    const { action, username, password, apiUrl } = requestData;
    
    console.log(`Settings management request: action=${action}, username=${username ? 'provided' : 'missing'}`);
    
    if (action === 'save-gp51-credentials') {
      // Use enhanced handler with vehicle import by default
      return await handleSaveCredentialsWithVehicleImport({ 
        username: username!, 
        password: password!,
        apiUrl: apiUrl 
      });
    } else if (action === 'get-gp51-status') {
      return await handleGetStatus();
    } else if (action === 'health-check') {
      return await handleHealthCheck();
    } else if (action === 'save-gp51-credentials-basic') {
      // Fallback to basic save without enhanced vehicle import
      return await handleSaveCredentials({ 
        username: username!, 
        password: password!,
        apiUrl: apiUrl 
      });
    }

    console.error('Invalid action received:', action);
    return createResponse(
      { error: 'Invalid action. Expected: save-gp51-credentials, get-gp51-status, or health-check' },
      400
    );

  } catch (error) {
    console.error('Settings management function error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return createResponse({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }, 500);
  }
});
