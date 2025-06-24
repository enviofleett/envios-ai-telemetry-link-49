
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getGP51ApiUrl, isValidGP51BaseUrl } from '../_shared/constants.ts';
import { md5_for_gp51_only } from '../_shared/crypto_utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 3;

function checkRateLimit(clientIP: string, maxRequests: number = MAX_REQUESTS, windowMs: number = RATE_LIMIT_WINDOW): boolean {
  const now = Date.now();
  const key = clientIP;
  
  const current = rateLimitMap.get(key);
  if (!current || (now - current.lastReset) > windowMs) {
    rateLimitMap.set(key, { count: 1, lastReset: now });
    return true;
  }
  
  if (current.count >= maxRequests) {
    return false;
  }
  
  current.count++;
  return true;
}

function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .slice(0, 1000); // Limit length
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
  
  console.log(`🌐 [ENHANCED-BULK-IMPORT] Using API URL: ${gp51ApiUrl}`);

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

async function getImportPreview(token: string) {
  console.log('🔍 [ENHANCED-BULK-IMPORT] Getting import preview...');
  
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

  // Process the preview data
  const devices: any[] = [];
  const users: any[] = [];
  
  if (devicesResult.groups && Array.isArray(devicesResult.groups)) {
    for (const group of devicesResult.groups) {
      if (group.devices && Array.isArray(group.devices)) {
        devices.push(...group.devices);
      }
    }
  }

  // Create sample data for preview
  const sampleDevices = devices.slice(0, 5).map(device => ({
    deviceId: sanitizeInput(device.deviceid || ''),
    deviceName: sanitizeInput(device.devicename || ''),
    status: device.lastactivetime ? 'active' : 'inactive',
    lastActive: device.lastactivetime ? new Date(device.lastactivetime * 1000).toISOString() : null
  }));

  return {
    success: true,
    summary: {
      vehicles: devices.length,
      users: users.length,
      groups: devicesResult.groups?.length || 0
    },
    sampleData: {
      vehicles: sampleDevices,
      users: []
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
  console.log('🚀 [ENHANCED-BULK-IMPORT] Starting import with options:', options);
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Create import job record
  const { data: job, error: jobError } = await supabase
    .from('system_import_jobs')
    .insert({
      import_type: 'gp51_bulk_import',
      status: 'in_progress',
      current_phase: 'fetching_data',
      phase_details: 'Fetching vehicle data from GP51',
      progress_percentage: 10
    })
    .select()
    .single();

  if (jobError) {
    throw new Error(`Failed to create import job: ${jobError.message}`);
  }

  try {
    // Get device data from GP51
    const gp51BaseUrl = Deno.env.get('GP51_BASE_URL') || 'https://www.gps51.com';
    const gp51ApiUrl = getGP51ApiUrl(gp51BaseUrl);
    
    const devicesUrl = new URL(gp51ApiUrl);
    devicesUrl.searchParams.set('action', 'getmonitorlist');
    devicesUrl.searchParams.set('token', token);

    const devicesResponse = await fetch(devicesUrl.toString(), {
      signal: AbortSignal.timeout(30000)
    });

    if (!devicesResponse.ok) {
      throw new Error(`Failed to fetch devices: ${devicesResponse.statusText}`);
    }

    const devicesResult = await devicesResponse.json();
    if (devicesResult.status !== 0) {
      throw new Error(`GP51 devices fetch failed: ${devicesResult.cause || 'Unknown error'}`);
    }

    // Process devices
    const devices: any[] = [];
    if (devicesResult.groups && Array.isArray(devicesResult.groups)) {
      for (const group of devicesResult.groups) {
        if (group.devices && Array.isArray(group.devices)) {
          devices.push(...group.devices);
        }
      }
    }

    // Update job progress
    await supabase
      .from('system_import_jobs')
      .update({
        current_phase: 'processing_data',
        phase_details: `Processing ${devices.length} vehicles`,
        progress_percentage: 50,
        total_devices: devices.length
      })
      .eq('id', job.id);

    let successfulImports = 0;
    const batchSize = options.batchSize || 50;
    
    // Process devices in batches
    for (let i = 0; i < devices.length; i += batchSize) {
      const batch = devices.slice(i, i + batchSize);
      
      const vehicleData = batch.map(device => ({
        gp51_device_id: sanitizeInput(device.deviceid || ''),
        device_name: sanitizeInput(device.devicename || ''),
        device_type: device.devicetype || 0,
        last_active_time: device.lastactivetime ? new Date(device.lastactivetime * 1000).toISOString() : null,
        sim_number: sanitizeInput(device.simnum || ''),
        status: device.lastactivetime ? 'active' : 'inactive',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      // Insert batch into database
      const { data: insertedVehicles, error: insertError } = await supabase
        .from('vehicles')
        .upsert(vehicleData, { 
          onConflict: 'gp51_device_id',
          ignoreDuplicates: false 
        })
        .select();

      if (!insertError && insertedVehicles) {
        successfulImports += insertedVehicles.length;
      }

      // Update progress
      const progressPercentage = Math.min(90, 50 + Math.floor((i / devices.length) * 40));
      await supabase
        .from('system_import_jobs')
        .update({
          progress_percentage: progressPercentage,
          successful_devices: successfulImports
        })
        .eq('id', job.id);
    }

    // Complete the job
    await supabase
      .from('system_import_jobs')
      .update({
        status: 'completed',
        current_phase: 'completed',
        phase_details: 'Import completed successfully',
        progress_percentage: 100,
        successful_devices: successfulImports,
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id);

    return {
      success: true,
      statistics: {
        usersProcessed: 0,
        usersImported: 0,
        devicesProcessed: devices.length,
        devicesImported: successfulImports,
        conflicts: 0
      },
      message: `Successfully imported ${successfulImports} out of ${devices.length} vehicles`,
      errors: [],
      duration: Date.now()
    };

  } catch (error) {
    // Update job with error status
    await supabase
      .from('system_import_jobs')
      .update({
        status: 'failed',
        current_phase: 'error',
        phase_details: error instanceof Error ? error.message : 'Import failed',
        progress_percentage: 0
      })
      .eq('id', job.id);

    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  
  // Rate limiting
  if (!checkRateLimit(clientIP)) {
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
    
    console.log(`🚀 [ENHANCED-BULK-IMPORT] Action: ${action}`);

    // Get GP51 token
    const token = await getGP51Token();
    console.log('✅ [ENHANCED-BULK-IMPORT] GP51 token obtained');

    if (action === 'get_import_preview') {
      const previewData = await getImportPreview(token);
      return new Response(JSON.stringify(previewData), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'start_import') {
      const importResult = await startImport(token, options || {});
      return new Response(JSON.stringify(importResult), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid action'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ [ENHANCED-BULK-IMPORT] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
