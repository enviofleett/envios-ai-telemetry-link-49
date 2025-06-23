
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders, createResponse } from './cors.ts';
import { errorResponse } from './response-helpers.ts';
import { handleTestConnection } from './handlers/test-connection.ts';
import { handleAuthenticate } from './handlers/authenticate.ts';

serve(async (req) => {
  const startTime = Date.now();

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, username, password, apiUrl } = await req.json();
    console.log(`🔧 GP51 Service Management: ${action}`);

    switch (action) {
      case 'test_connection':
        return await handleTestConnection(supabase, startTime);
        
      case 'authenticate':
        if (!username || !password) {
          return errorResponse('Username and password are required', 400);
        }
        return await handleAuthenticate(supabase, username, password, apiUrl);
        
      default:
        return errorResponse(`Unknown action: ${action}`, 400);
    }

  } catch (error) {
    console.error('❌ GP51 Service Management error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
});
