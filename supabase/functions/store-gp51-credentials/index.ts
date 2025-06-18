
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get the admin user
    const { data: adminUser, error: userError } = await supabase
      .from('envio_users')
      .select('id')
      .eq('email', 'chudesyl@gmail.com')
      .single();

    if (userError || !adminUser) {
      throw new Error('Admin user not found');
    }

    // Clear any existing sessions for this user
    await supabase
      .from('gp51_sessions')
      .delete()
      .eq('envio_user_id', adminUser.id);

    // Insert new session with credentials
    const { error: insertError } = await supabase
      .from('gp51_sessions')
      .insert({
        envio_user_id: adminUser.id,
        username: 'octopus',
        password_hash: 'your_octopus_password_here', // This will be replaced with actual password
        gp51_token: 'pending_authentication',
        token_expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
        api_url: 'https://www.gps51.com/webapi',
        auth_method: 'MANUAL_SETUP',
        created_at: new Date().toISOString(),
        last_validated_at: new Date().toISOString()
      });

    if (insertError) {
      throw insertError;
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'GP51 credentials stored successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error storing GP51 credentials:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
