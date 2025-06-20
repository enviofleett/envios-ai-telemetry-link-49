
import { md5_for_gp51_only, sanitizeInput, isValidUsername } from '../_shared/crypto_utils.ts';

function constructGP51ApiUrl(baseUrl: string, endpoint: string = '/webapi'): string {
  console.log(`🔧 [URL] Starting URL construction with base: "${baseUrl}", endpoint: "${endpoint}"`);
  
  let cleanBaseUrl = baseUrl;
  
  // Ensure protocol is present
  if (!cleanBaseUrl.startsWith('http://') && !cleanBaseUrl.startsWith('https://')) {
    cleanBaseUrl = 'https://' + cleanBaseUrl;
    console.log(`🔧 [URL] Added protocol: "${cleanBaseUrl}"`);
  }
  
  // Remove trailing slash from base URL
  if (cleanBaseUrl.endsWith('/')) {
    cleanBaseUrl = cleanBaseUrl.slice(0, -1);
    console.log(`🔧 [URL] Removed trailing slash: "${cleanBaseUrl}"`);
  }
  
  // Check if base URL already contains the endpoint path
  if (cleanBaseUrl.includes('/webapi')) {
    console.log(`🔧 [URL] Base URL already contains /webapi, using as-is: "${cleanBaseUrl}"`);
    return cleanBaseUrl;
  }
  
  // Construct final URL
  const finalUrl = cleanBaseUrl + endpoint;
  console.log(`🔧 [URL] Final constructed URL: "${finalUrl}"`);
  
  return finalUrl;
}

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
  console.log('🔐 [GP51-AUTH] Starting GP51 credential validation for user:', trimmedUsername);
  
  if (!isValidUsername(trimmedUsername)) {
    console.error('❌ [GP51-AUTH] Invalid username format:', trimmedUsername);
    return {
      success: false,
      error: 'Invalid username format',
      username: trimmedUsername
    };
  }
  
  try {
    // Get environment variables with enhanced fallback support
    const rawBaseUrl = apiUrl || 
                      Deno.env.get('GP51_API_BASE_URL') || 
                      Deno.env.get('GP51_BASE_URL') || 
                      'https://www.gps51.com';
    const globalApiToken = Deno.env.get('GP51_GLOBAL_API_TOKEN');
    
    console.log('🌐 [GP51-AUTH] Environment check:');
    console.log(`  - Raw Base URL: ${rawBaseUrl}`);
    console.log(`  - Global token: ${globalApiToken ? 'SET' : 'NOT SET'}`);
    
    if (!globalApiToken) {
      console.error('❌ [GP51-AUTH] GP51_GLOBAL_API_TOKEN not configured');
      return {
        success: false,
        error: 'GP51 API configuration missing',
        username: trimmedUsername
      };
    }
    
    console.log('🔄 [GP51-AUTH] Generating MD5 hash for password');
    const gp51Hash = await md5_for_gp51_only(password);
    console.log(`🔐 [GP51-AUTH] Password hashed successfully (${gp51Hash.substring(0, 8)}...)`);
    
    // Construct GP51 API URL with enhanced logic
    const baseApiUrl = constructGP51ApiUrl(rawBaseUrl);
    
    const loginUrl = new URL(baseApiUrl);
    loginUrl.searchParams.set('action', 'login');
    loginUrl.searchParams.set('token', globalApiToken);
    loginUrl.searchParams.set('username', trimmedUsername);
    loginUrl.searchParams.set('password', gp51Hash);
    loginUrl.searchParams.set('from', 'web');
    loginUrl.searchParams.set('type', 'user');
    
    const redactedUrl = loginUrl.toString().replace(globalApiToken, '[REDACTED]');
    console.log('🌐 [GP51-AUTH] Making request to GP51 API:', redactedUrl);
    
    const loginResponse = await fetch(loginUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'text/plain',
        'User-Agent': 'FleetIQ/1.0'
      },
      signal: AbortSignal.timeout(15000)
    });

    console.log(`📊 [GP51-AUTH] Response status: ${loginResponse.status} ${loginResponse.statusText}`);

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.error(`❌ [GP51-AUTH] GP51 API returned HTTP ${loginResponse.status}: ${loginResponse.statusText}`);
      console.error(`❌ [GP51-AUTH] Error response: ${errorText.substring(0, 200)}`);
      return {
        success: false,
        error: `GP51 API error: ${loginResponse.status} ${loginResponse.statusText}`,
        username: trimmedUsername,
        details: errorText.substring(0, 200)
      };
    }

    const loginResult = await loginResponse.text();
    console.log(`📊 [GP51-AUTH] Response received, length: ${loginResult.length}`);
    console.log(`📊 [GP51-AUTH] Response preview: ${loginResult.substring(0, 100)}`);

    // Enhanced response validation
    const trimmedResult = loginResult.trim();
    const isValidResponse = trimmedResult.length >= 10 && 
                           !trimmedResult.toLowerCase().includes('error') && 
                           !trimmedResult.toLowerCase().includes('fail') && 
                           !trimmedResult.toLowerCase().includes('invalid') &&
                           !trimmedResult.toLowerCase().includes('denied');

    if (!isValidResponse) {
      console.error('❌ [GP51-AUTH] GP51 authentication failed:', trimmedResult.substring(0, 100));
      return {
        success: false,
        error: 'Invalid GP51 credentials',
        username: trimmedUsername,
        details: trimmedResult.substring(0, 100)
      };
    }

    const sessionToken = trimmedResult;
    console.log(`✅ [GP51-AUTH] GP51 authentication successful for ${trimmedUsername}`);
    console.log(`✅ [GP51-AUTH] Session token length: ${sessionToken.length}`);
    
    return {
      success: true,
      token: sessionToken,
      username: trimmedUsername,
      password: password,
      hashedPassword: gp51Hash,
      apiUrl: baseApiUrl,
      method: 'ENHANCED_GP51_API'
    };

  } catch (error) {
    console.error('❌ [GP51-AUTH] GP51 authentication failed:', error);
    
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
      username: trimmedUsername,
      details: error instanceof Error ? error.stack : 'Unknown error'
    };
  }
}
