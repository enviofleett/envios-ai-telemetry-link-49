
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

export function validateEnvironment(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const result = {
    isValid: true,
    errors: [] as string[],
    warnings: [] as string[]
  };
  
  try {
    const env = getEnvironment();
    
    // Validate required variables
    if (!env.SUPABASE_URL) {
      result.isValid = false;
      result.errors.push('SUPABASE_URL is required');
    } else {
      try {
        new URL(env.SUPABASE_URL);
      } catch {
        result.isValid = false;
        result.errors.push('SUPABASE_URL is not a valid URL');
      }
    }
    
    if (!env.SUPABASE_SERVICE_ROLE_KEY) {
      result.isValid = false;
      result.errors.push('SUPABASE_SERVICE_ROLE_KEY is required');
    }
    
    // Validate optional but recommended variables
    if (!env.GP51_API_BASE_URL) {
      result.warnings.push('GP51_API_BASE_URL is not configured');
    } else {
      try {
        new URL(env.GP51_API_BASE_URL);
      } catch {
        result.warnings.push('GP51_API_BASE_URL is not a valid URL');
      }
    }
    
  } catch (error) {
    result.isValid = false;
    result.errors.push(`Environment validation failed: ${error.message}`);
  }
  
  return result;
}
