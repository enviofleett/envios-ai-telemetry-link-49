
import { getGP51ApiUrl } from "./constants.ts";
import type { GP51Session } from "./gp51_session_utils.ts";

export interface GP51ApiClientConfig {
  defaultTimeout: number;
  maxRetries: number;
  retryDelay: number;
  largeDatasetTimeout: number;
}

const DEFAULT_CONFIG: GP51ApiClientConfig = {
  defaultTimeout: 30000, // 30 seconds for normal operations
  maxRetries: 3,
  retryDelay: 2000, // 2 seconds base delay
  largeDatasetTimeout: 120000, // 2 minutes for large datasets like querydevicestree
};

export class GP51ApiClientUnified {
  private config: GP51ApiClientConfig;

  constructor(config: Partial<GP51ApiClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private getTimeoutForAction(action: string): number {
    // Use longer timeout for operations that fetch large datasets
    const largeDatasetActions = ['querydevicestree', 'querymonitorlist', 'queryalldevices'];
    return largeDatasetActions.includes(action.toLowerCase()) 
      ? this.config.largeDatasetTimeout 
      : this.config.defaultTimeout;
  }

  private async makeApiCallWithRetry<T>(
    url: string, 
    action: string,
    attempt: number = 1
  ): Promise<T> {
    const timeout = this.getTimeoutForAction(action);
    const controller = new AbortController();
    
    // Progressive timeout: increase timeout on retries
    const adjustedTimeout = timeout + (attempt - 1) * 30000; // Add 30s per retry
    const timeoutId = setTimeout(() => controller.abort(), adjustedTimeout);

    try {
      console.log(`📡 [GP51-UNIFIED] Attempt ${attempt}/${this.config.maxRetries + 1} for ${action} (timeout: ${adjustedTimeout}ms)`);
      console.log(`📡 [GP51-UNIFIED] Request URL: ${url.replace(/token=[^&]+/, 'token=[TOKEN_MASKED]')}`);

      const startTime = Date.now();
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'EnvioFleet-GP51/1.0'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      
      console.log(`📡 [GP51-UNIFIED] Response received in ${responseTime}ms (status: ${response.status})`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [GP51-UNIFIED] HTTP ${response.status}: ${errorText}`);
        
        // Retry on server errors (5xx) but not client errors (4xx)
        if (response.status >= 500 && attempt <= this.config.maxRetries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`⏳ [GP51-UNIFIED] Retrying ${action} in ${delay}ms due to server error`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.makeApiCallWithRetry<T>(url, action, attempt + 1);
        }
        
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }

      const responseText = await response.text();
      console.log(`📊 [GP51-UNIFIED] Response size: ${responseText.length} characters`);

      if (!responseText || responseText.trim().length === 0) {
        console.warn(`⚠️ [GP51-UNIFIED] Empty response for ${action}`);
        return null as T;
      }

      let jsonResponse;
      try {
        jsonResponse = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`❌ [GP51-UNIFIED] JSON parse error for ${action}:`, parseError);
        console.error(`❌ [GP51-UNIFIED] Raw response: ${responseText.substring(0, 500)}...`);
        throw new Error(`Invalid JSON response: ${parseError.message}`);
      }

      // Log response structure for debugging
      console.log(`📋 [GP51-UNIFIED] Response structure:`, {
        status: jsonResponse.status,
        hasData: !!jsonResponse.data,
        dataType: Array.isArray(jsonResponse.data) ? 'array' : typeof jsonResponse.data,
        dataLength: Array.isArray(jsonResponse.data) ? jsonResponse.data.length : 'N/A'
      });

      if (jsonResponse.status !== 0) {
        const errorMsg = jsonResponse.cause || jsonResponse.message || 'Unknown GP51 API error';
        console.error(`❌ [GP51-UNIFIED] GP51 API error ${jsonResponse.status}: ${errorMsg}`);
        
        // Retry on certain GP51 errors
        if (attempt <= this.config.maxRetries && this.shouldRetryOnError(jsonResponse.status)) {
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
          console.log(`⏳ [GP51-UNIFIED] Retrying ${action} in ${delay}ms due to GP51 error`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.makeApiCallWithRetry<T>(url, action, attempt + 1);
        }
        
        throw new Error(`GP51 API Error ${jsonResponse.status}: ${errorMsg}`);
      }

      console.log(`✅ [GP51-UNIFIED] ${action} completed successfully in ${responseTime}ms`);
      return jsonResponse as T;

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        console.error(`❌ [GP51-UNIFIED] ${action} timed out after ${adjustedTimeout}ms`);
        
        // Retry timeouts with increased timeout
        if (attempt <= this.config.maxRetries) {
          const delay = this.config.retryDelay * attempt;
          console.log(`⏳ [GP51-UNIFIED] Retrying ${action} in ${delay}ms with extended timeout`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.makeApiCallWithRetry<T>(url, action, attempt + 1);
        }
        
        throw new Error(`Request timeout after ${adjustedTimeout}ms (attempt ${attempt})`);
      }

      console.error(`❌ [GP51-UNIFIED] ${action} failed after ${Date.now() - (Date.now())}ms:`, error);
      
      // Retry on network errors
      if (attempt <= this.config.maxRetries && this.isRetryableError(error)) {
        const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
        console.log(`⏳ [GP51-UNIFIED] Retrying ${action} in ${delay}ms due to network error`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeApiCallWithRetry<T>(url, action, attempt + 1);
      }

      throw error;
    }
  }

  private shouldRetryOnError(status: number): boolean {
    // Retry on temporary server errors but not authentication/authorization errors
    return status >= 500 || status === 429; // 5xx server errors or rate limiting
  }

  private isRetryableError(error: any): boolean {
    // Retry on network errors but not parsing errors
    return error.name === 'TypeError' && error.message.includes('fetch');
  }

  async queryDevicesTree(token: string, username: string): Promise<any> {
    console.log(`🌳 [GP51-UNIFIED] Starting querydevicestree for user: ${username}`);
    
    const apiUrl = getGP51ApiUrl();
    const url = new URL(apiUrl);
    url.searchParams.set('action', 'querydevicestree');
    url.searchParams.set('token', token);
    url.searchParams.set('extend', 'self');
    url.searchParams.set('serverid', '0');

    console.log(`📡 [GP51-UNIFIED] Parameters: extend=self, serverid=0`);

    return this.makeApiCallWithRetry(url.toString(), 'querydevicestree');
  }

  async getLastPosition(token: string, deviceIds: string[] = [], lastQueryTime?: string): Promise<any> {
    console.log(`📍 [GP51-UNIFIED] Getting last position for ${deviceIds.length} devices`);
    
    const apiUrl = getGP51ApiUrl();
    const url = new URL(apiUrl);
    url.searchParams.set('action', 'lastposition');
    url.searchParams.set('token', token);
    
    if (deviceIds.length > 0) {
      url.searchParams.set('deviceids', deviceIds.join(','));
    }
    
    if (lastQueryTime) {
      url.searchParams.set('lastquerypositiontime', lastQueryTime);
    }

    return this.makeApiCallWithRetry(url.toString(), 'lastposition');
  }

  async callAction(action: string, parameters: Record<string, any>): Promise<any> {
    console.log(`🔄 [GP51-UNIFIED] Generic action call: ${action}`);
    
    const apiUrl = getGP51ApiUrl();
    const url = new URL(apiUrl);
    url.searchParams.set('action', action);
    
    Object.entries(parameters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });

    return this.makeApiCallWithRetry(url.toString(), action);
  }
}

// Export singleton instance with default config
export const gp51ApiClient = new GP51ApiClientUnified();

// Export factory function for custom configurations
export function createGP51ApiClient(config: Partial<GP51ApiClientConfig>): GP51ApiClientUnified {
  return new GP51ApiClientUnified(config);
}
