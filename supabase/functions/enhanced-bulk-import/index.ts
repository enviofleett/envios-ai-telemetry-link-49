
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getGP51ApiUrl, isValidGP51BaseUrl } from '../_shared/constants.ts';
import { md5_for_gp51_only, checkRateLimit } from '../_shared/crypto_utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple input sanitization function for edge function use
function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.trim().slice(0, 100); // Basic sanitization
}

interface GP51User {
  username: string;
  email?: string;
  userType: number;
  loginame?: string;
}

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

  const gp51BaseUrl = Deno.env.get('GP51_BASE_URL') || 'https://www.gps51.com';
  const gp51ApiUrl = getGP51ApiUrl(gp51BaseUrl);
  
  console.log(`🌐 [GP51-IMPORT] Using API URL: ${gp51ApiUrl}`);

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

async function getImportPreview(token: string) {
  const gp51BaseUrl = Deno.env.get('GP51_BASE_URL') || 'https://www.gps51.com';
  const gp51ApiUrl = getGP51ApiUrl(gp51BaseUrl);
  
  console.log('🔍 [GP51-IMPORT] Getting lightweight preview...');

  // Get device count first
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

  // Get sample devices (first 5)
  const sampleDevices = devices.slice(0, 5).map(device => ({
    deviceId: device.deviceid,
    deviceName: device.devicename || '',
    status: device.isfree === 1 ? 'Free' : 'Active',
    lastActive: device.lastactivetime ? new Date(device.lastactivetime * 1000).toISOString() : null
  }));

  // Get users count and sample
  const usersUrl = new URL(gp51ApiUrl);
  usersUrl.searchParams.set('action', 'getuserlist');
  usersUrl.searchParams.set('token', token);

  const usersResponse = await fetch(usersUrl.toString(), {
    signal: AbortSignal.timeout(10000)
  });

  let users: GP51User[] = [];
  let sampleUsers: any[] = [];

  if (usersResponse.ok) {
    const usersResult = await usersResponse.json();
    if (usersResult.status === 0 && usersResult.users) {
      users = usersResult.users;
      sampleUsers = users.slice(0, 5).map(user => ({
        username: user.username,
        email: user.email || '',
        userType: user.userType || 0
      }));
    }
  }

  return {
    success: true,
    summary: {
      vehicles: devices.length,
      users: users.length,
      groups: devicesResult.groups?.length || 0
    },
    sampleData: {
      vehicles: sampleDevices,
      users: sampleUsers
    },
    conflicts: {
      existingUsers: [],
      existingDevices: [],
      potentialDuplicates: 0
    },
    authenticationStatus: {
      connected: true,
      username: Deno.env.get('GP51_ADMIN_USERNAME')
    },
    warnings: []
  };
}

async function startImport(token: string, options: any) {
  console.log('🚀 [GP51-IMPORT] Starting full import process...');
  
  // This would contain the actual import logic
  // For now, return a placeholder response
  return {
    success: true,
    statistics: {
      usersProcessed: 0,
      usersImported: 0,
      devicesProcessed: 0,
      devicesImported: 0,
      conflicts: 0
    },
    message: 'Import started - this is a placeholder response',
    errors: [],
    duration: 0
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  
  // Rate limiting
  if (!checkRateLimit(clientIP, 10, 60 * 1000)) { // 10 requests per minute
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Too many requests. Please try again later.' 
    }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const { action, options } = await req.json();
    console.log(`📝 [GP51-IMPORT] Processing action: ${action}`);

    // Get GP51 token
    const token = await getGP51Token();
    console.log('✅ [GP51-IMPORT] GP51 token obtained');

    if (action === 'get_import_preview') {
      const preview = await getImportPreview(token);
      return new Response(JSON.stringify(preview), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'start_import') {
      const result = await startImport(token, options);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid action specified'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ [GP51-IMPORT] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Import operation failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
