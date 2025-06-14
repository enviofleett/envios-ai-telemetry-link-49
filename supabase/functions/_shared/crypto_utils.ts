
// Trigger re-deploy - 2025-06-14
import md5 from "npm:js-md5";

export function md5_sync(input: string): string {
  return md5(input);
}

// For compatibility, we can keep an async version if absolutely needed elsewhere,
// but for the immediate fix, we'll use the synchronous one.
// Or, we can remove this if all usages become synchronous.
// For now, let's assume all calls will be updated.
export async function md5(input: string): Promise<string> {
  // This function is now effectively synchronous but retains the async signature
  // to minimize changes in calling code if some parts still expect a Promise.
  // However, the core logic is now synchronous.
  // A better approach is to update all callers to use md5_sync.
  // For this fix, we'll rename the old one and make the main one sync.
  console.warn("The async md5 function is deprecated. Use md5_sync instead if possible or ensure the call site is updated.");
  return md5_sync(input);
}
