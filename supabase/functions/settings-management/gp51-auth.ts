
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
    
    // Use POST method with JSON body as required by GP51 API documentation
    console.log('🔄 Attempting POST authentication method with JSON body...');
    
    const requestBody = {
      action: 'login',
      username: trimmedUsername,
      password: hashedPassword,
      from: 'WEB',
      type: 'USER'
    };
    
    console.log('📤 Sending POST request with body:', { ...requestBody, password: '[REDACTED]' });
    
    const postResponse = await fetch(targetApiUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'FleetIQ/1.0'
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (postResponse.ok) {
      const responseText = await postResponse.text();
      console.log('📊 POST response received, length:', responseText.length);
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Failed to parse POST response as JSON:', parseError);
        console.log('Raw response:', responseText);
        throw new Error('Invalid response format from GP51 server');
      }

      console.log('📋 Parsed GP51 response:', result);

      if (result.status === 0 && result.token) {
        console.log(`✅ POST authentication successful for ${trimmedUsername}`);
        return {
          success: true,
          token: result.token,
          username: trimmedUsername,
          password: password,
          apiUrl: targetApiUrl,
          method: 'POST'
        };
      } else {
        const errorMessage = result.cause || result.message || `Authentication failed (status: ${result.status})`;
        console.log(`❌ POST authentication failed: ${errorMessage}`);
        throw new Error(errorMessage);
      }
    } else {
      const errorText = await postResponse.text();
      console.log(`❌ POST request failed with status: ${postResponse.status}`);
      console.log('Error response:', errorText);
      throw new Error(`HTTP ${postResponse.status}: ${postResponse.statusText}`);
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
