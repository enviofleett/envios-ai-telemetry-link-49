
import { md5_for_gp51_only, sanitizeInput, isValidUsername } from '../_shared/crypto_utils.ts';

export async function authenticateWithGP51({ 
  username, 
  password, 
  apiUrl 
}: { 
  username: string; 
  password: string; 
  apiUrl?: string;
}) {
  const trimmedUsername = sanitizeInput(username);
  console.log('🔐 Starting GP51 credential validation for user:', trimmedUsername);
  
  if (!isValidUsername(trimmedUsername)) {
    return {
      success: false,
      error: 'Invalid username format',
      username: trimmedUsername
    };
  }
  
  try {
    // Get environment variables
    const gp51BaseUrl = apiUrl || Deno.env.get('GP51_API_BASE_URL') || 'https://www.gps51.com';
    const globalApiToken = Deno.env.get('GP51_GLOBAL_API_TOKEN');
    
    if (!globalApiToken) {
      console.error('❌ GP51_GLOBAL_API_TOKEN not configured');
      return {
        success: false,
        error: 'GP51 API configuration missing',
        username: trimmedUsername
      };
    }
    
    console.log('🌐 Using GP51 API URL:', gp51BaseUrl);
    console.log('🔄 Attempting login with improved GP51 integration...');
    
    // Hash password using async MD5 for GP51 compatibility
    const gp51Hash = await md5_for_gp51_only(password);
    
    // Construct GP51 API URL with correct query parameters
    const loginUrl = new URL(`${gp51BaseUrl}/webapi`);
    loginUrl.searchParams.set('action', 'login');
    loginUrl.searchParams.set('token', globalApiToken);
    loginUrl.searchParams.set('username', trimmedUsername);
    loginUrl.searchParams.set('password', gp51Hash);
    loginUrl.searchParams.set('from', 'web');
    loginUrl.searchParams.set('type', 'user');
    
    console.log('🌐 Making request to GP51 API...');
    
    const loginResponse = await fetch(loginUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'text/plain',
        'User-Agent': 'FleetIQ/1.0'
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!loginResponse.ok) {
      console.error(`❌ GP51 API returned HTTP ${loginResponse.status}: ${loginResponse.statusText}`);
      return {
        success: false,
        error: `GP51 API error: ${loginResponse.status} ${loginResponse.statusText}`,
        username: trimmedUsername
      };
    }

    const loginResult = await loginResponse.text();
    console.log('📊 GP51 Response received, length:', loginResult.length);

    // Check for authentication failure indicators
    if (loginResult.includes('error') || loginResult.includes('fail') || loginResult.includes('invalid') || loginResult.length < 10) {
      console.error('❌ GP51 authentication failed:', loginResult.substring(0, 100));
      return {
        success: false,
        error: 'Invalid GP51 credentials',
        username: trimmedUsername
      };
    }

    const sessionToken = loginResult.trim();
    console.log(`✅ GP51 authentication successful for ${trimmedUsername}`);
    
    return {
      success: true,
      token: sessionToken,
      username: trimmedUsername,
      password: password,
      hashedPassword: gp51Hash,
      apiUrl: gp51BaseUrl,
      method: 'IMPROVED_GP51_API'
    };

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
