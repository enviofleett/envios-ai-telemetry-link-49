
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getGP51ApiUrl, isValidGP51BaseUrl } from '../_shared/constants.ts';
import { md5_for_gp51_only, checkRateLimit, sanitizeInput } from '../_shared/crypto_utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GP51Device {
  deviceid: string;
  devicename: string;
  devicetype: number;
  simnum: string;
  overduetime: number;
  expirenotifytime: number;
  remark: string;
  creater: string;
  videochannelcount: number;
  lastactivetime: number;
  isfree: number;
  allowedit: number;
  icon: number;
  stared: number;
  loginame: string;
}

async function getGP51Token(): Promise<string> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Try to get existing valid token
  const { data: sessions, error } = await supabase
    .from('gp51_sessions')
    .select('*')
    .gt('token_expires_at', new Date().toISOString())
    .order('last_validated_at', { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(`Failed to get GP51 session: ${error.message}`);
  }

  if (sessions && sessions.length > 0) {
    return sessions[0].gp51_token;
  }

  // Get admin credentials and create new token
  const username = Deno.env.get('GP51_ADMIN_USERNAME');
  const password = Deno.env.get('GP51_ADMIN_PASSWORD');
  
  if (!username || !password) {
    throw new Error('GP51 admin credentials not configured');
  }

  // Use standardized URL construction
  const gp51BaseUrl = Deno.env.get('GP51_BASE_URL') || 'https://www.gps51.com';
  const gp51ApiUrl = getGP51ApiUrl(gp51BaseUrl);
  
  console.log(`🌐 [BULK-EXTRACTION] Using API URL: ${gp51ApiUrl}`);

  // Use GP51-compatible hash for authentication
  const hashedPassword = await md5_for_gp51_only(password);
  
  const loginUrl = new URL(gp51ApiUrl);
  loginUrl.searchParams.set('action', 'login');
  loginUrl.searchParams.set('username', sanitizeInput(username));
  loginUrl.searchParams.set('password', hashedPassword);
  loginUrl.searchParams.set('from', 'WEB');
  loginUrl.searchParams.set('type', 'USER');

  const globalToken = Deno.env.get('GP51_GLOBAL_API_TOKEN');
  if (globalToken) {
    loginUrl.searchParams.set('token', globalToken);
  }

  const authResponse = await fetch(loginUrl.toString(), {
    signal: AbortSignal.timeout(10000)
  });

  if (!authResponse.ok) {
    throw new Error(`GP51 authentication failed: ${authResponse.statusText}`);
  }

  const authResult = await authResponse.json();
  if (authResult.status !== 0 || !authResult.token) {
    throw new Error(`GP51 authentication failed: ${authResult.cause || 'Unknown error'}`);
  }

  // Store the new session
  await supabase
    .from('gp51_sessions')
    .upsert({
      username: sanitizeInput(username),
      password_hash: hashedPassword,
      gp51_token: authResult.token,
      token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      auth_method: 'ADMIN_AUTO',
      last_validated_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    }, {
      onConflict: 'username'
    });

  return authResult.token;
}

async function extractDevicesFromGP51(token: string): Promise<GP51Device[]> {
  // Use standardized URL construction
  const gp51BaseUrl = Deno.env.get('GP51_BASE_URL') || 'https://www.gps51.com';
  const gp51ApiUrl = getGP51ApiUrl(gp51BaseUrl);
  
  const devicesUrl = new URL(gp51ApiUrl);
  devicesUrl.searchParams.set('action', 'getmonitorlist');
  devicesUrl.searchParams.set('token', token);

  const devicesResponse = await fetch(devicesUrl.toString(), {
    signal: AbortSignal.timeout(15000)
  });

  if (!devicesResponse.ok) {
    throw new Error(`Failed to fetch devices: ${devicesResponse.statusText}`);
  }

  const devicesResult = await devicesResponse.json();
  if (devicesResult.status !== 0) {
    throw new Error(`GP51 devices fetch failed: ${devicesResult.cause || 'Unknown error'}`);
  }

  const devices: GP51Device[] = [];
  if (devicesResult.groups && Array.isArray(devicesResult.groups)) {
    for (const group of devicesResult.groups) {
      if (group.devices && Array.isArray(group.devices)) {
        devices.push(...group.devices);
      }
    }
  }

  return devices;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  
  // Rate limiting for bulk operations
  if (!checkRateLimit(clientIP, 3, 60 * 60 * 1000)) { // 3 requests per hour
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Too many bulk extraction requests. Please try again later.' 
    }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🚀 [BULK-EXTRACTION] Starting bulk GP51 device extraction...');

    // Get GP51 token
    const token = await getGP51Token();
    console.log('✅ [BULK-EXTRACTION] GP51 token obtained');

    // Extract devices from GP51
    const devices = await extractDevicesFromGP51(token);
    console.log(`📦 [BULK-EXTRACTION] Extracted ${devices.length} devices from GP51`);

    // Process and store devices
    const processedDevices = devices.map(device => ({
      device_id: sanitizeInput(device.deviceid),
      device_name: sanitizeInput(device.devicename || ''),
      device_type: device.devicetype || 0,
      sim_number: sanitizeInput(device.simnum || ''),
      last_active_time: device.lastactivetime ? new Date(device.lastactivetime * 1000).toISOString() : null,
      creator: sanitizeInput(device.creater || ''),
      remark: sanitizeInput(device.remark || ''),
      is_free: device.isfree === 1,
      allow_edit: device.allowedit === 1,
      extracted_at: new Date().toISOString()
    }));

    console.log(`✅ [BULK-EXTRACTION] Bulk extraction completed for ${processedDevices.length} devices`);

    return new Response(JSON.stringify({
      success: true,
      extracted_count: processedDevices.length,
      devices: processedDevices,
      extracted_at: new Date().toISOString()
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ [BULK-EXTRACTION] Bulk GP51 extraction error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Bulk extraction failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
