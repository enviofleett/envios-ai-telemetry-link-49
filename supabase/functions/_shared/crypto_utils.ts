
// Trigger re-deploy - 2025-06-14
import { md5 as md5Hash } from "npm:js-md5";

/**
 * MD5 hash function (synchronous) - always use this to avoid recursion/stack issues
 */
export function md5_sync(input: string): string {
  // Use the renamed import to call the actual library function
  return md5Hash(input);
}

/**
 * Deprecated async MD5 function for legacy edge calls.
 * Now just wraps the sync version.
 * If possible, always migrate code to use md5_sync directly.
 */
export async function md5(input: string): Promise<string> {
  console.warn("The async md5 function is deprecated. Use md5_sync if possible.");
  // This call is now safe as the recursion is broken.
  return md5_sync(input);
}
