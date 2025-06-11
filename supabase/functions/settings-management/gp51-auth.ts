
import { createHash } from './crypto.ts';

const GP51_API_URL = "https://www.gps51.com/webapi";

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
    // Hash the password using MD5
    console.log('🔑 Hashing password for GP51 authentication...');
    let hashedPassword;
    try {
      hashedPassword = createHash(password);
      console.log('✅ Password hashed successfully for user:', trimmedUsername);
    } catch (hashError) {
      console.error('❌ Password hashing failed:', hashError);
      throw new Error('Password processing failed');
    }
    
    console.log('🌐 Testing GP51 authentication with proper API format...');
    
    try {
      // Use proper GP51 API format with POST and form data
      const formData = new URLSearchParams({
        action: 'login',
        username: trimmedUsername,
        password: hashedPassword,
        from: 'WEB',
        type: 'USER'
      });

      console.log(`🌐 Attempting GP51 authentication with URL: ${GP51_API_URL}`);
      
      const response = await fetch(GP51_API_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'User-Agent': 'EnvioFleet/1.0'
        },
        body: formData.toString()
      });

      if (!response.ok) {
        console.error(`❌ HTTP error: ${response.status} ${response.statusText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      console.log('📊 Raw GP51 auth response:', text.substring(0, 200) + '...');

      let result;
      try {
        result = JSON.parse(text);
      } catch (jsonError) {
        console.error(`❌ JSON parsing error:`, jsonError);
        throw new Error('Invalid response format from GP51 server');
      }

      console.log(`📡 GP51 auth response:`, { status: result.status, hasToken: !!result.token });
      
      // Check for successful authentication
      if (result.status === 0 && result.token) {
        console.log(`✅ Successfully authenticated ${trimmedUsername}`);
        return {
          success: true,
          token: result.token,
          username: trimmedUsername,
          password: password, // Store the original password for future use
          apiUrl: GP51_API_URL
        };
      } else {
        // Enhanced error handling with standardized error extraction
        const errorMessage = result.message || result.error || `Authentication failed (status: ${result.status})`;
        console.error(`❌ GP51 auth failed. Status: ${result.status}, Error: ${errorMessage}`);
        throw new Error(errorMessage);
      }

    } catch (urlError) {
      console.error(`❌ GP51 authentication error:`, urlError);
      throw urlError;
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
