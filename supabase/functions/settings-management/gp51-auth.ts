

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
    
    // Try hybrid approach: action in URL, credentials in JSON body
    console.log('🔄 Attempting hybrid POST method (action in URL, credentials in body)...');
    
    const hybridUrl = `${targetApiUrl}?action=login`;
    const requestBody = {
      username: trimmedUsername,
      password: hashedPassword,
      from: 'WEB',
      type: 'USER'
    };
    
    console.log('📤 Sending hybrid POST request to:', hybridUrl);
    console.log('📤 With body:', { ...requestBody, password: '[REDACTED]' });
    
    const hybridResponse = await fetch(hybridUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'FleetIQ/1.0'
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (hybridResponse.ok) {
      const responseText = await hybridResponse.text();
      console.log('📊 Hybrid POST response received, length:', responseText.length);
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Failed to parse hybrid response as JSON:', parseError);
        console.log('Raw response:', responseText);
        throw new Error('Invalid response format from GP51 server');
      }

      console.log('📋 Parsed GP51 hybrid response:', result);

      if (result.status === 0 && result.token) {
        console.log(`✅ Hybrid POST authentication successful for ${trimmedUsername}`);
        return {
          success: true,
          token: result.token,
          username: trimmedUsername,
          password: password,
          apiUrl: targetApiUrl,
          method: 'POST_HYBRID'
        };
      } else {
        const errorMessage = result.cause || result.message || `Authentication failed (status: ${result.status})`;
        console.log(`❌ Hybrid POST authentication failed: ${errorMessage}`);
        // Don't throw yet, try fallback method
      }
    } else {
      const errorText = await hybridResponse.text();
      console.log(`❌ Hybrid POST request failed with status: ${hybridResponse.status}`);
      console.log('Hybrid error response:', errorText);
      // Don't throw yet, try fallback method
    }

    // Fallback: Try GET method with all parameters in URL
    console.log('🔄 Attempting fallback GET method (all parameters in URL)...');
    
    const getUrl = `${targetApiUrl}?action=login&username=${encodeURIComponent(trimmedUsername)}&password=${encodeURIComponent(hashedPassword)}&from=WEB&type=USER`;
    
    console.log('📤 Sending GET request to:', getUrl.replace(hashedPassword, '[REDACTED]'));
    
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
        console.log('Raw response:', responseText);
        throw new Error('Invalid response format from GP51 server');
      }

      console.log('📋 Parsed GP51 GET response:', result);

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
      const errorText = await getResponse.text();
      console.log(`❌ GET request failed with status: ${getResponse.status}`);
      console.log('GET error response:', errorText);
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

