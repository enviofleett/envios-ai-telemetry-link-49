
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export async function findImportedUser(username: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { data: envioUser, error: userError } = await supabase
    .from('envio_users')
    .select('*')
    .eq('gp51_username', username)
    .eq('is_gp51_imported', true)
    .eq('needs_password_set', true)
    .single();

  return { envioUser, userError };
}

export async function updateUserPassword(userId: string, newPassword: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
    userId,
    { password: newPassword }
  );

  return { authUpdateError };
}

export async function updateUserFlags(userId: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { error: userUpdateError } = await supabase
    .from('envio_users')
    .update({
      needs_password_set: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  return { userUpdateError };
}

export async function storeGP51Session(userId: string, username: string, token: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const tokenExpiresAt = new Date();
  tokenExpiresAt.setHours(tokenExpiresAt.getHours() + 24); // Assume 24 hour expiry

  const { error: sessionError } = await supabase
    .from('gp51_sessions')
    .upsert({
      envio_user_id: userId,
      username: username,
      gp51_token: token,
      token_expires_at: tokenExpiresAt.toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'envio_user_id'
    });

  return { sessionError };
}
