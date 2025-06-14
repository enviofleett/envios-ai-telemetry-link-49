
/**
 * Suggests human-friendly solutions and checks for common error scenarios in GP51 validation.
 */
export function getSuggestedFixes(
  error: string | undefined,
  context?: { testName?: string }
): string[] {
  if (!error) return [];
  const fixes: string[] = [];
  const lc = error.toLowerCase();

  if (lc.includes("edge function returned a non-2xx")) {
    fixes.push("Check Supabase Edge Function logs for the failure reason.");
    fixes.push("Ensure referenced environment variables/secrets are configured in Supabase.");
    fixes.push("Verify function does not use deprecated or broken dependencies.");
    fixes.push("Check for infinite recursion or stack overflows in server code.");
  }
  if (lc.includes("database connection failed")) {
    fixes.push("Check Supabase database credentials and network accessibility.");
    fixes.push("Verify table and RLS (Row Level Security) policy configuration.");
    fixes.push("Confirm 'gp51_sessions' table exists and is accessible.");
  }
  if (lc.includes("session expired")) {
    fixes.push("Go to the GP51 Integration tab and re-authenticate to refresh credentials.");
    fixes.push("Verify that the token expiration time is in the future.");
  }
  if (lc.includes("unauthorized") || lc.includes("authentication") || lc.includes("autherror")) {
    fixes.push("Check your GP51 username and password.");
    fixes.push("Test the 'refresh session' function to renew credentials.");
  }
  if (lc.includes("no gp51 sessions")) {
    fixes.push("Go to the GP51 Integration tab to save GP51 credentials.");
    fixes.push("Ensure your credentials are valid and currently active.");
  }
  if (lc.includes("function invocation failed") || lc.includes("functions:")) {
    fixes.push("Check if the Supabase function is correctly deployed.");
    fixes.push("Make sure the Edge Functions API keys and invocation permissions are valid.");
  }
  if (lc.includes("position data missing")) {
    fixes.push("Check your vehicles table data—required fields like latitude/longitude may be missing.");
    fixes.push("Trigger a GP51 live sync to populate missing data.");
  }
  if (lc.includes("not found")) {
    fixes.push("Check Supabase table and function names for typos.");
    fixes.push("Ensure referenced objects/tables exist.");
  }
  if (fixes.length === 0) {
    fixes.push("Review the full error details above and check system configuration.");
    fixes.push("Refer to the documentation or contact support if the error persists.");
  }
  return fixes;
}
