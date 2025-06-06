
import { createHash } from './crypto.ts';

export async function authenticateWithGP51({ username, password }: { username: string; password: string }) {
  // Trim whitespace from username to ensure clean storage
  const trimmedUsername = username.trim();
  console.log('Starting GP51 credential validation for user:', trimmedUsername);
  
  // Get and validate GP51 API base URL
  let GP51_API_BASE = Deno.env.get('GP51_API_BASE_URL');
  
  if (!GP51_API_BASE) {
    console.error('GP51_API_BASE_URL environment variable is not configured');
    throw new Error('GP51_API_BASE_URL environment variable is not configured. Please set it in Supabase secrets (e.g., https://www.gps51.com).');
  }

  // Clean up the URL - remove /webapi if present and ensure proper protocol
  GP51_API_BASE = GP51_API_BASE.replace(/\/webapi\/?$/, ''); // Remove trailing /webapi
  
  // Add protocol if missing
  if (!GP51_API_BASE.startsWith('http://') && !GP51_API_BASE.startsWith('https://')) {
    GP51_API_BASE = 'https://' + GP51_API_BASE;
  }
  
  console.log('Using cleaned GP51 API base URL:', GP51_API_BASE);
  
  // Validate that GP51_API_BASE is a proper URL
  let baseUrl: URL;
  try {
    baseUrl = new URL(GP51_API_BASE);
    if (!baseUrl.protocol.startsWith('http')) {
      throw new Error('GP51_API_BASE_URL must be a valid HTTP/HTTPS URL');
    }
  } catch (error) {
    console.error('Invalid GP51_API_BASE_URL format:', GP51_API_BASE);
    throw new Error(`GP51_API_BASE_URL is not a valid URL format. Expected format: https://www.gps51.com but got: ${GP51_API_BASE}`);
  }
  
  try {
    // Hash the password
    const hashedPassword = await createHash(password);
    console.log('Password hashed successfully for user:', trimmedUsername);
    
    console.log('Attempting GP51 authentication...');
    
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
      },
      // Attempt 4: With additional fields
      {
        action: 'login',
        username: trimmedUsername,
        password: hashedPassword,
        from: 'WEB',
        type: 'USER'
      },
      // Attempt 5: Authentication action
      {
        action: 'authenticate',
        username: trimmedUsername,
        password: hashedPassword
      }
    ];
    
    // Construct the API URL correctly
    const apiUrl = `${GP51_API_BASE}/webapi`;
    console.log('Using GP51 API URL:', apiUrl);
    
    let lastError: Error | null = null;
    
    // Try each authentication method
    for (let i = 0; i < authenticationAttempts.length; i++) {
      const loginPayload = authenticationAttempts[i];
      console.log(`Authentication attempt ${i + 1}:`, { ...loginPayload, password: '[REDACTED]' });
      
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Fleet-Management-System/1.0'
          },
          body: JSON.stringify(loginPayload)
        });

        console.log(`Attempt ${i + 1} - GP51 API response status:`, response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Attempt ${i + 1} - GP51 API request failed:`, response.status, errorText);
          lastError = new Error(`GP51 API error (${response.status}): ${errorText || 'Unknown error'}`);
          continue; // Try next attempt
        }

        // Get response text first to check if it's empty
        const responseText = await response.text();
        console.log(`Attempt ${i + 1} - GP51 API response body length:`, responseText.length);
        console.log(`Attempt ${i + 1} - GP51 API response preview:`, responseText.substring(0, 200));
        
        if (!responseText || responseText.trim().length === 0) {
          console.error(`Attempt ${i + 1} - Empty response from GP51 API`);
          lastError = new Error('GP51 API returned an empty response');
          continue; // Try next attempt
        }

        // Try to parse JSON
        let result;
        try {
          result = JSON.parse(responseText);
          console.log(`Attempt ${i + 1} - GP51 authentication response parsed successfully`);
          console.log(`Attempt ${i + 1} - GP51 response structure:`, { 
            status: result.status, 
            hasToken: !!result.token,
            hasSessionId: !!result.session_id,
            keys: Object.keys(result)
          });
        } catch (parseError) {
          console.error(`Attempt ${i + 1} - Failed to parse GP51 response as JSON:`, parseError);
          lastError = new Error('GP51 API returned invalid JSON response');
          continue; // Try next attempt
        }

        if (!result || typeof result !== 'object') {
          console.error(`Attempt ${i + 1} - Invalid response format from GP51 API:`, result);
          lastError = new Error('Invalid response format from GP51 API');
          continue; // Try next attempt
        }

        // Check for GP51 specific success/error format
        // GP51 typically returns status: 0 for success, non-zero for errors
        if (result.status !== undefined && result.status !== 0) {
          const errorMsg = result.cause || result.message || result.error || 'Authentication failed';
          console.error(`Attempt ${i + 1} - GP51 authentication failed for user:`, trimmedUsername, 'Error:', errorMsg);
          lastError = new Error(`GP51 authentication failed: ${errorMsg}`);
          continue; // Try next attempt
        }

        // Check for token in response - GP51 might return it as 'token' or 'session_id'
        const token = result.token || result.session_id || result.sessionId;
        if (!token) {
          console.error(`Attempt ${i + 1} - No token received from GP51 for user:`, trimmedUsername, 'Response:', result);
          lastError = new Error('GP51 authentication failed: No token received');
          continue; // Try next attempt
        }

        console.log(`SUCCESS! GP51 authentication successful on attempt ${i + 1} for user:`, trimmedUsername, 'Token length:', token.length);
        return { token, username: trimmedUsername };

      } catch (error) {
        console.error(`Attempt ${i + 1} - GP51 authentication error for user:`, trimmedUsername, error);
        lastError = error instanceof Error ? error : new Error('Unknown authentication error');
        continue; // Try next attempt
      }
    }
    
    // If we get here, all attempts failed
    console.error('All GP51 authentication attempts failed for user:', trimmedUsername);
    throw lastError || new Error('All GP51 authentication methods failed');

  } catch (error) {
    console.error('GP51 authentication error for user:', trimmedUsername, error);
    
    if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('NetworkError') || error.message.includes('error sending request'))) {
      throw new Error(`Network error connecting to GP51 API at ${GP51_API_BASE}. Please verify the GP51_API_BASE_URL is correct and the GP51 server is accessible.`);
    }
    
    if (error.message.includes('Invalid URL') || error.message.includes('not a valid URL format')) {
      throw new Error(`GP51 API configuration error: The GP51_API_BASE_URL is incorrectly configured. Current value: ${GP51_API_BASE}. Please check your Supabase secrets and ensure GP51_API_BASE_URL is set to a valid URL like https://www.gps51.com`);
    }
    
    throw error;
  }
}
