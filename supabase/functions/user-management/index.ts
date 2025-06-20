
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getCurrentUser } from './auth.ts';
import { secureHash } from '../_shared/crypto_utils.ts';

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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    const userId = await getCurrentUser(supabase, authHeader);

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'create_user':
        return await createUser(supabase, body);
      case 'update_user':
        return await updateUser(supabase, body, userId);
      case 'delete_user':
        return await deleteUser(supabase, body, userId);
      case 'list_users':
        return await listUsers(supabase, userId);
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('User management error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function createUser(supabase: any, body: any) {
  const { username, email, password, role = 'user' } = body;

  if (!username || !email || !password) {
    return new Response(
      JSON.stringify({ error: 'Username, email, and password are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Hash password using async secure hash
  const hashedPassword = await secureHash(password);

  const { data, error } = await supabase
    .from('envio_users')
    .insert({
      username,
      email,
      password_hash: hashedPassword,
      role,
      is_active: true,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to create user' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ user: data }),
    { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function updateUser(supabase: any, body: any, currentUserId: string) {
  const { userId, updates } = body;

  if (!userId || !updates) {
    return new Response(
      JSON.stringify({ error: 'User ID and updates are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // If password is being updated, hash it
  if (updates.password) {
    updates.password_hash = await secureHash(updates.password);
    delete updates.password;
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('envio_users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to update user' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ user: data }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function deleteUser(supabase: any, body: any, currentUserId: string) {
  const { userId } = body;

  if (!userId) {
    return new Response(
      JSON.stringify({ error: 'User ID is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { error } = await supabase
    .from('envio_users')
    .delete()
    .eq('id', userId);

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to delete user' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function listUsers(supabase: any, currentUserId: string) {
  const { data, error } = await supabase
    .from('envio_users')
    .select('id, username, email, role, is_active, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch users' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ users: data }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
