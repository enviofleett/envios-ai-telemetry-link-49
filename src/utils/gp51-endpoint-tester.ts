
/**
 * GP51 Endpoint Testing Utility
 * This utility helps test the new GP51 API endpoint structure
 */

export interface EndpointTestResult {
  endpoint: string;
  isReachable: boolean;
  responseStatus?: number;
  responseData?: any;
  error?: string;
  testType: 'connectivity' | 'authentication';
}

export class GP51EndpointTester {
  private testEndpoints = [
    'https://api.gps51.com/',
    'https://api.gps51.com/webapi',
    'https://www.gps51.com/webapi' // Keep old for comparison
  ];

  async testConnectivity(): Promise<EndpointTestResult[]> {
    const results: EndpointTestResult[] = [];
    
    for (const endpoint of this.testEndpoints) {
      try {
        console.log(`🔍 Testing connectivity to: ${endpoint}`);
        
        // Simple connectivity test - try to reach the endpoint
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'EnvioFleet-Test/1.0'
          },
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });

        results.push({
          endpoint,
          isReachable: true,
          responseStatus: response.status,
          responseData: response.status < 400 ? await response.text().catch(() => 'Unable to parse response') : null,
          testType: 'connectivity'
        });
        
      } catch (error) {
        console.error(`❌ Connectivity test failed for ${endpoint}:`, error);
        results.push({
          endpoint,
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
    
    // Test authentication on endpoints that passed connectivity
    const authEndpoints = [
      'https://api.gps51.com/webapi',
      'https://api.gps51.com/',
    ];

    for (const baseEndpoint of authEndpoints) {
      try {
        console.log(`🔐 Testing authentication on: ${baseEndpoint}`);
        
        // Construct login URL - try both patterns
        const loginUrls = [
          `${baseEndpoint}?action=login&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&from=WEB&type=USER`,
          `${baseEndpoint}/Login` // Alternative pattern
        ];

        for (const loginUrl of loginUrls) {
          try {
            const response = await fetch(loginUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'User-Agent': 'EnvioFleet-Test/1.0'
              },
              body: new URLSearchParams({
                username,
                password,
                from: 'WEB',
                type: 'USER'
              }),
              signal: AbortSignal.timeout(15000)
            });

            const responseText = await response.text();
            
            results.push({
              endpoint: loginUrl,
              isReachable: response.ok,
              responseStatus: response.status,
              responseData: responseText,
              testType: 'authentication',
              error: response.ok ? undefined : `HTTP ${response.status}: ${responseText}`
            });
            
            // If we get a successful response, break the inner loop
            if (response.ok && !responseText.includes('error')) {
              break;
            }
            
          } catch (authError) {
            results.push({
              endpoint: loginUrl,
              isReachable: false,
              error: authError instanceof Error ? authError.message : 'Authentication test failed',
              testType: 'authentication'
            });
          }
        }
        
      } catch (error) {
        console.error(`❌ Authentication test failed for ${baseEndpoint}:`, error);
        results.push({
          endpoint: baseEndpoint,
          isReachable: false,
          error: error instanceof Error ? error.message : 'Unknown authentication error',
          testType: 'authentication'
        });
      }
    }
    
    return results;
  }

  generateCurlCommands(): string[] {
    return [
      '# Test new API endpoint connectivity',
      'curl -v "https://api.gps51.com/" -H "Accept: application/json"',
      '',
      '# Test new API with webapi path',
      'curl -v "https://api.gps51.com/webapi" -H "Accept: application/json"',
      '',
      '# Test authentication on new endpoint (replace USERNAME and PASSWORD)',
      'curl -X POST "https://api.gps51.com/webapi?action=login&username=USERNAME&password=PASSWORD&from=WEB&type=USER" \\',
      '  -H "Content-Type: application/x-www-form-urlencoded" \\',
      '  -H "Accept: application/json"',
      '',
      '# Alternative authentication endpoint test',
      'curl -X POST "https://api.gps51.com/Login" \\',
      '  -H "Content-Type: application/x-www-form-urlencoded" \\',
      '  -d "username=USERNAME&password=PASSWORD&from=WEB&type=USER"'
    ];
  }
}

export const gp51EndpointTester = new GP51EndpointTester();
