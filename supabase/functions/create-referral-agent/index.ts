
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // This client is for auth, using the user's token
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
        throw new Error("User not authenticated.");
    }
    
    // This client uses the service role key to bypass RLS
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Insert just the user_id, status defaults to 'pending_approval' in the new schema.
    const { data, error } = await serviceClient
      .from('referral_agents')
      .insert({ user_id: user.id })
      .select()
      .single();

    if (error) {
        // Handle case where agent profile might already exist
        if (error.code === '23505') { // unique_violation
             console.warn(`Referral agent profile already exists for user ${user.id}`);
             // Find existing and return it
             const { data: existingAgent, error: fetchError } = await serviceClient
                .from('referral_agents')
                .select('*')
                .eq('user_id', user.id)
                .single();
            if(fetchError) throw fetchError;
            return new Response(JSON.stringify(existingAgent), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }
        throw error;
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 201, // 201 Created
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
