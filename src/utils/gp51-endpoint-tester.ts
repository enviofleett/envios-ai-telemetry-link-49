
/**
 * GP51 Endpoint Testing Utility
 * This utility helps test the new GP51 API endpoint structure with different request patterns
 */

export interface EndpointTestResult {
  endpoint: string;
  method: 'GET' | 'POST';
  isReachable: boolean;
  responseStatus?: number;
  responseData?: any;
  responseHeaders?: Record<string, string>;
  contentLength?: number;
  error?: string;
  testType: 'connectivity' | 'authentication';
  requestFormat?: string;
}

export class GP51EndpointTester {
  private testEndpoints = [
    // New API endpoint patterns
    { url: 'https://api.gps51.com', name: 'New API Base' },
    { url: 'https://api.gps51.com/webapi', name: 'New API with /webapi' },
    { url: 'https://api.gps51.com/', name: 'New API with trailing slash' },
    // Legacy endpoint for comparison
    { url: 'https://www.gps51.com/webapi', name: 'Legacy API' }
  ];

  async testConnectivity(): Promise<EndpointTestResult[]> {
    const results: EndpointTestResult[] = [];
    
    for (const endpoint of this.testEndpoints) {
      try {
        console.log(`🔍 Testing connectivity to: ${endpoint.url}`);
        
        const response = await fetch(endpoint.url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'EnvioFleet-Test/1.0'
          },
          signal: AbortSignal.timeout(10000)
        });

        // Extract response headers
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        const contentLength = parseInt(responseHeaders['content-length'] || '0');
        let responseData: any = null;

        try {
          const responseText = await response.text();
          if (responseText) {
            try {
              responseData = JSON.parse(responseText);
            } catch {
              responseData = responseText;
            }
          }
        } catch (readError) {
          console.warn(`Could not read response body from ${endpoint.url}:`, readError);
        }

        results.push({
          endpoint: `${endpoint.url} (${endpoint.name})`,
          method: 'GET',
          isReachable: true,
          responseStatus: response.status,
          responseData,
          responseHeaders,
          contentLength,
          testType: 'connectivity'
        });
        
      } catch (error) {
        console.error(`❌ Connectivity test failed for ${endpoint.url}:`, error);
        results.push({
          endpoint: `${endpoint.url} (${endpoint.name})`,
          method: 'GET',
          isReachable: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          testType: 'connectivity'
        });
      }
    }
    
    return results;
  }

  async testAuthentication(username: string, password: string): Promise<EndpointTestResult[]> {
    const results: EndpointTestResult[] = [];
    
    // Test different authentication patterns
    const authPatterns = [
      // Pattern 1: POST with JSON body (modern API style)
      {
        url: 'https://api.gps51.com',
        method: 'POST' as const,
        format: 'POST JSON body',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          username,
          password,
          from: 'WEB',
          type: 'USER'
        })
      },
      // Pattern 2: POST with action in URL, data in JSON body
      {
        url: 'https://api.gps51.com?action=login',
        method: 'POST' as const,
        format: 'POST action in URL, JSON body',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          from: 'WEB',
          type: 'USER'
        })
      },
      // Pattern 3: GET with all parameters in URL (legacy style)
      {
        url: `https://api.gps51.com?action=login&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&from=WEB&type=USER`,
        method: 'GET' as const,
        format: 'GET with query parameters',
        headers: { 'Accept': 'application/json' }
      },
      // Pattern 4: POST with /webapi suffix
      {
        url: 'https://api.gps51.com/webapi?action=login',
        method: 'POST' as const,
        format: 'POST /webapi action in URL, JSON body',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          from: 'WEB',
          type: 'USER'
        })
      }
    ];

    for (const pattern of authPatterns) {
      try {
        console.log(`🔐 Testing authentication: ${pattern.format} - ${pattern.url}`);
        
        const requestOptions: RequestInit = {
          method: pattern.method,
          headers: {
            'User-Agent': 'EnvioFleet-Test/1.0',
            ...pattern.headers
          },
          signal: AbortSignal.timeout(15000)
        };

        if (pattern.body) {
          requestOptions.body = pattern.body;
        }

        const response = await fetch(pattern.url, requestOptions);

        // Extract response headers
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        const contentLength = parseInt(responseHeaders['content-length'] || '0');
        let responseData: any = null;
        let parseError: string | undefined;

        try {
          const responseText = await response.text();
          if (responseText) {
            try {
              responseData = JSON.parse(responseText);
            } catch {
              responseData = responseText;
            }
          } else if (contentLength === 0) {
            parseError = 'Empty response body (content-length: 0)';
          }
        } catch (readError) {
          parseError = `Could not read response: ${readError}`;
        }

        results.push({
          endpoint: pattern.url,
          method: pattern.method,
          isReachable: response.ok,
          responseStatus: response.status,
          responseData,
          responseHeaders,
          contentLength,
          testType: 'authentication',
          requestFormat: pattern.format,
          error: parseError || (!response.ok ? `HTTP ${response.status}` : undefined)
        });
        
      } catch (authError) {
        results.push({
          endpoint: pattern.url,
          method: pattern.method,
          isReachable: false,
          error: authError instanceof Error ? authError.message : 'Authentication test failed',
          testType: 'authentication',
          requestFormat: pattern.format
        });
      }
    }
    
    return results;
  }

  generateCurlCommands(username: string = 'USERNAME', password: string = 'PASSWORD'): string[] {
    return [
      '# Test new API endpoint connectivity',
      'curl -v "https://api.gps51.com/" -H "Accept: application/json"',
      '',
      '# Pattern 1: POST with JSON body (modern API style)',
      'curl -X POST "https://api.gps51.com" \\',
      '  -H "Content-Type: application/json" \\',
      '  -H "Accept: application/json" \\',
      `  -d '{"action":"login","username":"${username}","password":"${password}","from":"WEB","type":"USER"}'`,
      '',
      '# Pattern 2: POST with action in URL, data in JSON body',
      'curl -X POST "https://api.gps51.com?action=login" \\',
      '  -H "Content-Type: application/json" \\',
      `  -d '{"username":"${username}","password":"${password}","from":"WEB","type":"USER"}'`,
      '',
      '# Pattern 3: GET with query parameters (legacy style)',
      `curl -v "https://api.gps51.com?action=login&username=${username}&password=${password}&from=WEB&type=USER" \\`,
      '  -H "Accept: application/json"',
      '',
      '# Pattern 4: POST with /webapi suffix',
      'curl -X POST "https://api.gps51.com/webapi?action=login" \\',
      '  -H "Content-Type: application/json" \\',
      `  -d '{"username":"${username}","password":"${password}","from":"WEB","type":"USER"}'`
    ];
  }
}

export const gp51EndpointTester = new GP51EndpointTester();
