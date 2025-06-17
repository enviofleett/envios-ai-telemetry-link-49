
import { crypto } from "https://deno.land/std@0.208.0/crypto/mod.ts";

/**
 * Calculates the MD5 hash of a string, required for GP51 API authentication.
 * @param data The string to hash.
 * @returns A 32-digit lowercase hexadecimal string.
 */
export function md5_sync(data: string): string {
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);
  const hashBuffer = crypto.subtle.digestSync("MD5", dataBytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
