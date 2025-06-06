
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation function with GP51 device-specific validation
function validateDeviceInput(input: any, type: string): { isValid: boolean; error?: string } {
  if (!input) {
    return { isValid: false, error: `${type} is required` };
  }

  if (typeof input !== 'string' && typeof input !== 'number') {
    return { isValid: false, error: `${type} must be a string or number` };
  }

  const inputStr = input.toString();

  // SQL injection protection
  const sqlInjectionPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(--|\#|\/\*|\*\/)/,
    /(\bOR\b.*=.*\bOR\b)/i,
    /(\bAND\b.*=.*\bAND\b)/i,
    /(\'|\";?|(\b(UNION|JOIN)\b))/i
  ];

  for (const pattern of sqlInjectionPatterns) {
    if (pattern.test(inputStr)) {
      return { isValid: false, error: 'Invalid characters detected' };
    }
  }

  // GP51-specific validations
  switch (type) {
    case 'deviceid':
      if (inputStr.length < 8 || inputStr.length > 15) {
        return { isValid: false, error: 'Device ID must be 8-15 characters for GP51 compatibility' };
      }
      if (!/^[a-zA-Z0-9]+$/.test(inputStr)) {
        return { isValid: false, error: 'Device ID can only contain alphanumeric characters' };
      }
      break;
    
    case 'imei':
      if (!/^\d{15}$/.test(inputStr)) {
        return { isValid: false, error: 'IMEI must be exactly 15 digits' };
      }
      break;
    
    case 'devicetype':
      const deviceType = parseInt(inputStr);
      if (isNaN(deviceType) || deviceType < 1 || deviceType > 10) {
        return { isValid: false, error: 'Device type must be between 1 and 10' };
      }
      break;
  }

  return { isValid: true };
}

// Rate limiting
const rateLimitMap = new Map<string, { count: number; firstAttempt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

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

    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('GP51 Device Management API call:', action);

    // Enhanced input validation for device operations
    if (action === 'adddevice' || action === 'editdevice') {
      // Validate required device parameters
      if (payload.deviceid) {
        const deviceIdValidation = validateDeviceInput(payload.deviceid, 'deviceid');
        if (!deviceIdValidation.isValid) {
          return new Response(
            JSON.stringify({ error: `Invalid device ID: ${deviceIdValidation.error}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      if (payload.devicetype) {
        const deviceTypeValidation = validateDeviceInput(payload.devicetype, 'devicetype');
        if (!deviceTypeValidation.isValid) {
          return new Response(
            JSON.stringify({ error: `Invalid device type: ${deviceTypeValidation.error}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      if (payload.imei) {
        const imeiValidation = validateDeviceInput(payload.imei, 'imei');
        if (!imeiValidation.isValid) {
          return new Response(
            JSON.stringify({ error: `Invalid IMEI: ${imeiValidation.error}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // GP51 Protocol compliance - ensure mandatory parameters
      if (action === 'adddevice') {
        if (!payload.deviceid || !payload.devicename || payload.devicetype === undefined) {
          return new Response(
            JSON.stringify({ error: 'Missing mandatory parameters: deviceid, devicename, and devicetype are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Get admin credentials for GP51 API calls
    const { data: adminSession, error: sessionError } = await supabase
      .from('gp51_sessions')
      .select('*')
      .eq('username', 'admin')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessionError) {
      console.error('Session query error:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Database error occurred' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!adminSession) {
      return new Response(
        JSON.stringify({ error: 'Admin GP51 session not found' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if admin token is still valid
    if (new Date(adminSession.token_expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Admin GP51 session expired' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = adminSession.gp51_token;

    console.log('Calling GP51 API with action:', action);

    // Call GP51 API with enhanced security headers
    const GP51_API_BASE = Deno.env.get('GP51_API_BASE_URL') || 'https://www.gps51.com';
    const gp51Response = await fetch(`${GP51_API_BASE}/webapi?action=${encodeURIComponent(action)}&token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'SecureFleetManagement/1.0'
      },
      body: JSON.stringify(payload),
    });

    if (!gp51Response.ok) {
      console.error('GP51 API request failed:', gp51Response.status);
      return new Response(
        JSON.stringify({ error: 'GP51 API request failed', status: gp51Response.status }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await gp51Response.json();
    console.log('GP51 API response status:', result.status);

    // Log successful device operations for audit trail
    if (result.status === 0 && (action === 'adddevice' || action === 'editdevice' || action === 'deletedevice')) {
      console.log(`GP51 device operation successful: ${action} for device ${payload.deviceid || 'unknown'}`);
    }

    // Update session timestamp
    await supabase
      .from('gp51_sessions')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('id', adminSession.id);

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block'
        } 
      }
    );

  } catch (error) {
    console.error('GP51 Device Management error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
