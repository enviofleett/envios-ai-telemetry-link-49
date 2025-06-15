
import { createHash } from "https://deno.land/std@0.192.0/crypto/mod.ts";

/**
 * Calculates the MD5 hash of a string, required for GP51 API authentication.
 * @param data The string to hash.
 * @returns A 32-digit lowercase hexadecimal string.
 */
export function md5_sync(data: string): string {
  const hash = createHash("md5");
  hash.update(data);
  return hash.toString();
}
