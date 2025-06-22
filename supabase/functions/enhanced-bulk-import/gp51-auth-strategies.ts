
export interface GP51AuthResult {
  success: boolean;
  token?: string;
  error?: string;
  method?: string;
  details?: any;
}

export interface GP51AuthStrategy {
  name: string;
  execute: (username: string, hashedPassword: string, baseUrl: string, globalToken?: string) => Promise<GP51AuthResult>;
}

// Strategy 1: POST with JSON body (Primary - matches working pattern)
export const postJsonStrategy: GP51AuthStrategy = {
  name: 'POST_JSON',
  execute: async (username: string, hashedPassword: string, baseUrl: string, globalToken?: string) => {
    const url = new URL(`${baseUrl}/webapi`);
    
    // Only add global token to URL if available
    if (globalToken) {
      url.searchParams.set('token', globalToken);
    }

    // Authentication parameters go in the JSON body (matching working pattern)
    const requestBody = {
      username: username.trim(),
      password: hashedPassword,
      from: 'WEB',     // Uppercase as per working pattern
      type: 'USER'     // Uppercase as per working pattern
    };

    console.log(`🔄 [POST_JSON] Requesting: ${url.toString()}`);
    console.log(`📤 [POST_JSON] Request body:`, JSON.stringify({ ...requestBody, password: '[REDACTED]' }));

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/plain, application/json',
        'User-Agent': 'FleetIQ/1.0'
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(15000)
    });

    return await processResponse(response, 'POST_JSON');
  }
};

// Strategy 2: POST with form-encoded body (Alternative)
export const postFormStrategy: GP51AuthStrategy = {
  name: 'POST_FORM',
  execute: async (username: string, hashedPassword: string, baseUrl: string, globalToken?: string) => {
    const url = new URL(`${baseUrl}/webapi`);
    
    // Only add global token to URL if available
    if (globalToken) {
      url.searchParams.set('token', globalToken);
    }

    // Authentication parameters in form data
    const formData = new URLSearchParams();
    formData.set('username', username.trim());
    formData.set('password', hashedPassword);
    formData.set('from', 'WEB');
    formData.set('type', 'USER');

    console.log(`🔄 [POST_FORM] Requesting: ${url.toString()}`);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'text/plain, application/json',
        'User-Agent': 'FleetIQ/1.0'
      },
      body: formData.toString(),
      signal: AbortSignal.timeout(15000)
    });

    return await processResponse(response, 'POST_FORM');
  }
};

// Strategy 3: Mobile-optimized POST (for future mobile app support)
export const mobilePostStrategy: GP51AuthStrategy = {
  name: 'MOBILE_POST',
  execute: async (username: string, hashedPassword: string, baseUrl: string, globalToken?: string) => {
    const url = new URL(`${baseUrl}/webapi`);
    
    // Only add global token to URL if available
    if (globalToken) {
      url.searchParams.set('token', globalToken);
    }

    // Mobile-specific authentication parameters
    const requestBody = {
      username: username.trim(),
      password: hashedPassword,
      from: 'MOBILE',  // Mobile identifier
      type: 'USER'
    };

    console.log(`🔄 [MOBILE_POST] Requesting: ${url.toString()}`);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/plain, application/json',
        'User-Agent': 'FleetIQ-Mobile/1.0',
        'X-Platform': 'mobile'
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(15000)
    });

    return await processResponse(response, 'MOBILE_POST');
  }
};

async function processResponse(response: Response, method: string): Promise<GP51AuthResult> {
  console.log(`📊 [${method}] Response Status: ${response.status} ${response.statusText}`);
  console.log(`📊 [${method}] Response Headers:`, Object.fromEntries(response.headers.entries()));
  
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unable to read error response');
    console.error(`❌ [${method}] Non-OK response: ${response.status} - ${errorText}`);
    return {
      success: false,
      error: `HTTP ${response.status}: ${response.statusText}`,
      method,
      details: { statusCode: response.status, errorText }
    };
  }

  const responseText = await response.text();
  console.log(`📋 [${method}] Response Body Length: ${responseText.length}`);
  console.log(`📋 [${method}] Response Body (first 200 chars): ${responseText.substring(0, 200)}`);

  if (!responseText || responseText.trim().length === 0) {
    console.error(`❌ [${method}] Empty response received`);
    return {
      success: false,
      error: 'Empty response received from GP51 API',
      method,
      details: { 
        responseLength: responseText.length,
        headers: Object.fromEntries(response.headers.entries())
      }
    };
  }

  // Try to parse as JSON first
  try {
    const jsonResponse = JSON.parse(responseText);
    console.log(`✅ [${method}] Parsed JSON response:`, jsonResponse);
    
    if (jsonResponse.status === 0 && jsonResponse.token) {
      return {
        success: true,
        token: jsonResponse.token,
        method,
        details: jsonResponse
      };
    } else {
      return {
        success: false,
        error: jsonResponse.cause || jsonResponse.message || `Authentication failed with status ${jsonResponse.status}`,
        method,
        details: jsonResponse
      };
    }
  } catch (parseError) {
    // Treat as plain text token
    const token = responseText.trim();
    if (token && !token.includes('error') && !token.includes('fail') && !token.includes('<html')) {
      console.log(`✅ [${method}] Plain text token received`);
      return {
        success: true,
        token,
        method,
        details: { responseText }
      };
    } else {
      console.error(`❌ [${method}] Invalid response format:`, responseText.substring(0, 100));
      return {
        success: false,
        error: `Invalid response format: ${responseText.substring(0, 100)}`,
        method,
        details: { responseText, parseError: parseError.message }
      };
    }
  }
}

// Export strategies in order of preference (JSON first as it matches working pattern)
export const authStrategies = [
  postJsonStrategy,
  postFormStrategy,
  mobilePostStrategy
];
