
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getGP51ApiUrl } from '../_shared/constants.ts';
import { md5_for_gp51_only, checkRateLimit, sanitizeInput } from '../_shared/crypto_utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportJob {
  id: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  totalItems: number;
  processedItems: number;
  successfulItems: number;
  failedItems: number;
  currentChunk: number;
  totalChunks: number;
  chunkSize: number;
  errorLog: any[];
  startedAt?: string;
  completedAt?: string;
  resumeFromChunk?: number;
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
  
  console.log(`🌐 [ENHANCED-BULK] Using API URL: ${gp51ApiUrl}`);

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

  return authResult.token;
}

async function extractDevicesFromGP51(token: string): Promise<GP51Device[]> {
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

async function processDeviceChunk(
  devices: GP51Device[], 
  supabase: any, 
  jobId: string,
  chunkIndex: number
): Promise<{ successful: number; failed: number; errors: any[] }> {
  const errors: any[] = [];
  let successful = 0;
  let failed = 0;

  console.log(`📦 [ENHANCED-BULK] Processing chunk ${chunkIndex + 1} with ${devices.length} devices`);

  try {
    const processedDevices = devices.map(device => ({
      gp51_device_id: sanitizeInput(device.deviceid),
      name: sanitizeInput(device.devicename || ''),
      sim_number: sanitizeInput(device.simnum || ''),
      last_active_time: device.lastactivetime ? new Date(device.lastactivetime * 1000).toISOString() : null,
      creator: sanitizeInput(device.creater || ''),
      notes: sanitizeInput(device.remark || ''),
      is_active: device.isfree === 1,
      device_type: device.devicetype || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      import_job_id: jobId,
      import_source: 'gp51_bulk_import'
    }));

    // Batch insert with conflict resolution
    const { data: insertResult, error: insertError } = await supabase
      .from('vehicles')
      .upsert(processedDevices, { 
        onConflict: 'gp51_device_id',
        ignoreDuplicates: false 
      })
      .select('gp51_device_id');

    if (insertError) {
      console.error(`❌ [ENHANCED-BULK] Chunk ${chunkIndex + 1} insert error:`, insertError);
      errors.push({
        chunkIndex: chunkIndex + 1,
        error: insertError.message,
        timestamp: new Date().toISOString()
      });
      failed = devices.length;
    } else {
      successful = insertResult?.length || devices.length;
      console.log(`✅ [ENHANCED-BULK] Chunk ${chunkIndex + 1} completed: ${successful} devices processed`);
    }

  } catch (error) {
    console.error(`❌ [ENHANCED-BULK] Chunk ${chunkIndex + 1} processing error:`, error);
    errors.push({
      chunkIndex: chunkIndex + 1,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    failed = devices.length;
  }

  return { successful, failed, errors };
}

async function updateJobProgress(
  supabase: any, 
  jobId: string, 
  updates: Partial<ImportJob>
): Promise<void> {
  const { error } = await supabase
    .from('bulk_import_jobs')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId);

  if (error) {
    console.error('❌ [ENHANCED-BULK] Failed to update job progress:', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  
  // Rate limiting for bulk operations
  if (!checkRateLimit(clientIP, 1, 60 * 60 * 1000)) { // 1 request per hour
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Too many bulk import requests. Please try again later.' 
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

    const { action, jobId, chunkSize = 50 } = await req.json();

    if (action === 'start') {
      console.log('🚀 [ENHANCED-BULK] Starting enhanced bulk import...');

      // Create backup of existing vehicles
      const backupTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
      await supabase.rpc('create_table_backup', {
        source_table: 'vehicles',
        backup_table: `vehicles_backup_${backupTimestamp}`
      });

      // Get GP51 token and extract devices
      const token = await getGP51Token();
      const allDevices = await extractDevicesFromGP51(token);
      
      console.log(`📊 [ENHANCED-BULK] Extracted ${allDevices.length} devices from GP51`);

      // Create import job
      const totalChunks = Math.ceil(allDevices.length / chunkSize);
      const { data: job, error: jobError } = await supabase
        .from('bulk_import_jobs')
        .insert({
          job_name: `Enhanced Bulk Import - ${new Date().toISOString()}`,
          status: 'running',
          total_items: allDevices.length,
          processed_items: 0,
          successful_items: 0,
          failed_items: 0,
          current_chunk: 0,
          total_chunks: totalChunks,
          chunk_size: chunkSize,
          error_log: [],
          started_at: new Date().toISOString(),
          import_type: 'enhanced_bulk',
          import_data: {
            backup_table: `vehicles_backup_${backupTimestamp}`,
            gp51_device_count: allDevices.length,
            chunk_size: chunkSize
          }
        })
        .select()
        .single();

      if (jobError) {
        throw new Error(`Failed to create import job: ${jobError.message}`);
      }

      // Process devices in chunks
      let totalSuccessful = 0;
      let totalFailed = 0;
      let allErrors: any[] = [];

      for (let i = 0; i < totalChunks; i++) {
        const startIndex = i * chunkSize;
        const endIndex = Math.min(startIndex + chunkSize, allDevices.length);
        const chunk = allDevices.slice(startIndex, endIndex);

        const chunkResult = await processDeviceChunk(chunk, supabase, job.id, i);
        
        totalSuccessful += chunkResult.successful;
        totalFailed += chunkResult.failed;
        allErrors = [...allErrors, ...chunkResult.errors];

        // Update job progress
        await updateJobProgress(supabase, job.id, {
          current_chunk: i + 1,
          processed_items: totalSuccessful + totalFailed,
          successful_items: totalSuccessful,
          failed_items: totalFailed,
          error_log: allErrors
        });

        // Small delay between chunks to avoid overwhelming the system
        if (i < totalChunks - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Mark job as completed
      await updateJobProgress(supabase, job.id, {
        status: totalFailed === 0 ? 'completed' : 'completed_with_errors',
        completed_at: new Date().toISOString()
      });

      console.log(`✅ [ENHANCED-BULK] Import completed: ${totalSuccessful} successful, ${totalFailed} failed`);

      return new Response(JSON.stringify({
        success: true,
        jobId: job.id,
        totalDevices: allDevices.length,
        successfulItems: totalSuccessful,
        failedItems: totalFailed,
        totalChunks,
        backupTable: `vehicles_backup_${backupTimestamp}`,
        errors: allErrors
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'status' && jobId) {
      // Get job status
      const { data: job, error } = await supabase
        .from('bulk_import_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) {
        throw new Error(`Failed to get job status: ${error.message}`);
      }

      return new Response(JSON.stringify({
        success: true,
        job
      }), {
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
    console.error('❌ [ENHANCED-BULK] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Enhanced bulk import failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
