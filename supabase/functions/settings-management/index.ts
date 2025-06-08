
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCorsPreflightRequest, createResponse } from './cors.ts';
import { handleSaveCredentials, handleGetStatus } from './handlers.ts';
import { handleSaveCredentialsWithVehicleImport, handleHealthCheck } from './enhanced-handlers.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import type { SettingsRequest } from './types.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return createResponse(
        { error: 'Authentication required. Please sign in to configure GP51 settings.' },
        401
      );
    }

    // Create Supabase client and get user
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return createResponse(
        { error: 'Invalid authentication token. Please sign in again.' },
        401
      );
    }

    console.log('Authenticated user:', user.id);

    const requestData: SettingsRequest = await req.json();
    const { action, username, password, apiUrl } = requestData;
    
    console.log(`Settings management request: action=${action}, username=${username ? 'provided' : 'missing'}, userId=${user.id}`);
    
    if (action === 'save-gp51-credentials') {
      // Use enhanced handler with vehicle import by default
      return await handleSaveCredentialsWithVehicleImport({ 
        username: username!, 
        password: password!,
        apiUrl: apiUrl,
        userId: user.id
      });
    } else if (action === 'get-gp51-status') {
      return await handleGetStatus(user.id);
    } else if (action === 'health-check') {
      return await handleHealthCheck();
    } else if (action === 'save-gp51-credentials-basic') {
      // Fallback to basic save without enhanced vehicle import
      return await handleSaveCredentials({ 
        username: username!, 
        password: password!,
        apiUrl: apiUrl,
        userId: user.id
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
