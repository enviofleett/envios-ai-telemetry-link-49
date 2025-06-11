
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
  const trimmedUsername = username.trim();
  console.log('🔐 Starting improved GP51 credential validation for user:', trimmedUsername);
  
  try {
    // Use the new authentication service for testing
    const testResponse = await fetch('http://localhost:54321/functions/v1/gp51-auth-service', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'test_authentication',
        username: trimmedUsername,
        password: password
      })
    });

    if (!testResponse.ok) {
      throw new Error(`Authentication service error: ${testResponse.status}`);
    }

    const result = await testResponse.json();
    
    if (result.success) {
      console.log(`✅ GP51 authentication successful using method: ${result.method}`);
      return {
        success: true,
        token: result.token,
        username: trimmedUsername,
        password: password,
        apiUrl: apiUrl || GP51_API_URL,
        method: result.method
      };
    } else {
      console.error(`❌ GP51 authentication failed: ${result.error}`);
      return {
        success: false,
        error: result.error,
        username: trimmedUsername
      };
    }

  } catch (error) {
    console.error('❌ GP51 authentication process failed:', error);
    
    // Fallback to original method if new service is not available
    console.log('🔄 Falling back to original authentication method...');
    
    try {
      const hashedPassword = createHash(password);
      
      // Try GET method as suggested in the plan
      const getUrl = `${GP51_API_URL}?action=login&username=${encodeURIComponent(trimmedUsername)}&password=${encodeURIComponent(hashedPassword)}`;
      
      const response = await fetch(getUrl, {
        method: 'GET',
        headers: { 
          'Accept': 'application/json',
          'User-Agent': 'FleetIQ/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      console.log('📊 Raw GP51 auth response:', text.substring(0, 200) + '...');

      let result;
      try {
        result = JSON.parse(text);
      } catch (jsonError) {
        throw new Error('Invalid response format from GP51 server');
      }

      if (result.status === 0 && result.token) {
        console.log(`✅ Fallback authentication successful for ${trimmedUsername}`);
        return {
          success: true,
          token: result.token,
          username: trimmedUsername,
          password: password,
          apiUrl: apiUrl || GP51_API_URL,
          method: 'GET_FALLBACK'
        };
      } else {
        const errorMessage = result.message || result.error || `Authentication failed (status: ${result.status})`;
        throw new Error(errorMessage);
      }

    } catch (fallbackError) {
      console.error(`❌ Fallback authentication also failed:`, fallbackError);
      return {
        success: false,
        error: fallbackError instanceof Error ? fallbackError.message : 'Authentication failed',
        username: trimmedUsername
      };
    }
  }
}
