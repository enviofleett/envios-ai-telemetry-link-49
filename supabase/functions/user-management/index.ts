
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const url = new URL(req.url);
    const method = req.method;
    const pathSegments = url.pathname.split('/').filter(Boolean);

    if (method === 'GET') {
      // Get all users or specific user
      const userId = pathSegments[pathSegments.length - 1];
      
      if (userId && userId !== 'user-management') {
        // Get specific user with linked GP51 sessions
        const { data: user, error: userError } = await supabase
          .from('envio_users')
          .select(`
            *,
            gp51_sessions (
              id,
              username,
              created_at,
              token_expires_at
            )
          `)
          .eq('id', userId)
          .single();

        if (userError) {
          return new Response(
            JSON.stringify({ error: 'User not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ user }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // Get all users with their GP51 sessions
        const { data: users, error } = await supabase
          .from('envio_users')
          .select(`
            *,
            gp51_sessions (
              id,
              username,
              created_at,
              token_expires_at
            )
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching users:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch users' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ users }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (method === 'POST') {
      const { name, email } = await req.json();

      if (!name || !email) {
        return new Response(
          JSON.stringify({ error: 'Name and email are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: user, error } = await supabase
        .from('envio_users')
        .insert({ name, email })
        .select()
        .single();

      if (error) {
        console.error('Error creating user:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ user }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (method === 'PUT') {
      const userId = pathSegments[pathSegments.length - 1];
      const { name, email } = await req.json();

      const { data: user, error } = await supabase
        .from('envio_users')
        .update({ name, email, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ user }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (method === 'DELETE') {
      const userId = pathSegments[pathSegments.length - 1];

      const { error } = await supabase
        .from('envio_users')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Error deleting user:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ message: 'User deleted successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('User management error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
