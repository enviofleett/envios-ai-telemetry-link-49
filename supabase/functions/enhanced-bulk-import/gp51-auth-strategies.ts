
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

// Strategy 1: GET request with query parameters (most common for web APIs)
export const getQueryStrategy: GP51AuthStrategy = {
  name: 'GET_QUERY',
  execute: async (username: string, hashedPassword: string, baseUrl: string, globalToken?: string) => {
    const url = new URL(`${baseUrl}/webapi`);
    url.searchParams.set('action', 'login');
    url.searchParams.set('username', username);
    url.searchParams.set('password', hashedPassword);
    url.searchParams.set('from', 'WEB');
    url.searchParams.set('type', 'USER');
    
    if (globalToken) {
      url.searchParams.set('token', globalToken);
    }

    console.log(`🔄 [GET_QUERY] Requesting: ${url.toString().replace(hashedPassword, '[REDACTED]')}`);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'text/plain, application/json',
        'User-Agent': 'FleetIQ/1.0'
      },
      signal: AbortSignal.timeout(15000)
    });

    return await processResponse(response, 'GET_QUERY');
  }
};

// Strategy 2: POST with form-encoded body
export const postFormStrategy: GP51AuthStrategy = {
  name: 'POST_FORM',
  execute: async (username: string, hashedPassword: string, baseUrl: string, globalToken?: string) => {
    const url = new URL(`${baseUrl}/webapi`);
    
    if (globalToken) {
      url.searchParams.set('token', globalToken);
    }

    const formData = new URLSearchParams();
    formData.set('action', 'login');
    formData.set('username', username);
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

// Strategy 3: POST with JSON body
export const postJsonStrategy: GP51AuthStrategy = {
  name: 'POST_JSON',
  execute: async (username: string, hashedPassword: string, baseUrl: string, globalToken?: string) => {
    const url = new URL(`${baseUrl}/webapi`);
    
    if (globalToken) {
      url.searchParams.set('token', globalToken);
    }

    const requestBody = {
      action: 'login',
      username,
      password: hashedPassword,
      from: 'WEB',
      type: 'USER'
    };

    console.log(`🔄 [POST_JSON] Requesting: ${url.toString()}`);

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

export const authStrategies = [
  getQueryStrategy,
  postFormStrategy,
  postJsonStrategy
];
