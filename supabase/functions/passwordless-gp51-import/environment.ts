
export function getEnvironment() {
  return {
    SUPABASE_URL: Deno.env.get('SUPABASE_URL') ?? '',
    SUPABASE_ANON_KEY: Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    GP51_API_BASE_URL: Deno.env.get('GP51_API_BASE_URL') ?? 'https://gps51.com',
    UPSTASH_URL: Deno.env.get('UPSTASH_URL') ?? '',
    UPSTASH_TOKEN: Deno.env.get('UPSTASH_TOKEN') ?? ''
  };
}
