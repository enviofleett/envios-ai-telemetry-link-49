
// Trigger re-deploy - 2025-06-14
import md5 from "npm:js-md5";

/**
 * MD5 hash function (synchronous) - always use this to avoid recursion/stack issues
 */
export function md5_sync(input: string): string {
  return md5(input);
}

/**
 * Deprecated async MD5 function for legacy edge calls.
 * Now just wraps the sync version.
 * If possible, always migrate code to use md5_sync directly.
 */
export async function md5(input: string): Promise<string> {
  console.warn("The async md5 function is deprecated. Use md5_sync if possible.");
  // FIX: This was causing a stack overflow due to recursion. Now correctly calls the sync version.
  return md5_sync(input);
}
