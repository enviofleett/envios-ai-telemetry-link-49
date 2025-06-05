
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders, handleCorsPreflightRequest } from './cors.ts';
import { getCurrentUser } from './auth.ts';
import { 
  handleGetRequest, 
  handlePostRequest, 
  handlePutRequest, 
  handleDeleteRequest 
} from './requestHandlers.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const method = req.method;

    // Get current user from auth header
    const authHeader = req.headers.get('authorization');
    const currentUserId = await getCurrentUser(supabase, authHeader);

    let response;

    switch (method) {
      case 'GET':
        const result = await handleGetRequest(supabase, url, currentUserId);
        response = new Response(
          JSON.stringify(result),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
        break;

      case 'POST':
        response = await handlePostRequest(supabase, req, currentUserId);
        break;

      case 'PUT':
        response = await handlePutRequest(supabase, req, url, currentUserId);
        break;

      case 'DELETE':
        response = await handleDeleteRequest(supabase, url, currentUserId);
        break;

      default:
        response = new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return response;

  } catch (error) {
    console.error('User management error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: error.message?.includes('required') ? 400 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
