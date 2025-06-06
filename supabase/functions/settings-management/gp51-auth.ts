
import { createHash } from './crypto.ts';

export async function authenticateWithGP51({ username, password }: { username: string; password: string }) {
  console.log('Starting GP51 credential validation for user:', username);
  
  const GP51_API_BASE = Deno.env.get('GP51_API_BASE_URL');
  if (!GP51_API_BASE) {
    console.error('GP51_API_BASE_URL environment variable is not configured');
    throw new Error('GP51_API_BASE_URL environment variable is not configured');
  }
  
  // Validate that GP51_API_BASE is a proper URL
  let baseUrl: URL;
  try {
    baseUrl = new URL(GP51_API_BASE);
    if (!baseUrl.protocol.startsWith('http')) {
      throw new Error('GP51_API_BASE_URL must be a valid HTTP/HTTPS URL');
    }
  } catch (error) {
    console.error('Invalid GP51_API_BASE_URL format:', GP51_API_BASE);
    throw new Error(`GP51_API_BASE_URL is not a valid URL format. Expected format: https://api.gps51.com but got: ${GP51_API_BASE}`);
  }
  
  try {
    // Hash the password
    const hashedPassword = await createHash(password);
    console.log('Password hashed successfully');
    
    console.log('Attempting GP51 authentication...');
    
    // Construct the proper GP51 API URL using GET method with query parameters
    const params = new URLSearchParams({
      action: 'login',
      username: username,
      password: hashedPassword,
      from: 'WEB',
      type: 'USER'
    });
    
    const apiUrl = `${GP51_API_BASE}/webapi?${params.toString()}`;
    console.log('Using GP51 API URL:', apiUrl.replace(hashedPassword, '[REDACTED]'));
    
    console.log('Sending authentication request to GP51...');
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Fleet-Management-System/1.0'
      }
    });

    console.log('GP51 API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GP51 API request failed:', response.status, errorText);
      throw new Error(`GP51 API error (${response.status}): ${errorText}`);
    }

    // Get response text first to check if it's empty
    const responseText = await response.text();
    console.log('GP51 API response body length:', responseText.length);
    
    if (!responseText || responseText.trim().length === 0) {
      console.error('Empty response from GP51 API');
      throw new Error('GP51 API returned an empty response');
    }

    // Try to parse JSON
    let result;
    try {
      result = JSON.parse(responseText);
      console.log('GP51 authentication response parsed successfully');
    } catch (parseError) {
      console.error('Failed to parse GP51 response as JSON:', parseError);
      console.error('Response text:', responseText);
      throw new Error('GP51 API returned invalid JSON response');
    }

    if (!result || typeof result !== 'object') {
      console.error('Invalid response format from GP51 API:', result);
      throw new Error('Invalid response format from GP51 API');
    }

    // Check for GP51 specific success/error format
    // GP51 typically returns status: 0 for success, non-zero for errors
    if (result.status !== undefined && result.status !== 0) {
      const errorMsg = result.cause || result.message || result.error || 'Authentication failed';
      console.error('GP51 authentication failed:', errorMsg);
      throw new Error(`GP51 authentication failed: ${errorMsg}`);
    }

    // Check for token in response - GP51 might return it as 'token' or 'session_id'
    const token = result.token || result.session_id || result.sessionId;
    if (!token) {
      console.error('No token received from GP51:', result);
      throw new Error('GP51 authentication failed: No token received');
    }

    console.log('GP51 authentication successful for user:', username);
    return token;

  } catch (error) {
    console.error('GP51 authentication error:', error);
    
    if (error instanceof TypeError && error.message.includes('Invalid URL')) {
      throw new Error(`GP51 API configuration error: The GP51_API_BASE_URL is incorrectly configured. Please check your Supabase secrets and ensure GP51_API_BASE_URL is set to a valid URL like https://api.gps51.com`);
    }
    
    if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
      throw new Error('Network error connecting to GP51 API. Please check your internet connection and GP51 server status.');
    }
    
    throw error;
  }
}
