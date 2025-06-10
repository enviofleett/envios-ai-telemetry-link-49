
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
  
  try {
    // Hash the password using MD5
    console.log('🔑 Hashing password for GP51 authentication...');
    const hashedPassword = await createHash(password);
    console.log('✅ Password hashed successfully for user:', trimmedUsername);
    
    let lastError: Error | null = null;
    
    // Try each complete API URL
    for (let urlIndex = 0; urlIndex < urlsToTry.length; urlIndex++) {
      const completeApiUrl = urlsToTry[urlIndex];
      console.log(`🔄 Trying GP51 complete API URL ${urlIndex + 1}/${urlsToTry.length}: ${completeApiUrl}`);
      
      // Validate URL format
      let validatedUrl: URL;
      try {
        validatedUrl = new URL(completeApiUrl);
        if (!validatedUrl.protocol.startsWith('http')) {
          throw new Error('Invalid protocol');
        }
      } catch (error) {
        console.error(`❌ Invalid URL format: ${completeApiUrl}`, error);
        lastError = new Error(`Invalid GP51 API URL format: ${completeApiUrl}`);
        continue; // Try next URL
      }
      
      // Construct the final API URL - now just append query parameters
      const finalApiUrl = `${completeApiUrl}?action=login&token=`;
      
      console.log(`📡 Using final GP51 API URL: ${finalApiUrl}`);
      
      // Prepare authentication payload
      const authData = {
        action: 'login',
        username: trimmedUsername,
        password: hashedPassword
      };
      
      console.log(`🚀 Auth attempt for user: ${trimmedUsername}`);
      
      try {
        const response = await fetch(finalApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Fleet-Management-System/1.0'
          },
          body: JSON.stringify(authData)
        });

        console.log(`📊 GP51 API response status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ GP51 API request failed: ${response.status} ${errorText}`);
          lastError = new Error(`GP51 API error (${response.status}): ${errorText || 'Unknown error'}`);
          continue; // Try next URL
        }

        // Get response text first to check if it's empty
        const responseText = await response.text();
        console.log(`📝 GP51 API response body length: ${responseText.length}`);
        
        if (!responseText || responseText.trim().length === 0) {
          console.error(`❌ Empty response from GP51 API`);
          lastError = new Error('GP51 API returned an empty response');
          continue; // Try next URL
        }

        // Try to parse JSON
        let result;
        try {
          result = JSON.parse(responseText);
          console.log('✅ GP51 authentication response parsed successfully');
        } catch (parseError) {
          console.error('❌ Failed to parse GP51 response as JSON:', parseError);
          console.error('📄 Response text:', responseText.substring(0, 200));
          lastError = new Error('GP51 API returned invalid JSON response');
          continue; // Try next URL
        }

        if (!result || typeof result !== 'object') {
          console.error('❌ Invalid response format from GP51 API:', result);
          lastError = new Error('Invalid response format from GP51 API');
          continue; // Try next URL
        }

        // Check for GP51 specific success/error format
        if (result.status !== undefined && result.status !== 0) {
          const errorMsg = result.cause || result.message || result.error || 'Authentication failed';
          console.error(`❌ GP51 authentication failed for user: ${trimmedUsername} Error: ${errorMsg}`);
          lastError = new Error(`GP51 authentication failed: ${errorMsg}`);
          continue; // Try next URL
        }

        // Check for token in response
        const token = result.token || result.session_id || result.sessionId;
        if (!token) {
          console.error(`❌ No token received from GP51 for user: ${trimmedUsername} Response:`, result);
          lastError = new Error('GP51 authentication failed: No token received');
          continue; // Try next URL
        }

        console.log(`🎉 SUCCESS! GP51 authentication successful for user: ${trimmedUsername} Token length: ${token.length}`);
        // Return the complete API URL (not just the base)
        return { token, username: trimmedUsername, apiUrl: completeApiUrl };

      } catch (error) {
        console.error(`❌ GP51 authentication error for user: ${trimmedUsername}`, error);
        
        if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('NetworkError') || error.message.includes('error sending request'))) {
          lastError = new Error(`Network error connecting to GP51 API at ${finalApiUrl}. Please verify the GP51 API URL is correct and accessible.`);
        } else {
          lastError = error instanceof Error ? error : new Error('Unknown authentication error');
        }
        continue; // Try next URL
      }
    }
    
    // If we get here, all URLs failed
    console.error('💥 All GP51 authentication URLs failed for user:', trimmedUsername);
    throw lastError || new Error('All GP51 authentication methods failed. Please check your API URL configuration.');

  } catch (error) {
    console.error('💥 GP51 authentication error for user:', trimmedUsername, error);
    throw error;
  }
}
