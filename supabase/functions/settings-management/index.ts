
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCorsPreflightRequest, createResponse } from './cors.ts';
import { handleSaveCredentials, handleGetStatus } from './handlers.ts';
import type { SettingsRequest } from './types.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  try {
    const requestData: SettingsRequest = await req.json();
    const { action, username, password } = requestData;
    
    if (action === 'save-gp51-credentials') {
      return await handleSaveCredentials({ username: username!, password: password! });
    } else if (action === 'get-gp51-status') {
      return await handleGetStatus();
    }

    console.error('Invalid action received:', action);
    return createResponse(
      { error: 'Invalid action. Expected: save-gp51-credentials or get-gp51-status' },
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
