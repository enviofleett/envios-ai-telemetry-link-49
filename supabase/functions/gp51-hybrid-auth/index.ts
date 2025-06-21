
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { authenticateWithGP51 } from '../settings-management/gp51-auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuthRequest {
  action: string;
  username: string;
  password: string;
  apiUrl?: string;
}

serve(async (req) => {
  console.log('📥 [REQUEST]', req.method, req.url);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Enhanced environment variable validation
    console.log('🔍 [ENV DEBUG] Environment variables check:');
    const gp51ApiBaseUrl = Deno.env.get('GP51_API_BASE_URL');
    const gp51BaseUrl = Deno.env.get('GP51_BASE_URL');
    const gp51GlobalToken = Deno.env.get('GP51_GLOBAL_API_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log('  - GP51_API_BASE_URL:', gp51ApiBaseUrl ? 'SET' : 'NOT SET');
    console.log('  - GP51_BASE_URL:', gp51BaseUrl ? 'NOT SET' : 'NOT SET');
    console.log('  - GP51_GLOBAL_API_TOKEN:', gp51GlobalToken ? 'SET' : 'NOT SET');
    console.log('  - SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
    console.log('  - SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'SET' : 'NOT SET');

    const body: AuthRequest = await req.json();
    const { action, username, password, apiUrl } = body;

    // Enhanced client IP logging
    const clientIP = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    req.headers.get('cf-connecting-ip') || 
                    'unknown';
    console.log('🌍 [CLIENT] IP:', clientIP);
    
    // Sanitize username for logging (show first 3 chars + ***)
    const sanitizedUsername = username ? username.substring(0, 3) + '***' : 'undefined';
    console.log('📋 [REQUEST] Action:', action, ', Username:', sanitizedUsername);

    if (action === 'authenticate') {
      console.log('🔐 [AUTH] Starting GP51 authentication for user:', sanitizedUsername);
      
      // Environment validation
      console.log('🔄 [AUTH] Step 1: Validating environment variables');
      if (!gp51GlobalToken) {
        console.error('❌ [AUTH] GP51_GLOBAL_API_TOKEN not configured');
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'GP51 Global API Token not configured',
            code: 'MISSING_API_TOKEN'
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Determine base URL with fallback logic
      const baseUrl = apiUrl || gp51ApiBaseUrl || 'https://www.gps51.com/webapi';
      console.log('🌐 [GP51] Using base URL:', baseUrl);
      console.log('🔑 [GP51] Global API token found (length:', gp51GlobalToken.length, ')');

      // Step 2: Generate MD5 hash
      console.log('🔄 [AUTH] Step 2: Generating MD5 hash for GP51 API');
      const authResult = await authenticateWithGP51({ 
        username: username.trim(),
        password,
        apiUrl: baseUrl
      });

      if (authResult.success) {
        console.log('✅ [AUTH] GP51 authentication successful for user:', sanitizedUsername);
        return new Response(
          JSON.stringify(authResult),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } else {
        console.error('❌ [AUTH] GP51 authentication failed for user:', sanitizedUsername, 'Error:', authResult.error);
        return new Response(
          JSON.stringify(authResult),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ [ERROR] GP51 Hybrid Auth error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
