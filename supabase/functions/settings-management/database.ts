/**
 * Stub implementations for settings-management database functions.
 * Replace these with actual implementations as needed.
 */

// ---- ADDED IMPORTS ----
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { encrypt, decrypt } from '../_shared/encryption.ts';

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
  if (!encryptionKey) {
    console.error('[saveSmsSettings] ENCRYPTION_KEY missing in environment');
    throw new Error('Encryption key missing in server environment');
  }
  if (typeof encryptionKey !== 'string' || encryptionKey.length !== 32) {
    console.error(`[saveSmsSettings] ENCRYPTION_KEY is invalid length: ${encryptionKey.length} (should be 32)`);
    throw new Error('Invalid encryption key in environment: must be exactly 32 characters');
  }

  const { userId, username, password, sender, route } = settings;
  if (!userId || !username || !password || !sender) {
    console.error('[saveSmsSettings] Missing required fields (userId, username, password, sender)', { userId, username, sender });
    throw new Error('Missing required fields (userId, username, password, sender)');
  }
  let encryptedPassword = '';
  try {
    encryptedPassword = await encrypt(password, encryptionKey);
  } catch (err) {
    console.error('[saveSmsSettings] Password encryption failed:', err);
    throw new Error('Failed to encrypt SMS password');
  }

  // Defensive: Always store route as string (DB expects text)
  let safeRoute = '1';
  if (route) {
    safeRoute = typeof route === 'string' ? route : String(route);
  }

  // Detailed logs before upsert
  console.log('[saveSmsSettings] Saving/upserting SMS config:', {
    user_id: userId, provider_name: 'mysms', username, sender, route: safeRoute
  });

  const { data, error } = await supabase
    .from('sms_configurations')
    .upsert({
      user_id: userId,
      provider_name: 'mysms',
      username,
      password_encrypted: encryptedPassword,
      sender_id: sender,
      route: safeRoute,
      is_active: true,
      is_default: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: ['user_id', 'provider_name'] })
    .select();

  if (error) {
    console.error('[saveSmsSettings] Failed to upsert SMS config:', error);
    throw new Error(error.message || 'Failed to save SMS settings');
  }
  if (!data || !data[0]) {
    console.error('[saveSmsSettings] No config returned after upsert');
    throw new Error('SMS settings not saved; possible upsert error or permission issue.');
  }
  console.log('[saveSmsSettings] SMS config saved successfully:', data[0]);
  return data[0];
}

// Get SMS settings
export async function getSmsSettings(userId) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  const encryptionKey = Deno.env.get('ENCRYPTION_KEY');
  if (!encryptionKey) {
    console.error('[getSmsSettings] ENCRYPTION_KEY missing in environment');
    throw new Error('Encryption key missing in server environment');
  }
  if (typeof encryptionKey !== 'string' || encryptionKey.length !== 32) {
    console.error(`[getSmsSettings] ENCRYPTION_KEY is invalid length: ${encryptionKey.length} (should be 32)`);
    throw new Error('Invalid encryption key in environment: must be exactly 32 characters');
  }
  if (!userId) {
    console.error('[getSmsSettings] User ID required');
    throw new Error('User ID required');
  }

  // Detailed log before select
  console.log('[getSmsSettings] Reading SMS config for userId:', userId);

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
  if (!data) {
    console.warn('[getSmsSettings] No SMS config found for user');
    return null;
  }

  let decryptedPassword = "";
  try {
    decryptedPassword = await decrypt(data.password_encrypted, encryptionKey);
  } catch (e) {
    console.error('[getSmsSettings] Password decrypt failed', e);
    throw new Error('SMS password could not be decrypted');
  }

  // Match the schema expected by the SMS API/gateway function
  return {
    username: data.username,
    password: decryptedPassword,
    sender_id: data.sender_id,
    route: data.route
  };
}
