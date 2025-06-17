
import { md5_sync } from '../_shared/crypto_utils.ts';

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
  const trimmedUsername = username.trim();
  console.log('🔐 Starting GP51 credential validation for user:', trimmedUsername);
  
  try {
    const hashedPassword = md5_sync(password);
    console.log('✅ Password hashed successfully');
    
    const targetApiUrl = apiUrl || GP51_API_URL;
    console.log('🌐 Using GP51 API URL:', targetApiUrl);
    
    // Try GET method first (most reliable for GP51)
    console.log('🔄 Attempting GET authentication method...');
    const getUrl = `${targetApiUrl}?action=login&username=${encodeURIComponent(trimmedUsername)}&password=${encodeURIComponent(hashedPassword)}`;
    
    const getResponse = await fetch(getUrl, {
      method: 'GET',
      headers: { 
        'Accept': 'application/json',
        'User-Agent': 'FleetIQ/1.0'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (getResponse.ok) {
      const responseText = await getResponse.text();
      console.log('📊 GET response received, length:', responseText.length);
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Failed to parse GET response as JSON:', parseError);
        throw new Error('Invalid response format from GP51 server');
      }

      if (result.status === 0 && result.token) {
        console.log(`✅ GET authentication successful for ${trimmedUsername}`);
        return {
          success: true,
          token: result.token,
          username: trimmedUsername,
          password: password,
          apiUrl: targetApiUrl,
          method: 'GET'
        };
      } else {
        const errorMessage = result.cause || result.message || `Authentication failed (status: ${result.status})`;
        console.log(`❌ GET authentication failed: ${errorMessage}`);
        throw new Error(errorMessage);
      }
    } else {
      console.log(`❌ GET request failed with status: ${getResponse.status}`);
      throw new Error(`HTTP ${getResponse.status}: ${getResponse.statusText}`);
    }

  } catch (error) {
    console.error('❌ GP51 authentication failed:', error);
    
    // Return structured error response
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'GP51 connection timed out. Please try again.',
        username: trimmedUsername
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
      username: trimmedUsername
    };
  }
}
