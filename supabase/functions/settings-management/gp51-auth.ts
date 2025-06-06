
import { createHash } from './crypto.ts';

export async function authenticateWithGP51({ username, password }: { username: string; password: string }) {
  console.log('Starting GP51 credential validation for user:', username);
  
  const GP51_API_BASE = Deno.env.get('GP51_API_BASE_URL');
  if (!GP51_API_BASE) {
    throw new Error('GP51_API_BASE_URL environment variable is not configured');
  }
  
  try {
    // Hash the password using MD5
    const hashedPassword = await createHash(password);
    console.log('Password hashed successfully');
    
    console.log('Attempting GP51 authentication with corrected payload...');
    
    // Construct the proper GP51 API URL
    const apiUrl = `${GP51_API_BASE}/webapi?action=login`;
    console.log('Using GP51 API URL:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        username: username,
        password: hashedPassword
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GP51 API request failed:', response.status, errorText);
      throw new Error(`GP51 API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log('GP51 authentication response received');

    if (!result || typeof result !== 'object') {
      throw new Error('Invalid response format from GP51 API');
    }

    if (result.error || !result.token) {
      const errorMsg = result.error || 'No token received from GP51';
      console.error('GP51 authentication failed:', errorMsg);
      throw new Error(`GP51 authentication failed: ${errorMsg}`);
    }

    console.log('GP51 authentication successful for user:', username);
    return result.token;

  } catch (error) {
    console.error('GP51 authentication error:', error);
    
    if (error instanceof TypeError && error.message.includes('Invalid URL')) {
      throw new Error('GP51 API configuration error: Invalid base URL format');
    }
    
    if (error.message.includes('fetch')) {
      throw new Error('Network error connecting to GP51 API');
    }
    
    throw error;
  }
}
