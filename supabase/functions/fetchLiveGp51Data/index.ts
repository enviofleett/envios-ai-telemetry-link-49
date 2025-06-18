import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GP51Error {
  type: 'network' | 'authentication' | 'api' | 'data' | 'rate_limit' | 'timeout';
  severity: 'low' | 'medium' | 'high' | 'critical';
  code?: string;
  message: string;
  userMessage: string;
  recoverable: boolean;
  retryAfter?: number;
  suggestedAction?: string;
}

function classifyError(error: any, context?: string): GP51Error {
  // Network errors
  if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
    return {
      type: 'network',
      severity: 'high',
      message: error.message || 'Network connection failed',
      userMessage: 'Unable to connect to GP51 servers. Please check your internet connection.',
      recoverable: true,
      retryAfter: 5000,
      suggestedAction: 'Check internet connection and try again'
    };
  }

  // Authentication errors
  if (error.message?.includes('token') || error.message?.includes('auth') || error.message?.includes('login')) {
    return {
      type: 'authentication',
      severity: 'high',
      message: error.message,
      userMessage: 'Authentication failed. Please re-authenticate with GP51.',
      recoverable: true,
      suggestedAction: 'Go to Admin Settings and re-authenticate GP51 credentials'
    };
  }

  // GP51 API specific errors
  if (error.message?.includes('global_error_action action not found')) {
    return {
      type: 'api',
      severity: 'critical',
      code: 'INVALID_ACTION',
      message: 'Invalid GP51 API action',
      userMessage: 'GP51 API configuration error. Please contact support.',
      recoverable: false,
      suggestedAction: 'Contact technical support'
    };
  }

  // Rate limiting
  if (error.message?.includes('rate limit') || error.status === 429) {
    return {
      type: 'rate_limit',
      severity: 'medium',
      message: 'API rate limit exceeded',
      userMessage: 'Too many requests. Please wait a moment before trying again.',
      recoverable: true,
      retryAfter: 30000,
      suggestedAction: 'Wait 30 seconds and try again'
    };
  }

  // Timeout errors
  if (error.name === 'AbortError' || error.message?.includes('timeout')) {
    return {
      type: 'timeout',
      severity: 'medium',
      message: 'Request timeout',
      userMessage: 'Request took too long. The GP51 servers may be slow.',
      recoverable: true,
      retryAfter: 10000,
      suggestedAction: 'Try again in a few moments'
    };
  }

  // Data parsing errors
  if (error.name === 'SyntaxError' && error.message?.includes('JSON')) {
    return {
      type: 'data',
      severity: 'medium',
      message: 'Invalid response format from GP51',
      userMessage: 'Received invalid data from GP51. This may be a temporary issue.',
      recoverable: true,
      retryAfter: 5000,
      suggestedAction: 'Try again in a few moments'
    };
  }

  // Generic fallback
  return {
    type: 'api',
    severity: 'medium',
    message: error.message || 'Unknown error occurred',
    userMessage: 'An unexpected error occurred. Please try again.',
    recoverable: true,
    retryAfter: 5000,
    suggestedAction: 'Try again or contact support if the issue persists'
  };
}

async function secureGP51ApiCall(action: string, params: Record<string, any> = {}, maxRetries = 3): Promise<any> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Get secure token (without logging the actual token)
  const { data: sessions, error: sessionError } = await supabase
    .from('gp51_sessions')
    .select('gp51_token, username, token_expires_at')
    .order('created_at', { ascending: false })
    .limit(1);

  if (sessionError || !sessions || sessions.length === 0) {
    throw new Error('No GP51 session found');
  }

  const session = sessions[0];
  const expiresAt = new Date(session.token_expires_at);
  
  if (expiresAt <= new Date()) {
    throw new Error('GP51 session expired');
  }

  // Log token status securely (without exposing the token)
  console.log('🔐 GP51 API Call Authentication:', {
    username: session.username,
    hasToken: !!session.gp51_token,
    tokenLength: session.gp51_token?.length || 0,
    expiresAt: expiresAt.toISOString(),
    action: action
  });

  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const apiUrl = 'https://www.gps51.com/webapi';
      const url = `${apiUrl}?action=${action}&token=${encodeURIComponent(session.gp51_token)}&username=${encodeURIComponent(session.username)}`;

      console.log(`📡 GP51 API Call Attempt ${attempt + 1}/${maxRetries + 1}:`, { action, hasParams: Object.keys(params).length > 0 });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'EnvioFleet/1.0'
        },
        body: JSON.stringify(params),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      
      if (!responseText || responseText.trim().length === 0) {
        throw new Error('Empty response from GP51 API');
      }

      // Check for non-JSON error responses
      if (responseText.includes('action not found') || responseText.includes('error')) {
        throw new Error(`GP51 API Error: ${responseText.substring(0, 200)}`);
      }

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
      }

      if (parsedResponse.status !== 0) {
        throw new Error(`GP51 API Error ${parsedResponse.status}: ${parsedResponse.cause}`);
      }

      console.log(`✅ GP51 API call successful on attempt ${attempt + 1}`);
      return parsedResponse;

    } catch (error) {
      lastError = error;
      const classifiedError = classifyError(error, action);
      
      console.error(`❌ GP51 API call failed (attempt ${attempt + 1}):`, {
        error: classifiedError.message,
        type: classifiedError.type,
        recoverable: classifiedError.recoverable
      });

      // Don't retry if it's not recoverable or we've reached max retries
      if (!classifiedError.recoverable || attempt >= maxRetries) {
        break;
      }

      // Wait before retry
      if (classifiedError.retryAfter && attempt < maxRetries) {
        console.log(`⏳ Waiting ${classifiedError.retryAfter}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, classifiedError.retryAfter));
      }
    }
  }

  throw lastError || new Error('GP51 API call failed after all retries');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    console.log('🚀 Enhanced GP51 Live Data Import starting...');

    // Use the secure API call with proper action
    const result = await secureGP51ApiCall('lastposition', {
      deviceids: [], // Empty array means all devices
      lastquerypositiontime: ""
    });

    const responseTime = Date.now() - startTime;
    console.log(`✅ GP51 Live Data Import completed successfully in ${responseTime}ms`);

    // Extract and process data
    const devices = result.groups ? result.groups.flatMap((group: any) => group.devices || []) : [];
    const positions = result.records || [];

    const processedData = {
      success: true,
      total_devices: devices.length,
      total_positions: positions.length,
      fetched_at: new Date().toISOString(),
      response_time_ms: responseTime,
      data: {
        devices,
        positions,
        groups: result.groups || []
      }
    };

    return new Response(JSON.stringify(processedData), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    const classifiedError = classifyError(error);
    
    console.error('❌ GP51 Live Data Import failed:', {
      error: classifiedError.message,
      type: classifiedError.type,
      userMessage: classifiedError.userMessage,
      responseTime
    });

    return new Response(JSON.stringify({
      success: false,
      error: classifiedError.userMessage,
      details: classifiedError.message,
      type: classifiedError.type,
      code: classifiedError.code,
      suggested_action: classifiedError.suggestedAction,
      response_time_ms: responseTime,
      timestamp: new Date().toISOString()
    }), {
      status: classifiedError.type === 'authentication' ? 401 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
