
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced rate limiting for production
const rateLimitMap = new Map<string, { count: number; firstAttempt: number }>();
const MAX_ATTEMPTS = 3; // Stricter for production
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const existing = rateLimitMap.get(identifier);

  if (!existing) {
    rateLimitMap.set(identifier, { count: 1, firstAttempt: now });
    return true;
  }

  if (now - existing.firstAttempt > WINDOW_MS) {
    rateLimitMap.set(identifier, { count: 1, firstAttempt: now });
    return true;
  }

  if (existing.count >= MAX_ATTEMPTS) {
    return false;
  }

  existing.count++;
  return true;
}

// Production-ready input validation
function validateProductionInput(input: any, type: string): { isValid: boolean; error?: string } {
  if (!input) {
    return { isValid: false, error: `${type} is required` };
  }

  const inputStr = input.toString();

  // Enhanced SQL injection protection
  const sqlInjectionPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/i,
    /(--|\#|\/\*|\*\/|;)/,
    /(\bOR\b.*=.*\bOR\b)/i,
    /(\bAND\b.*=.*\bAND\b)/i,
    /(\'|\";?|(\b(UNION|JOIN)\b))/i,
    /(\b(SLEEP|WAITFOR|DELAY)\b)/i,
    /(\b(XP_|SP_)\w+)/i
  ];

  for (const pattern of sqlInjectionPatterns) {
    if (pattern.test(inputStr)) {
      return { isValid: false, error: 'Invalid characters detected' };
    }
  }

  // Production-specific validations
  switch (type) {
    case 'deviceid':
      if (inputStr.length < 8 || inputStr.length > 20) {
        return { isValid: false, error: 'Device ID must be 8-20 characters for production deployment' };
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(inputStr)) {
        return { isValid: false, error: 'Device ID contains invalid characters' };
      }
      break;
    
    case 'imei':
      if (!/^\d{15}$/.test(inputStr)) {
        return { isValid: false, error: 'IMEI must be exactly 15 digits' };
      }
      // Luhn algorithm validation
      if (!validateLuhnAlgorithm(inputStr)) {
        return { isValid: false, error: 'Invalid IMEI checksum' };
      }
      break;
    
    case 'token':
      if (inputStr.length < 32) {
        return { isValid: false, error: 'Invalid token format' };
      }
      break;
  }

  return { isValid: true };
}

// Luhn algorithm for IMEI validation
function validateLuhnAlgorithm(imei: string): boolean {
  let sum = 0;
  let alternate = false;
  
  for (let i = imei.length - 1; i >= 0; i--) {
    let digit = parseInt(imei.charAt(i));
    
    if (alternate) {
      digit *= 2;
      if (digit > 9) {
        digit = (digit % 10) + 1;
      }
    }
    
    sum += digit;
    alternate = !alternate;
  }
  
  return (sum % 10) === 0;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { action, ...payload } = await req.json();
    
    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Action is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enhanced rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(clientIP)) {
      console.error(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('GP51 Production Management API call:', action);

    // Production-ready input validation
    if (payload.deviceid) {
      const deviceIdValidation = validateProductionInput(payload.deviceid, 'deviceid');
      if (!deviceIdValidation.isValid) {
        return new Response(
          JSON.stringify({ error: `Device ID validation failed: ${deviceIdValidation.error}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (payload.imei) {
      const imeiValidation = validateProductionInput(payload.imei, 'imei');
      if (!imeiValidation.isValid) {
        return new Response(
          JSON.stringify({ error: `IMEI validation failed: ${imeiValidation.error}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get production-ready GP51 session
    const { data: sessions, error: sessionError } = await supabase
      .from('gp51_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (sessionError || !sessions || sessions.length === 0) {
      console.error('No GP51 sessions found for production:', sessionError);
      return new Response(
        JSON.stringify({ error: 'No GP51 production sessions configured' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const latestSession = sessions[0];
    
    // Enhanced session validation
    const now = new Date();
    const expiresAt = new Date(latestSession.token_expires_at);
    
    if (expiresAt <= now) {
      console.error('GP51 production session expired:', latestSession.username);
      return new Response(
        JSON.stringify({ error: 'GP51 production session expired. Please re-authenticate.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate token format
    const tokenValidation = validateProductionInput(latestSession.gp51_token, 'token');
    if (!tokenValidation.isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid session token format' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = latestSession.gp51_token;

    // Handle production-specific actions
    switch (action) {
      case 'ping_device':
        return await handleDevicePing(payload, token);
      
      case 'check_device_status':
        return await handleDeviceStatusCheck(payload, token);
      
      case 'configure_device':
        return await handleDeviceConfiguration(payload, token);
      
      case 'validate_token':
        return await handleTokenValidation(payload, token);
      
      case 'get_device_health':
        return await handleDeviceHealthCheck(payload, token);
      
      default:
        // Fall back to standard GP51 API for other actions
        return await callStandardGP51API(action, payload, token);
    }

  } catch (error) {
    console.error('GP51 Production Management error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Production device ping with enhanced validation
async function handleDevicePing(payload: any, token: string): Promise<Response> {
  try {
    const { deviceid, timeout = 30000 } = payload;
    
    console.log(`Production device ping: ${deviceid}`);
    
    const GP51_API_BASE = Deno.env.get('GP51_API_BASE_URL') || 'https://www.gps51.com';
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(`${GP51_API_BASE}/webapi?action=ping&token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'EnvioFleet-Production/1.0'
        },
        body: JSON.stringify({ deviceid }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Enhanced response processing for production
      if (result.status === 0) {
        return new Response(
          JSON.stringify({
            status: 0,
            device_status: result.online ? 'online' : 'offline',
            capabilities: result.capabilities || [],
            firmware_version: result.firmware_version,
            last_seen: result.last_seen,
            response_time: Date.now(),
            production_verified: true
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(result),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        return new Response(
          JSON.stringify({
            status: -1,
            cause: 'Device ping timeout',
            device_status: 'timeout',
            production_verified: false
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw error;
    }

  } catch (error) {
    console.error('Device ping error:', error);
    return new Response(
      JSON.stringify({
        status: -1,
        cause: 'Device ping failed',
        error: error.message,
        production_verified: false
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Enhanced device status check
async function handleDeviceStatusCheck(payload: any, token: string): Promise<Response> {
  try {
    const { deviceid } = payload;
    
    const GP51_API_BASE = Deno.env.get('GP51_API_BASE_URL') || 'https://www.gps51.com';
    
    const response = await fetch(`${GP51_API_BASE}/webapi?action=querydevices&token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ deviceids: [deviceid] })
    });

    if (!response.ok) {
      throw new Error(`Status check failed: HTTP ${response.status}`);
    }

    const result = await response.json();
    
    if (result.status === 0 && result.devices && result.devices.length > 0) {
      const device = result.devices[0];
      return new Response(
        JSON.stringify({
          status: 0,
          signal_strength: device.signal_strength || 0,
          last_data_received: device.lastactivetime,
          battery_level: device.battery_level,
          location: device.location,
          production_ready: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Device status check error:', error);
    return new Response(
      JSON.stringify({
        status: -1,
        cause: 'Status check failed',
        error: error.message
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Device configuration for production
async function handleDeviceConfiguration(payload: any, token: string): Promise<Response> {
  try {
    const {
      deviceid,
      server_endpoint,
      reporting_interval,
      security_key,
      operational_mode,
      geofence_settings
    } = payload;

    console.log(`Configuring device ${deviceid} for production`);

    const GP51_API_BASE = Deno.env.get('GP51_API_BASE_URL') || 'https://www.gps51.com';
    
    const configData = {
      deviceid,
      server_ip: server_endpoint,
      report_interval: reporting_interval,
      security_mode: 1,
      encryption_key: security_key,
      mode: operational_mode,
      ...(geofence_settings && { geofences: geofence_settings })
    };

    const response = await fetch(`${GP51_API_BASE}/webapi?action=configdevice&token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(configData)
    });

    if (!response.ok) {
      throw new Error(`Configuration failed: HTTP ${response.status}`);
    }

    const result = await response.json();
    
    if (result.status === 0) {
      return new Response(
        JSON.stringify({
          status: 0,
          configuration_id: `prod_${Date.now()}_${deviceid}`,
          configured_at: new Date().toISOString(),
          production_ready: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Device configuration error:', error);
    return new Response(
      JSON.stringify({
        status: -1,
        cause: 'Configuration failed',
        error: error.message
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Token validation for production
async function handleTokenValidation(payload: any, token: string): Promise<Response> {
  try {
    const GP51_API_BASE = Deno.env.get('GP51_API_BASE_URL') || 'https://www.gps51.com';
    
    const response = await fetch(`${GP51_API_BASE}/webapi?action=validatetoken&token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          status: -1,
          valid: false,
          cause: 'Token validation request failed'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    
    return new Response(
      JSON.stringify({
        status: result.status || 0,
        valid: result.status === 0,
        expires_at: result.expires_at,
        production_validated: true
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Token validation error:', error);
    return new Response(
      JSON.stringify({
        status: -1,
        valid: false,
        error: error.message
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Device health check for production monitoring
async function handleDeviceHealthCheck(payload: any, token: string): Promise<Response> {
  try {
    const { deviceid } = payload;
    
    const GP51_API_BASE = Deno.env.get('GP51_API_BASE_URL') || 'https://www.gps51.com';
    
    const response = await fetch(`${GP51_API_BASE}/webapi?action=devicehealth&token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ deviceid })
    });

    if (!response.ok) {
      throw new Error(`Health check failed: HTTP ${response.status}`);
    }

    const result = await response.json();
    
    if (result.status === 0) {
      return new Response(
        JSON.stringify({
          status: 0,
          signal_strength: result.signal_strength || 0,
          battery_level: result.battery_level,
          last_communication: result.last_communication,
          temperature: result.temperature,
          gps_satellites: result.gps_satellites,
          health_score: result.health_score || 0,
          production_monitored: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Device health check error:', error);
    return new Response(
      JSON.stringify({
        status: -1,
        cause: 'Health check failed',
        error: error.message,
        production_monitored: false
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Standard GP51 API fallback
async function callStandardGP51API(action: string, payload: any, token: string): Promise<Response> {
  try {
    const GP51_API_BASE = Deno.env.get('GP51_API_BASE_URL') || 'https://www.gps51.com';
    
    const response = await fetch(`${GP51_API_BASE}/webapi?action=${action}&token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'EnvioFleet-Production/1.0'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`GP51 API call failed: HTTP ${response.status}`);
    }

    const result = await response.json();
    
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Standard GP51 API call error:', error);
    return new Response(
      JSON.stringify({
        status: -1,
        cause: 'API call failed',
        error: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
