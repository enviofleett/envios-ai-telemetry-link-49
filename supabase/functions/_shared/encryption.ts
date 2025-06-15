
// AES-GCM encryption utility for Deno environment (Supabase Edge Functions)
// This provides strong, authenticated encryption for sensitive data like API keys.

const ALGORITHM = 'AES-GCM';

// Derives a CryptoKey from a secret string.
// The secret must be 32 bytes (256 bits) for AES-256.
async function getKey(secret: string): Promise<CryptoKey> {
  const keyData = new TextEncoder().encode(secret);
  if (keyData.byteLength !== 32) {
    throw new Error('Encryption key must be 32 bytes (256 bits) long.');
  }
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: ALGORITHM },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * @param text The plaintext to encrypt.
 * @param secret The 32-byte secret key.
 * @returns A Base64 encoded string containing the IV and the encrypted data.
 */
export async function encrypt(text: string, secret: string): Promise<string> {
  const key = await getKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV is recommended for AES-GCM
  const encodedText = new TextEncoder().encode(text);

  const encryptedData = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encodedText
  );

  // Combine IV and encrypted data for storage
  const combined = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encryptedData), iv.length);

  // Return as a Base64 string for easy storage
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts a string that was encrypted with AES-256-GCM.
 * @param encryptedText The Base64 encoded encrypted string.
 * @param secret The 32-byte secret key used for encryption.
 * @returns The original plaintext string.
 */
export async function decrypt(encryptedText: string, secret: string): Promise<string> {
  const key = await getKey(secret);
  const combined = new Uint8Array(
    atob(encryptedText).split('').map(char => char.charCodeAt(0))
  );

  // Extract IV and encrypted data
  const iv = combined.slice(0, 12);
  const encryptedData = combined.slice(12);

  const decryptedData = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    encryptedData
  );

  return new TextDecoder().decode(decryptedData);
}
