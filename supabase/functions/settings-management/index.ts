
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { authenticateWithGP51 } from './gp51-auth.ts'; // This will be simplified
import { corsHeaders } from '../_shared/cors.ts'; // Assuming cors.ts exists and exports corsHeaders
import { jsonResponse, errorResponse } from '../_shared/response_utils.ts';
// import { createHash } from './crypto.ts'; // Hashing should be handled by gp51-auth-service

// Helper function to create Supabase client
function getSupabaseClient(req?: Request) {
  const authHeader = req?.headers.get('Authorization');
  if (authHeader) {
    return createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
  }
  // For service-to-service or operations not tied to a user session, use service_role key
  return createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
}


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let requestBody;
  try {
    requestBody = await req.json();
  } catch (e) {
    return errorResponse('Invalid JSON body', 400);
  }

  const { action, ...params } = requestBody;
  const supabaseAdmin = getSupabaseClient(); // Use admin client for settings management

  console.log(`⚙️ Settings Management: Action - ${action}`);

  try {
    if (action === 'save-gp51-credentials') {
      const { username, password, apiUrl } = params;
      if (!username || !password) {
        return errorResponse('Username and password are required.', 400);
      }

      console.log(`Attempting to save GP51 credentials for ${username} via central auth service.`);
      
      // Invoke gp51-auth-service directly.
      // This Edge Function ('settings-management') needs to call another ('gp51-auth-service').
      // This requires setting up the Supabase client appropriately or using fetch with service key.
      // Using supabase.functions.invoke from an Edge Function to another is possible if client is service_role.

      const { data: authServiceResponse, error: authServiceError } = await supabaseAdmin.functions.invoke('gp51-auth-service', {
        body: {
          action: 'test_authentication',
          username: username.trim(),
          password: password,
          // apiUrl: apiUrl // If gp51-auth-service supports custom apiUrl
        }
      });

      if (authServiceError) {
        console.error('Error invoking gp51-auth-service from settings-management:', authServiceError);
        return errorResponse(authServiceError.message || 'Failed to call auth service', 500);
      }

      if (authServiceResponse.success) {
        // gp51-auth-service would have handled saving the session to gp51_sessions table.
        console.log(`✅ Credentials validated and session stored by gp51-auth-service for ${authServiceResponse.username}`);
        return jsonResponse({
          success: true,
          message: `GP51 credentials processed successfully for ${authServiceResponse.username} using method ${authServiceResponse.method}.`,
          username: authServiceResponse.username,
          method: authServiceResponse.method,
        });
      } else {
        console.error(`❌ gp51-auth-service reported failure: ${authServiceResponse.error}`);
        return errorResponse(authServiceResponse.error || 'Failed to save/validate credentials via auth service', 401);
      }
    } else if (action === 'get-gp51-status') {
        // This action should ideally be in gp51-service-management or a dedicated status function
        // that checks the gp51_sessions table for the current user.
        // For now, if settings-management handles it, it needs user context.
        const supabaseUserClient = getSupabaseClient(req); // Client with user's auth context
        const { data: { user } } = await supabaseUserClient.auth.getUser();

        if (!user) {
            return errorResponse("User not authenticated", 401, undefined, "AUTH_REQUIRED");
        }

        const { data: sessions, error: dbError } = await supabaseAdmin // Use admin to read all sessions if needed, or filter by user_id
            .from('gp51_sessions')
            .select('username, token_expires_at, last_validated_at, auth_method')
            .eq('envio_user_id', user.id) // Ensure envio_user_id is reliably populated
            .order('last_validated_at', { ascending: false })
            .limit(1);

        if (dbError) {
            console.error('Error fetching GP51 session status:', dbError);
            return errorResponse('Failed to fetch session status', 500);
        }

        if (sessions && sessions.length > 0) {
            const currentSession = sessions[0];
            const isExpired = new Date(currentSession.token_expires_at) <= new Date();
            if (!isExpired) {
                 return jsonResponse({
                    connected: true,
                    username: currentSession.username,
                    expiresAt: currentSession.token_expires_at,
                    method: currentSession.auth_method,
                    lastCheck: new Date().toISOString(),
                });
            }
        }
        return jsonResponse({ connected: false, error: 'No active GP51 session found or session expired.', lastCheck: new Date().toISOString() });

    } else {
      return errorResponse(`Unknown action: ${action}`, 400);
    }
  } catch (err) {
    console.error("💥 Unexpected error in Settings Management:", err);
    return errorResponse("Internal server error", 500, err.message);
  }
});
