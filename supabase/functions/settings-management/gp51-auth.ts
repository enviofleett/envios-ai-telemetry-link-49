
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
  console.log('Starting GP51 credential validation for user:', trimmedUsername);
  
  // Get and validate GP51 API base URL - use provided apiUrl or environment variable
  let GP51_API_BASE = apiUrl?.trim() || Deno.env.get('GP51_API_BASE_URL');
  
  if (!GP51_API_BASE) {
    console.error('GP51 API URL not provided and GP51_API_BASE_URL environment variable is not configured');
    throw new Error('GP51 API URL is required. Please provide an API URL or configure GP51_API_BASE_URL in Supabase secrets.');
  }

  // If no custom API URL is provided, try the legacy URL first as fallback
  const urlsToTry = [];
  
  if (apiUrl?.trim()) {
    // User provided a custom URL, try it first
    urlsToTry.push(apiUrl.trim());
  } else {
    // Try both new and legacy URLs
    urlsToTry.push('https://www.gps51.com/webapi'); // Legacy URL first
    urlsToTry.push('https://api.gps51.com'); // New URL as fallback
    if (GP51_API_BASE && !urlsToTry.includes(GP51_API_BASE)) {
      urlsToTry.push(GP51_API_BASE);
    }
  }

  console.log('Will try GP51 API URLs in order:', urlsToTry);
  
  try {
    // Hash the password
    const hashedPassword = await createHash(password);
    console.log('Password hashed successfully for user:', trimmedUsername);
    
    // Try different authentication payload formats that GP51 might expect
    const authenticationAttempts = [
      // Attempt 1: Login action (most common)
      {
        action: 'login',
        username: trimmedUsername,
        password: hashedPassword
      },
      // Attempt 2: User login action
      {
        action: 'user_login',
        username: trimmedUsername,
        password: hashedPassword
      },
      // Attempt 3: Simple credentials without action
      {
        username: trimmedUsername,
        password: hashedPassword
      }
    ];
    
    let lastError: Error | null = null;
    
    // Try each URL
    for (let urlIndex = 0; urlIndex < urlsToTry.length; urlIndex++) {
      const baseUrl = urlsToTry[urlIndex];
      console.log(`Trying GP51 API URL ${urlIndex + 1}/${urlsToTry.length}: ${baseUrl}`);
      
      // Clean up and validate the URL
      let cleanUrl = baseUrl;
      
      // Add protocol if missing
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = 'https://' + cleanUrl;
      }
      
      // Remove trailing /webapi if present (we'll add it back if needed)
      cleanUrl = cleanUrl.replace(/\/webapi\/?$/, '');
      
      // Validate URL format
      let validatedUrl: URL;
      try {
        validatedUrl = new URL(cleanUrl);
        if (!validatedUrl.protocol.startsWith('http')) {
          throw new Error('Invalid protocol');
        }
      } catch (error) {
        console.error(`Invalid URL format: ${cleanUrl}`, error);
        lastError = new Error(`Invalid GP51 API URL format: ${cleanUrl}`);
        continue; // Try next URL
      }
      
      // Construct the final API URL
      let finalApiUrl: string;
      if (cleanUrl.includes('api.gps51.com')) {
        // New API format - no /webapi needed
        finalApiUrl = cleanUrl;
      } else {
        // Legacy API format - add /webapi
        finalApiUrl = `${cleanUrl}/webapi`;
      }
      
      console.log(`Using final GP51 API URL: ${finalApiUrl}`);
      
      // Try each authentication method for this URL
      for (let i = 0; i < authenticationAttempts.length; i++) {
        const loginPayload = authenticationAttempts[i];
        console.log(`URL ${urlIndex + 1}, Auth attempt ${i + 1}:`, { ...loginPayload, password: '[REDACTED]' });
        
        try {
          const response = await fetch(finalApiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'User-Agent': 'Fleet-Management-System/1.0'
            },
            body: JSON.stringify(loginPayload)
          });

          console.log(`URL ${urlIndex + 1}, Attempt ${i + 1} - GP51 API response status:`, response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`URL ${urlIndex + 1}, Attempt ${i + 1} - GP51 API request failed:`, response.status, errorText);
            lastError = new Error(`GP51 API error (${response.status}): ${errorText || 'Unknown error'}`);
            continue; // Try next attempt
          }

          // Get response text first to check if it's empty
          const responseText = await response.text();
          console.log(`URL ${urlIndex + 1}, Attempt ${i + 1} - GP51 API response body length:`, responseText.length);
          
          if (!responseText || responseText.trim().length === 0) {
            console.error(`URL ${urlIndex + 1}, Attempt ${i + 1} - Empty response from GP51 API`);
            lastError = new Error('GP51 API returned an empty response');
            continue; // Try next attempt
          }

          // Try to parse JSON
          let result;
          try {
            result = JSON.parse(responseText);
            console.log(`URL ${urlIndex + 1}, Attempt ${i + 1} - GP51 authentication response parsed successfully`);
          } catch (parseError) {
            console.error(`URL ${urlIndex + 1}, Attempt ${i + 1} - Failed to parse GP51 response as JSON:`, parseError);
            lastError = new Error('GP51 API returned invalid JSON response');
            continue; // Try next attempt
          }

          if (!result || typeof result !== 'object') {
            console.error(`URL ${urlIndex + 1}, Attempt ${i + 1} - Invalid response format from GP51 API:`, result);
            lastError = new Error('Invalid response format from GP51 API');
            continue; // Try next attempt
          }

          // Check for GP51 specific success/error format
          if (result.status !== undefined && result.status !== 0) {
            const errorMsg = result.cause || result.message || result.error || 'Authentication failed';
            console.error(`URL ${urlIndex + 1}, Attempt ${i + 1} - GP51 authentication failed for user:`, trimmedUsername, 'Error:', errorMsg);
            lastError = new Error(`GP51 authentication failed: ${errorMsg}`);
            continue; // Try next attempt
          }

          // Check for token in response
          const token = result.token || result.session_id || result.sessionId;
          if (!token) {
            console.error(`URL ${urlIndex + 1}, Attempt ${i + 1} - No token received from GP51 for user:`, trimmedUsername, 'Response:', result);
            lastError = new Error('GP51 authentication failed: No token received');
            continue; // Try next attempt
          }

          console.log(`SUCCESS! GP51 authentication successful on URL ${urlIndex + 1}, attempt ${i + 1} for user:`, trimmedUsername, 'Token length:', token.length);
          return { token, username: trimmedUsername, apiUrl: finalApiUrl };

        } catch (error) {
          console.error(`URL ${urlIndex + 1}, Attempt ${i + 1} - GP51 authentication error for user:`, trimmedUsername, error);
          
          if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('NetworkError') || error.message.includes('error sending request'))) {
            lastError = new Error(`Network error connecting to GP51 API at ${finalApiUrl}. Please verify the GP51 API URL is correct and accessible.`);
          } else {
            lastError = error instanceof Error ? error : new Error('Unknown authentication error');
          }
          continue; // Try next attempt
        }
      }
    }
    
    // If we get here, all URLs and attempts failed
    console.error('All GP51 authentication URLs and methods failed for user:', trimmedUsername);
    throw lastError || new Error('All GP51 authentication methods failed. Please check your API URL configuration.');

  } catch (error) {
    console.error('GP51 authentication error for user:', trimmedUsername, error);
    throw error;
  }
}
