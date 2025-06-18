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
      
      // 🎯 ENHANCED LOGGING: Log raw response details
      console.log('📊 GP51 Raw Response Details:', {
        contentLength: responseText.length,
        contentType: response.headers.get('content-type'),
        statusCode: response.status,
        responsePreview: responseText.substring(0, 200) + (responseText.length > 200 ? '...' : '')
      });
      
      if (!responseText || responseText.trim().length === 0) {
        throw new Error('Empty response from GP51 API');
      }

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseText);
        
        // 🎯 CRITICAL ENHANCED LOGGING: Log the complete parsed response structure
        console.log('🔍 GP51 Complete Parsed Response Structure:');
        console.log(JSON.stringify(parsedResponse, null, 2));
        
        // 🎯 ENHANCED LOGGING: Analyze response structure for debugging
        console.log('📋 GP51 Response Analysis:', {
          hasStatus: 'status' in parsedResponse,
          status: parsedResponse.status,
          hasCause: 'cause' in parsedResponse,
          cause: parsedResponse.cause,
          hasGroups: 'groups' in parsedResponse,
          groupsType: Array.isArray(parsedResponse.groups) ? 'array' : typeof parsedResponse.groups,
          groupsLength: parsedResponse.groups?.length || 0,
          hasRecords: 'records' in parsedResponse,
          recordsType: Array.isArray(parsedResponse.records) ? 'array' : typeof parsedResponse.records,
          recordsLength: parsedResponse.records?.length || 0,
          topLevelKeys: Object.keys(parsedResponse || {})
        });
        
        // 🎯 ENHANCED LOGGING: Detailed groups analysis if present
        if (parsedResponse.groups && Array.isArray(parsedResponse.groups)) {
          console.log('🏷️ GP51 Groups Detailed Analysis:');
          parsedResponse.groups.forEach((group: any, index: number) => {
            console.log(`Group ${index}:`, {
              groupKeys: Object.keys(group || {}),
              hasDevices: 'devices' in group,
              devicesType: Array.isArray(group.devices) ? 'array' : typeof group.devices,
              devicesCount: group.devices?.length || 0,
              groupName: group.groupname || group.name || 'unnamed',
              groupId: group.groupid || group.id || 'no-id'
            });
            
            // Log first few devices if they exist
            if (group.devices && Array.isArray(group.devices) && group.devices.length > 0) {
              console.log(`🚗 Sample devices from group ${index} (showing first 3):`, 
                group.devices.slice(0, 3).map((device: any) => ({
                  deviceKeys: Object.keys(device || {}),
                  deviceid: device.deviceid,
                  devicename: device.devicename,
                  creater: device.creater,
                  devicetype: device.devicetype,
                  isfree: device.isfree
                }))
              );
            }
          });
        }
        
      } catch (parseError) {
        console.error('❌ JSON Parse Error Details:', {
          errorMessage: parseError.message,
          responseLength: responseText.length,
          responseStart: responseText.substring(0, 100),
          responseEnd: responseText.substring(Math.max(0, responseText.length - 100))
        });
        
        // Only throw JSON parse error if response doesn't look like truncated JSON
        if (!responseText.includes('"status":0') && !responseText.includes('"cause":"OK"')) {
          throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
        }
        
        // If it looks like truncated but valid JSON, log warning but don't fail
        console.warn('⚠️ Received truncated JSON response, but appears to be successful GP51 data');
        
        // Try to construct a basic success response for truncated data
        parsedResponse = {
          status: 0,
          cause: "OK",
          records: [], // We'll indicate truncated data
          truncated: true
        };
      }

      // Check for actual GP51 API errors (not successful responses)
      if (parsedResponse.status && parsedResponse.status !== 0) {
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
    console.log('🚀 Enhanced GP51 Live Data Import starting with diagnostic logging...');

    // Use the secure API call with proper action
    const result = await secureGP51ApiCall('lastposition', {
      deviceids: [], // Empty array means all devices
      lastquerypositiontime: ""
    });

    const responseTime = Date.now() - startTime;
    console.log(`✅ GP51 Live Data Import completed successfully in ${responseTime}ms`);

    // Extract and process data with enhanced logging
    const devices = result.groups ? result.groups.flatMap((group: any) => group.devices || []) : [];
    const positions = result.records || [];

    // 🎯 ENHANCED LOGGING: Log processing results
    console.log('📊 GP51 Data Processing Results:', {
      rawGroupsCount: result.groups?.length || 0,
      extractedDevicesCount: devices.length,
      positionsCount: positions.length,
      deviceSample: devices.slice(0, 2) // Show first 2 devices for debugging
    });

    const processedData = {
      success: true,
      total_devices: devices.length,
      total_positions: positions.length,
      fetched_at: new Date().toISOString(),
      response_time_ms: responseTime,
      truncated: result.truncated || false,
      data: {
        devices,
        positions,
        groups: result.groups || []
      }
    };

    // 🎯 ENHANCED LOGGING: Log final processed data structure
    console.log('🎯 Final Processed Data Summary:', {
      success: processedData.success,
      total_devices: processedData.total_devices,
      total_positions: processedData.total_positions,
      has_groups: !!processedData.data.groups.length,
      response_time: processedData.response_time_ms
    });

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
