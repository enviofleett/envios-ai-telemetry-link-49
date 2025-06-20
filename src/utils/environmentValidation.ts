
interface RequiredEnvironmentVariables {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
}

export function validateEnvironment(): RequiredEnvironmentVariables {
  const requiredVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}. ` +
      'Please check your .env.local file and ensure all required variables are set.'
    );
  }

  return requiredVars as RequiredEnvironmentVariables;
}

export function isProductionEnvironment(): boolean {
  return import.meta.env.PROD;
}

export function isDevelopmentEnvironment(): boolean {
  return import.meta.env.DEV;
}

// Validate environment on module load
try {
  validateEnvironment();
} catch (error) {
  console.error('Environment validation failed:', error);
  if (isDevelopmentEnvironment()) {
    console.warn(
      'To fix this, create a .env.local file in your project root with the required environment variables. ' +
      'See .env.example for the required format.'
    );
  }
}
