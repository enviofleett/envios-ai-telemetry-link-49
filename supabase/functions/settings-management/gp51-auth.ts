
import { md5_for_gp51_only } from '../_shared/crypto_utils.ts';

export interface GP51AuthResult {
  success: boolean;
  token?: string;
  username?: string;
  apiUrl?: string;
  error?: string;
  method?: string;
}

export async function authenticateWithGP51(credentials: {
  username: string;
  password: string;
  apiUrl?: string;
}): Promise<GP51AuthResult> {
  const { username, password, apiUrl = 'https://www.gps51.com' } = credentials;
  
  console.log(`🔐 [GP51-AUTH] Starting GP51 credential validation for user: ${username}`);
  
  try {
    // Environment check
    const globalToken = Deno.env.get('GP51_GLOBAL_API_TOKEN');
    console.log(`🌐 [GP51-AUTH] Environment check:`);
    console.log(`  - Raw Base URL: ${apiUrl}`);
    console.log(`  - Global token: ${globalToken ? 'SET (length: ' + globalToken.length + ')' : 'NOT SET'}`);
    
    // Generate MD5 hash for password
    console.log(`🔄 [GP51-AUTH] Generating MD5 hash for password`);
    const hashedPassword = await md5_for_gp51_only(password);
    console.log(`🔐 [GP51-AUTH] Password hashed successfully (${hashedPassword.substring(0, 8)}...)`);
    
    // Construct the API URL with query parameters
    const baseUrl = apiUrl.replace(/\/webapi\/?$/, '');
    const apiEndpoint = `${baseUrl}/webapi`;
    
    console.log(`🔧 [URL] Starting URL construction with base: "${baseUrl}", endpoint: "/webapi"`);
    
    const url = new URL(apiEndpoint);
    url.searchParams.set('action', 'login');
    
    if (globalToken) {
      url.searchParams.set('token', globalToken);
    }
    
    console.log(`🔧 [URL] Final constructed URL: "${apiEndpoint}"`);
    
    // Prepare request body with credentials
    const requestBody = {
      username: username.trim(),
      password: hashedPassword,
      from: 'web',
      type: 'user'
    };
    
    console.log(`🔄 [GP51-AUTH] Step 4: Making HTTP request to GP51 API`);
    console.log(`📡 [HTTP] Request details:`);
    console.log(`  - Method: POST`);
    console.log(`  - URL: ${url.toString()}`);
    console.log(`  - Headers: Content-Type=application/json, Accept=text/plain, User-Agent=FleetIQ/1.0`);
    console.log(`  - Body: ${JSON.stringify({ ...requestBody, password: '[REDACTED]' })}`);
    console.log(`  - Timeout: 15000ms`);
    
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/plain',
        'User-Agent': 'FleetIQ/1.0'
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(15000)
    });
    
    console.log(`📊 [HTTP] GP51 Response received:`);
    console.log(`  - Status: ${response.status} ${response.statusText}`);
    console.log(`  - Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);
    console.log(`  - Content-Type: ${response.headers.get('content-type')}`);
    
    const responseText = await response.text();
    console.log(`📊 [HTTP] Response body length: ${responseText.length}`);
    
    console.log(`🔄 [GP51-AUTH] Step 5: Validating GP51 response`);
    
    if (!response.ok) {
      throw new Error(`GP51 API Error: ${response.status} - ${responseText}`);
    }
    
    if (!responseText || responseText.trim().length === 0) {
      console.error(`❌ [GP51-AUTH] GP51 API returned ${response.status} OK but with an empty response body. Expected a token.`);
      console.error(`📋 [DIAGNOSTIC] This suggests:`);
      console.error(`  1. Invalid credentials (username/password)`);
      console.error(`  2. Invalid or expired Global API Token`);
      console.error(`  3. Incorrect request parameters (from/type)`);
      console.error(`  4. GP51 API behavior change`);
      console.error(`🧪 [CURL_TEST] Test with this curl command:`);
      console.error(`curl -X POST "${url.toString()}" -H "Content-Type: application/json" -H "Accept: text/plain" -H "User-Agent: FleetIQ/1.0" -d '${JSON.stringify(requestBody)}' -v`);
      
      throw new Error('GP51 authentication failed: Empty response received. Check credentials or API behavior.');
    }
    
    // Try to parse as JSON first, fallback to treating as plain text token
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log(`📋 [GP51-AUTH] Parsed JSON response:`, responseData);
      
      if (responseData.status === 0 && responseData.token) {
        console.log(`✅ [GP51-AUTH] Authentication successful via JSON response`);
        return {
          success: true,
          token: responseData.token,
          username,
          apiUrl: apiEndpoint,
          method: 'POST_JSON'
        };
      } else {
        const errorMsg = responseData.cause || responseData.message || `Authentication failed with status ${responseData.status}`;
        console.error(`❌ [GP51-AUTH] Authentication failed:`, errorMsg);
        return {
          success: false,
          error: errorMsg
        };
      }
    } catch (parseError) {
      // Treat as plain text token
      const token = responseText.trim();
      if (token && token.length > 0 && !token.includes('error') && !token.includes('fail')) {
        console.log(`✅ [GP51-AUTH] Authentication successful via plain text token`);
        return {
          success: true,
          token,
          username,
          apiUrl: apiEndpoint,
          method: 'POST_TEXT'
        };
      } else {
        console.error(`❌ [GP51-AUTH] Invalid token response:`, token);
        return {
          success: false,
          error: `Invalid authentication response: ${token}`
        };
      }
    }
    
  } catch (error) {
    console.error(`❌ [GP51-AUTH] Authentication request failed:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error during authentication'
    };
  }
}
