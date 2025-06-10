
import { createHash } from './crypto.ts';

export async function authenticateWithGP51({ 
  username, 
  password, 
  apiUrl 
}: { 
  username: string; 
  password: string; 
  apiUrl?: string;
}) {
  // Trim whitespace from username to ensure clean storage
  const trimmedUsername = username.trim();
  console.log('🔐 Starting GP51 credential validation for user:', trimmedUsername);
  
  try {
    // Get and validate GP51 API base URL - use provided apiUrl or environment variable
    let GP51_API_BASE = apiUrl?.trim() || Deno.env.get('GP51_API_BASE_URL');
    
    if (!GP51_API_BASE) {
      console.error('❌ GP51 API URL not provided and GP51_API_BASE_URL environment variable is not configured');
      throw new Error('GP51 API URL is required. Please provide an API URL or configure GP51_API_BASE_URL in Supabase secrets.');
    }

    // URLs to try in order of preference - now using complete webapi URLs
    const urlsToTry = [];
    
    if (apiUrl?.trim()) {
      // User provided a custom URL, ensure it includes /webapi
      const customUrl = apiUrl.trim();
      if (customUrl.includes('/webapi')) {
        urlsToTry.push(customUrl);
      } else {
        // Add protocol if missing
        let cleanUrl = customUrl;
        if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
          cleanUrl = 'https://' + cleanUrl;
        }
        urlsToTry.push(`${cleanUrl}/webapi`);
      }
    } else {
      // Try legacy URL first as it's more reliable - store complete webapi URL
      urlsToTry.push('https://gps51.com/webapi');
      urlsToTry.push('https://www.gps51.com/webapi');
      if (GP51_API_BASE && !urlsToTry.includes(GP51_API_BASE)) {
        // Ensure the base URL includes webapi
        if (GP51_API_BASE.includes('/webapi')) {
          urlsToTry.push(GP51_API_BASE);
        } else {
          urlsToTry.push(`${GP51_API_BASE}/webapi`);
        }
      }
    }

    console.log('🌐 Will try GP51 complete API URLs in order:', urlsToTry);
    
    // Hash the password using MD5
    console.log('🔑 Hashing password for GP51 authentication...');
    let hashedPassword;
    try {
      hashedPassword = await createHash(password);
      console.log('✅ Password hashed successfully for user:', trimmedUsername);
    } catch (hashError) {
      console.error('❌ Password hashing failed:', hashError);
      throw new Error('Password processing failed');
    }
    
    let lastError: Error | null = null;
    let successfulUrl: string | null = null;
    let authToken: string | null = null;

    // Try each URL until one works
    for (const currentUrl of urlsToTry) {
      try {
        console.log(`🌐 Attempting GP51 authentication with URL: ${currentUrl}`);
        
        const authData = {
          action: 'login',
          username: trimmedUsername,
          password: hashedPassword
        };

        // Make the API call with proper error handling
        let response;
        try {
          response = await fetch(`${currentUrl}?action=login&token=`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'User-Agent': 'EnvioFleet/1.0'
            },
            body: JSON.stringify(authData)
          });
        } catch (fetchError) {
          console.error(`❌ Network error for ${currentUrl}:`, fetchError);
          lastError = new Error(`Network error: ${fetchError instanceof Error ? fetchError.message : 'Connection failed'}`);
          continue; // Try next URL
        }

        if (!response.ok) {
          console.error(`❌ HTTP error for ${currentUrl}: ${response.status} ${response.statusText}`);
          lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
          continue; // Try next URL
        }

        let result;
        try {
          result = await response.json();
        } catch (jsonError) {
          console.error(`❌ JSON parsing error for ${currentUrl}:`, jsonError);
          lastError = new Error('Invalid response format from GP51 server');
          continue; // Try next URL
        }

        console.log(`📡 GP51 auth response from ${currentUrl}:`, { status: result.status, hasToken: !!result.token });
        
        // Check for successful authentication
        if (result.status === 0 && result.token) {
          console.log(`✅ Successfully authenticated ${trimmedUsername} using URL: ${currentUrl}`);
          successfulUrl = currentUrl;
          authToken = result.token;
          break; // Success!
        } else {
          // Enhanced error handling with standardized error extraction
          const errorMessage = result.cause || result.message || result.error || `Authentication failed (status: ${result.status})`;
          console.error(`❌ GP51 auth failed for ${currentUrl}. Status: ${result.status}, Error: ${errorMessage}`);
          lastError = new Error(errorMessage);
          continue; // Try next URL
        }

      } catch (urlError) {
        console.error(`❌ Unexpected error for ${currentUrl}:`, urlError);
        lastError = urlError instanceof Error ? urlError : new Error(String(urlError));
        continue; // Try next URL
      }
    }

    // Check if authentication was successful
    if (successfulUrl && authToken) {
      return {
        success: true,
        token: authToken,
        username: trimmedUsername,
        apiUrl: successfulUrl
      };
    } else {
      // All URLs failed
      console.error('❌ All GP51 authentication attempts failed');
      const finalError = lastError || new Error('All authentication attempts failed');
      throw finalError;
    }

  } catch (error) {
    console.error('❌ GP51 authentication process failed:', error);
    
    // Return a structured error response
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
      username: trimmedUsername
    };
  }
}
