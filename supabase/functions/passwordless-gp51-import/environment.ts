
export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  GP51_ADMIN_TOKEN: string;
  UPSTASH_TOKEN: string;
  UPSTASH_URL: string;
}

export function getEnvironment(): Env {
  return Deno.env.toObject() as Env;
}
