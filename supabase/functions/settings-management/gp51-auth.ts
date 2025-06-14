
// crypto.ts createHash is not needed here if gp51-auth-service handles hashing.
// const GP51_API_URL = "https://www.gps51.com/webapi"; // Not needed if gp51-auth-service handles API URL

export async function authenticateWithGP51({ 
  username, 
  password, 
  apiUrl // apiUrl might still be relevant if different users can have different API endpoints
}: { 
  username: string; 
  password: string; 
  apiUrl?: string; // This could be passed to gp51-auth-service if it supports dynamic API URLs
}) {
  const trimmedUsername = username.trim();
  console.log('🔐 Standardizing GP51 credential validation for user (via settings-management):', trimmedUsername);
  
  try {
    // Directly call the centralized gp51-auth-service
    // Ensure the SUPABASE_FUNCTIONS_URL is correctly set or use relative path if invoking from another function (less common)
    // For client-to-function, supabase.functions.invoke is fine. For function-to-function, direct fetch or service client.
    // Here, settings-management is an edge function, so it can invoke another.
    
    // We need a Supabase client instance here to call other functions, or use fetch.
    // This function is part of an edge function, so Deno.env.get for Supabase URL/keys.
    // However, it's simpler if `settings-management/index.ts` invokes `gp51-auth-service` directly.
    // This helper `gp51-auth.ts` becomes less critical if the main function handles invocation.

    // Let's assume settings-management/index.ts will use supabase.functions.invoke
    // This function then just prepares the payload or can be removed if logic is simple enough in index.ts
    
    console.log(`Attempting to use 'gp51-auth-service' for authentication.`);
    // The actual invocation should happen in settings-management/index.ts
    // This function now primarily serves to indicate the intent.
    // The result processing will be handled by the caller (settings-management/index.ts).

    // This function's role diminishes significantly. It might just return the parameters needed
    // for settings-management/index.ts to call gp51-auth-service.
    // Or, settings-management/index.ts can bypass this helper entirely.

    // For now, let's indicate it prepares for gp51-auth-service call:
    return {
      useCentralAuthService: true,
      authServicePayload: {
        action: 'test_authentication',
        username: trimmedUsername,
        password: password,
        // apiUrl: apiUrl // if gp51-auth-service supports custom API URLs
      }
    };

  } catch (error) {
    console.error('❌ GP51 authentication process failed within settings-management/gp51-auth.ts:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
      username: trimmedUsername,
      useCentralAuthService: false, // Indicate failure to even prepare
    };
  }
}

