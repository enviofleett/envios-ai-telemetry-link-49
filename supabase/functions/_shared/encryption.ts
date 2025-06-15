
import { Buffer } from "https://deno.land/std@0.190.0/io/buffer.ts";

// Using AES-GCM for authenticated encryption.
const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12; // 96 bits is recommended for AES-GCM.

// Helper to convert ArrayBuffer to Base64 string
function ab2b64(buf: ArrayBuffer): string {
  const bin = Array.from(new Uint8Array(buf));
  return btoa(bin.map((byte) => String.fromCharCode(byte)).join(''));
}

// Helper to convert Base64 string to ArrayBuffer
function b642ab(b64: string): ArrayBuffer {
  const byteString = atob(b64);
  const bytes = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    bytes[i] = byteString.charCodeAt(i);
  }
  return bytes.buffer;
}

async function getKey(secret: string): Promise<CryptoKey> {
    const keyData = new TextEncoder().encode(secret);
    if (keyData.length !== 32) {
        throw new Error(`Invalid secret length. Expected 32 bytes, got ${keyData.length}.`);
    }
    return await crypto.subtle.importKey('raw', keyData, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function encrypt(plaintext: string, secret: string): Promise<string> {
    const key = await getKey(secret);
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const encodedPlaintext = new TextEncoder().encode(plaintext);

    const ciphertext = await crypto.subtle.encrypt(
        { name: ALGORITHM, iv },
        key,
        encodedPlaintext
    );

    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);

    return ab2b64(combined.buffer);
}

export async function decrypt(encryptedData: string, secret: string): Promise<string> {
    const key = await getKey(secret);
    const combined = b642ab(encryptedData);

    const iv = combined.slice(0, IV_LENGTH);
    const ciphertext = combined.slice(IV_LENGTH);

    const decrypted = await crypto.subtle.decrypt(
        { name: ALGORITHM, iv },
        key,
        ciphertext
    );

    return new TextDecoder().decode(decrypted);
}
