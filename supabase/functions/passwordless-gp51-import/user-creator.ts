
import { generateTempPassword } from './password-generator.ts';

export async function createEnvioUser(gp51Username: string, tempPassword: string, supabase: any) {
  console.log(`Creating auth user for ${gp51Username}...`);
  
  // Generate a temporary email for the user
  const tempEmail = `${gp51Username}@temp.gp51import.local`;
  
  try {
    // Create user in Supabase Auth with temporary password
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: tempEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        gp51_username: gp51Username,
        import_source: 'passwordless_import',
        import_timestamp: new Date().toISOString()
      }
    });

    if (authError) {
      console.error(`Auth user creation failed for ${gp51Username}:`, authError);
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    console.log(`Auth user created for ${gp51Username}, ID: ${authUser.user.id}`);

    // Create user in envio_users table
    const { data: envioUser, error: envioError } = await supabase
      .from('envio_users')
      .insert({
        id: authUser.user.id,
        name: gp51Username,
        email: tempEmail,
        gp51_username: gp51Username,
        is_gp51_imported: true,
        needs_password_set: true,
        import_source: 'passwordless_import',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (envioError) {
      console.error(`Envio user creation failed for ${gp51Username}:`, envioError);
      // Cleanup auth user if envio user creation fails
      try {
        await supabase.auth.admin.deleteUser(authUser.user.id);
        console.log(`Cleaned up auth user for failed envio user creation: ${gp51Username}`);
      } catch (cleanupError) {
        console.error(`Failed to cleanup auth user for ${gp51Username}:`, cleanupError);
      }
      throw new Error(`Failed to create envio user: ${envioError.message}`);
    }

    console.log(`Envio user created for ${gp51Username}, ID: ${envioUser.id}`);
    return envioUser;

  } catch (error) {
    console.error(`User creation failed for ${gp51Username}:`, error);
    throw error;
  }
}
