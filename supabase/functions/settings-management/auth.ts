
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export interface AuthContext {
  userSupabase: any;
  adminSupabase: any;
  user: any;
  envioUser: any;
}

export async function authenticateRequest(authHeader: string | null): Promise<AuthContext> {
  // Create dual Supabase clients for proper authentication handling
  const userSupabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );

  const adminSupabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Extract and validate the Authorization header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authorization header missing or malformed');
  }

  // Validate user authentication using the user client with ANON_KEY
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: userError } = await userSupabase.auth.getUser(token);

  if (userError || !user) {
    console.error('❌ Invalid authentication token:', userError?.message || 'No user found');
    throw new Error('Invalid or expired user session');
  }

  console.log(`✅ User ${user.email || user.id} authenticated successfully`);

  // Get user from envio_users table using admin client for database operations
  const { data: envioUser, error: envioUserError } = await adminSupabase
    .from('envio_users')
    .select('id')
    .eq('email', user.email)
    .single();

  if (envioUserError || !envioUser) {
    console.error('❌ User profile not found:', envioUserError);
    throw new Error('User profile not found');
  }

  return {
    userSupabase,
    adminSupabase,
    user,
    envioUser
  };
}
