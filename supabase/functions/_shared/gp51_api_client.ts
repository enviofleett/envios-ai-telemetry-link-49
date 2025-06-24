
// Updated to use the new unified client with proper token handling
import { gp51ApiClient } from "./gp51_api_client_unified.ts";
import type { GP51Session } from "./gp51_session_utils.ts";

export interface FetchGP51Options {
  action: string;
  session: GP51Session;
  additionalParams?: Record<string, any>;
}

export interface FetchGP51Response {
  data?: any;
  error?: string;
  status?: number;
  gp51_error?: any;
  raw?: string;
}

export async function fetchFromGP51(
  options: FetchGP51Options,
  retryJsonParse: boolean = false
): Promise<FetchGP51Response> {
  const { action, session, additionalParams = {} } = options;

  if (!session.gp51_token) {
    console.error("❌ GP51 session is missing a token.");
    return { error: 'GP51 session is invalid (missing token)', status: 401 };
  }
  
  try {
    console.log(`📡 [GP51-CLIENT] Using unified client for action: ${action}`);
    
    let result;
    
    // Use specific methods for known actions, fallback to generic for others
    switch (action) {
      case 'querymonitorlist':
      case 'getmonitorlist': // Legacy support
        console.log('🔄 [GP51-CLIENT] Using queryMonitorList method');
        result = await gp51ApiClient.queryMonitorList(session.gp51_token, session.username);
        break;
      case 'lastposition':
        console.log('🔄 [GP51-CLIENT] Using getLastPosition method');
        // Handle device IDs from additionalParams
        const deviceIds = additionalParams.deviceids ? 
          (Array.isArray(additionalParams.deviceids) ? additionalParams.deviceids : [additionalParams.deviceids]) :
          [];
        result = await gp51ApiClient.getLastPosition(
          session.gp51_token, 
          deviceIds, 
          additionalParams.lastquerypositiontime
        );
        break;
      default:
        console.log(`🔄 [GP51-CLIENT] Using generic callAction for: ${action}`);
        // For other actions, prepare parameters with token
        const parameters: Record<string, any> = {
          token: session.gp51_token,
          username: session.username,
          ...additionalParams
        };
        result = await gp51ApiClient.callAction(action, parameters);
        break;
    }

    console.log(`✅ [GP51-CLIENT] Successfully fetched data for action: ${action}`);
    return { data: result, status: 200 };
    
  } catch (error) {
    console.error(`❌ [GP51-CLIENT] Unified client error for ${action}:`, error);
    
    const errorMessage = error instanceof Error ? error.message : `${action} failed`;
    
    // Check if it's a timeout error
    if (error.name === 'AbortError') {
      return { error: 'Request timeout', status: 408 };
    }
    
    // Check if it's a network error
    if (errorMessage.includes('HTTP error')) {
      const statusMatch = errorMessage.match(/HTTP error: (\d+)/);
      const status = statusMatch ? parseInt(statusMatch[1]) : 502;
      return { error: errorMessage, status };
    }
    
    // Check if it's a token validation error
    if (errorMessage.includes('Token') || errorMessage.includes('token')) {
      return { error: `Token validation failed: ${errorMessage}`, status: 401 };
    }
    
    return { 
      error: errorMessage, 
      status: 400,
      gp51_error: { cause: errorMessage }
    };
  }
}
