
export interface Environment {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  GP51_API_BASE_URL?: string;
}

export function getEnvironment(): Environment {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }
  
  return {
    SUPABASE_URL: supabaseUrl,
    SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey,
    GP51_API_BASE_URL: Deno.env.get('GP51_API_BASE_URL')
  };
}
