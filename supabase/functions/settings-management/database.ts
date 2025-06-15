/**
 * Stub implementations for settings-management database functions.
 * Replace these with actual implementations as needed.
 */

// Save GP51 session
export async function saveGP51Session(username, token, apiUrl, userId) {
  // TODO: Implement this
  return { username, token, apiUrl, userId };
}

// Get GP51 status
export async function getGP51Status() {
  // TODO: Implement this
  return { connected: false, username: null };
}

// Save SMTP settings
export async function saveSmtpSettings(body) {
  // TODO: Implement this
  return {};
}

// Update SMTP test status
export async function updateSmtpTestStatus(status, message) {
  // TODO: Implement this
  return {};
}

// Save SMS settings
export async function saveSmsSettings(settings) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  const encryptionKey = Deno.env.get('ENCRYPTION_KEY');
  if (!encryptionKey) throw new Error('Encryption key missing in server environment');

  const { userId, username, password, sender, route } = settings;
  if (!userId || !username || !password || !sender) {
    throw new Error('Missing required fields (userId, username, password, sender)');
  }
  const encryptedPassword = await encrypt(password, encryptionKey);

  // Upsert configuration for this user.
  const { data, error } = await supabase
    .from('sms_configurations')
    .upsert({
      user_id: userId,
      provider_name: 'mysms',
      api_username: username,
      api_password_encrypted: encryptedPassword,
      sender_id: sender,
      route: route ? Number(route) : 1,
      is_active: true,
      is_default: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: ['user_id', 'provider_name'] }) // Only one config per user/provider.
    .select();

  if (error) {
    console.error('[saveSmsSettings] Failed to upsert SMS config:', error);
    throw new Error(error.message || 'Failed to save SMS settings');
  }
  return data?.[0] ?? {};
}

// Get SMS settings
export async function getSmsSettings(userId) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  const encryptionKey = Deno.env.get('ENCRYPTION_KEY');
  if (!encryptionKey) throw new Error('Encryption key missing in server environment');
  if (!userId) throw new Error('User ID required');

  // Get most recent active config for this user.
  const { data, error } = await supabase
    .from('sms_configurations')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .maybeSingle();

  if (error) {
    console.error('[getSmsSettings] Error reading SMS config:', error);
    throw new Error(error.message || 'Failed to load SMS settings');
  }
  if (!data) return null;

  let decryptedPassword = "";
  try {
    decryptedPassword = await decrypt(data.api_password_encrypted, encryptionKey);
  } catch (e) {
    console.error('[getSmsSettings] Password decrypt failed', e);
    throw new Error('SMS password could not be decrypted');
  }

  // Match the schema expected by the SMS API/gateway function
  return {
    username: data.api_username,
    password: decryptedPassword,
    sender_id: data.sender_id,
    route: data.route
  };
}
