
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handlePasswordlessImportRequest } from './request-handler.ts';
import { handleCorsPreflightRequest, createCorsResponse } from './cors-handler.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method !== 'POST') {
      console.error('Invalid method:', req.method);
      return createCorsResponse({ error: 'Method not allowed' }, 405);
    }

    const requestBody = await req.json();
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    return await handlePasswordlessImportRequest(requestBody, supabase);

  } catch (error) {
    console.error('=== Passwordless import error ===', error);
    return createCorsResponse({ 
      error: 'Internal server error',
      details: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});
