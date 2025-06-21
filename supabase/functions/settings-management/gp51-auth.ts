
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
    // Enhanced environment variables validation
    const rawBaseUrl = apiUrl || 
                      Deno.env.get('GP51_API_BASE_URL') || 
                      Deno.env.get('GP51_BASE_URL') || 
                      'https://www.gps51.com';
    const globalApiToken = Deno.env.get('GP51_GLOBAL_API_TOKEN');
    
    console.log('🌐 [GP51-AUTH] Environment check:');
    console.log(`  - Raw Base URL: ${rawBaseUrl}`);
    console.log(`  - Global token: ${globalApiToken ? 'SET (length: ' + globalApiToken.length + ')' : 'NOT SET'}`);
    
    if (!globalApiToken) {
      console.error('❌ [GP51-AUTH] GP51_GLOBAL_API_TOKEN not configured');
      return {
        success: false,
        error: 'GP51 API configuration missing - Global API Token not set',
        code: 'MISSING_GLOBAL_TOKEN',
        username: trimmedUsername
      };
    }

    // Validate global token format (basic check)
    if (globalApiToken.length < 10) {
      console.error('❌ [GP51-AUTH] GP51_GLOBAL_API_TOKEN appears to be invalid (too short)');
      return {
        success: false,
        error: 'GP51 Global API Token appears to be invalid',
        code: 'INVALID_GLOBAL_TOKEN',
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
    
    const redactedUrl = loginUrl.toString().replace(globalApiToken, '[REDACTED_TOKEN]');
    console.log('📡 [HTTP] Request details:');
    console.log('  - Method: GET');
    console.log('  - URL:', redactedUrl);
    console.log('  - Headers: Accept=text/plain, User-Agent=FleetIQ/1.0');
    console.log('  - Timeout: 15000ms');
    
    console.log('🔄 [GP51-AUTH] Step 4: Making HTTP request to GP51 API');
    
    const loginResponse = await fetch(loginUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'text/plain',
        'User-Agent': 'FleetIQ/1.0'
      },
      signal: AbortSignal.timeout(15000)
    });

    console.log('📊 [HTTP] GP51 Response received:');
    console.log('  - Status:', loginResponse.status, loginResponse.statusText);
    
    const responseHeaders = Object.fromEntries(loginResponse.headers.entries());
    console.log('  - Headers:', JSON.stringify(responseHeaders));
    
    const contentType = loginResponse.headers.get('content-type');
    console.log('  - Content-Type:', contentType || 'null');

    // CRITICAL: Handle empty response body explicitly
    const contentLength = loginResponse.headers.get('content-length');
    console.log('📊 [HTTP] Response body length:', contentLength || 'not specified');
    
    console.log('🔄 [GP51-AUTH] Step 5: Validating GP51 response');

    if (loginResponse.status === 200 && contentLength === '0') {
      console.error('❌ [GP51-AUTH] GP51 API returned 200 OK but with an empty response body. Expected a token.');
      console.error('📋 [DIAGNOSTIC] This suggests:');
      console.error('  1. Invalid credentials (username/password)');
      console.error('  2. Invalid or expired Global API Token');
      console.error('  3. Incorrect request parameters (from/type)');
      console.error('  4. GP51 API behavior change');
      
      // Provide curl command for manual testing
      const curlCommand = `curl -X GET "${redactedUrl.replace('[REDACTED_TOKEN]', 'YOUR_GP51_GLOBAL_API_TOKEN')}" -H "Accept: text/plain" -H "User-Agent: FleetIQ/1.0" -v`;
      console.error('🧪 [CURL_TEST] Test with this curl command:');
      console.error(curlCommand);
      
      return {
        success: false,
        error: 'GP51 authentication failed: Empty response received. Check credentials or API behavior.',
        code: '200_EMPTY_BODY',
        username: trimmedUsername,
        diagnostics: {
          contentLength: contentLength,
          status: loginResponse.status,
          headers: responseHeaders,
          curlTest: curlCommand
        }
      };
    }

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.error(`❌ [GP51-AUTH] GP51 API returned HTTP ${loginResponse.status}: ${loginResponse.statusText}`);
      console.error(`❌ [GP51-AUTH] Error response: ${errorText.substring(0, 200)}`);
      return {
        success: false,
        error: `GP51 API error: ${loginResponse.status} ${loginResponse.statusText}`,
        code: `HTTP_${loginResponse.status}`,
        username: trimmedUsername,
        details: errorText.substring(0, 200)
      };
    }

    let loginResult: string;
    try {
      loginResult = await loginResponse.text();
      console.log(`📊 [HTTP] Response preview: ${loginResult.substring(0, 100)}`);
    } catch (textError) {
      console.error('❌ [GP51-AUTH] Failed to read response text:', textError);
      return {
        success: false,
        error: 'Failed to read GP51 API response',
        code: 'RESPONSE_READ_ERROR',
        username: trimmedUsername,
        details: textError instanceof Error ? textError.message : 'Unknown error'
      };
    }

    console.log(`📊 [GP51-AUTH] Response received, length: ${loginResult.length}`);

    // Enhanced response validation
    const trimmedResult = loginResult.trim();
    
    // Check for empty response
    if (trimmedResult.length === 0) {
      console.error('❌ [GP51-AUTH] GP51 authentication failed: Completely empty response body');
      return {
        success: false,
        error: 'GP51 authentication failed: Empty response body',
        code: 'EMPTY_RESPONSE_BODY',
        username: trimmedUsername
      };
    }

    // Check for common error indicators
    const lowerResult = trimmedResult.toLowerCase();
    const hasError = lowerResult.includes('error') || 
                    lowerResult.includes('fail') || 
                    lowerResult.includes('invalid') ||
                    lowerResult.includes('denied') ||
                    lowerResult.includes('unauthorized');

    const isValidResponse = trimmedResult.length >= 10 && !hasError;

    if (!isValidResponse) {
      console.error('❌ [GP51-AUTH] GP51 authentication failed:', trimmedResult.substring(0, 100));
      return {
        success: false,
        error: 'Invalid GP51 credentials or authentication failed',
        code: 'INVALID_CREDENTIALS',
        username: trimmedUsername,
        details: trimmedResult.substring(0, 100)
      };
    }

    const sessionToken = trimmedResult;
    console.log(`✅ [GP51-AUTH] GP51 authentication successful for ${trimmedUsername}`);
    console.log(`✅ [GP51-AUTH] Session token received (length: ${sessionToken.length})`);
    
    return {
      success: true,
      token: sessionToken,
      username: trimmedUsername,
      password: password,
      hashedPassword: gp51Hash,
      apiUrl: baseApiUrl,
      method: 'ENHANCED_GP51_API',
      diagnostics: {
        responseLength: sessionToken.length,
        contentType: contentType,
        headers: responseHeaders
      }
    };

  } catch (error) {
    console.error('❌ [GP51-AUTH] GP51 authentication failed:', error);
    
    // Enhanced error handling
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'GP51 connection timed out after 15 seconds. Please try again.',
          code: 'TIMEOUT_ERROR',
          username: trimmedUsername
        };
      }
      
      if (error.message.includes('fetch')) {
        return {
          success: false,
          error: 'Network error connecting to GP51 API. Please check your internet connection.',
          code: 'NETWORK_ERROR',
          username: trimmedUsername,
          details: error.message
        };
      }
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown authentication error',
      code: 'UNKNOWN_ERROR',
      username: trimmedUsername,
      details: error instanceof Error ? error.stack : 'Unknown error'
    };
  }
}
