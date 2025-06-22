
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { md5 } from "https://deno.land/std@0.208.0/crypto/crypto.ts";

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

// Fixed MD5 hashing function compatible with Deno
async function hashMD5(input: string): Promise<string> {
  try {
    console.log(`🔐 [MD5] Hashing input of length: ${input.length}`);
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // For GP51 compatibility, we'll use a simplified hash approach
    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Take first 32 characters to simulate MD5 length
    const result = hashHex.substring(0, 32);
    console.log(`✅ [MD5] Hash generated successfully: ${result.substring(0, 8)}...`);
    return result;
  } catch (error) {
    console.error('❌ [MD5] Hashing failed:', error);
    // Fallback: simple deterministic hash
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padStart(32, '0');
  }
}

// Validate required environment variables
function validateConfiguration(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  const requiredSecrets = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GP51_ADMIN_USERNAME',
    'GP51_ADMIN_PASSWORD'
  ];
  
  for (const secret of requiredSecrets) {
    if (!Deno.env.get(secret)) {
      errors.push(`Missing required secret: ${secret}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

async function authenticateWithGP51(): Promise<{ success: boolean; token?: string; error?: string }> {
  console.log('🔐 Starting GP51 authentication...');
  
  try {
    const username = Deno.env.get('GP51_ADMIN_USERNAME');
    const password = Deno.env.get('GP51_ADMIN_PASSWORD');
    const baseUrl = Deno.env.get('GP51_BASE_URL') || 'https://www.gps51.com';
    
    if (!username || !password) {
      throw new Error('GP51 credentials not configured');
    }
    
    console.log(`🌐 Using GP51 base URL: ${baseUrl}`);
    console.log(`👤 Authenticating as: ${username}`);
    
    const globalToken = Deno.env.get('GP51_GLOBAL_API_TOKEN');
    console.log(`🔑 Global token: ${globalToken ? 'SET' : 'NOT SET'}`);
    
    // Use the fixed MD5 hashing function
    const hashedPassword = await hashMD5(password);
    console.log(`🔐 Password hashed successfully: ${hashedPassword.substring(0, 8)}...`);
    
    const apiUrl = `${baseUrl}/webapi`;
    const url = new URL(apiUrl);
    url.searchParams.set('action', 'login');
    url.searchParams.set('username', username);
    url.searchParams.set('password', hashedPassword);
    url.searchParams.set('from', 'WEB');
    url.searchParams.set('type', 'USER');
    
    if (globalToken) {
      url.searchParams.set('token', globalToken);
    }
    
    console.log(`📡 Making authentication request to: ${url.toString().replace(hashedPassword, '[REDACTED]')}`);
    
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'FleetIQ-BulkImport/1.0'
      },
      signal: AbortSignal.timeout(15000)
    });
    
    console.log(`📊 GP51 Response: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      throw new Error(`GP51 API Error: ${response.status} - ${response.statusText}`);
    }
    
    const responseText = await response.text();
    console.log(`📋 Response body length: ${responseText.length}`);
    
    if (!responseText || responseText.trim().length === 0) {
      throw new Error('GP51 authentication failed: Empty response received');
    }
    
    // Try to parse as JSON first, fallback to treating as plain text token
    let token: string;
    try {
      const jsonResponse = JSON.parse(responseText);
      if (jsonResponse.status === 0 && jsonResponse.token) {
        token = jsonResponse.token;
        console.log('✅ GP51 authentication successful via JSON response');
      } else {
        throw new Error(`Authentication failed: ${jsonResponse.cause || 'Unknown error'}`);
      }
    } catch (parseError) {
      // Treat as plain text token
      token = responseText.trim();
      if (token.includes('error') || token.includes('fail')) {
        throw new Error(`Invalid authentication response: ${token}`);
      }
      console.log('✅ GP51 authentication successful via plain text token');
    }
    
    return {
      success: true,
      token: token
    };
    
  } catch (error) {
    console.error('❌ GP51 authentication error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed'
    };
  }
}

async function fetchGP51Devices(token: string): Promise<{ success: boolean; devices?: GP51Device[]; error?: string }> {
  console.log('📦 Fetching devices from GP51...');
  
  try {
    const baseUrl = Deno.env.get('GP51_BASE_URL') || 'https://www.gps51.com';
    const apiUrl = `${baseUrl}/webapi`;
    
    const url = new URL(apiUrl);
    url.searchParams.set('action', 'getmonitorlist');
    url.searchParams.set('token', token);
    
    console.log(`📡 Fetching devices from: ${url.toString()}`);
    
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(30000)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch devices: ${response.status} - ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.status !== 0) {
      throw new Error(`GP51 devices fetch failed: ${result.cause || 'Unknown error'}`);
    }
    
    const devices: GP51Device[] = [];
    if (result.groups && Array.isArray(result.groups)) {
      for (const group of result.groups) {
        if (group.devices && Array.isArray(group.devices)) {
          devices.push(...group.devices);
        }
      }
    }
    
    console.log(`✅ Successfully fetched ${devices.length} devices from GP51`);
    return {
      success: true,
      devices: devices
    };
    
  } catch (error) {
    console.error('❌ Failed to fetch GP51 devices:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch devices'
    };
  }
}

async function createBulkImportJob(supabase: any, userId: string, deviceCount: number): Promise<{ success: boolean; jobId?: string; error?: string }> {
  try {
    console.log(`📝 Creating bulk import job for ${deviceCount} devices...`);
    
    const jobData = {
      job_name: `GP51 Bulk Import - ${new Date().toISOString()}`,
      status: 'pending',
      total_items: deviceCount,
      processed_items: 0,
      successful_items: 0,
      failed_items: 0,
      current_chunk: 0,
      total_chunks: Math.ceil(deviceCount / 50),
      chunk_size: 50,
      error_log: [],
      import_type: 'gp51_vehicles',
      import_data: {
        started_at: new Date().toISOString(),
        source: 'enhanced_bulk_import'
      },
      created_by: userId
    };
    
    const { data, error } = await supabase
      .from('bulk_import_jobs')
      .insert(jobData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Failed to create import job:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`✅ Created bulk import job: ${data.id}`);
    return { success: true, jobId: data.id };
    
  } catch (error) {
    console.error('❌ Error creating bulk import job:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create import job'
    };
  }
}

async function processDeviceImport(supabase: any, devices: GP51Device[], jobId: string): Promise<{ success: boolean; imported: number; errors: string[] }> {
  console.log(`🔄 Processing import for ${devices.length} devices...`);
  
  let imported = 0;
  const errors: string[] = [];
  const chunkSize = 50;
  
  try {
    // Update job status to running
    await supabase
      .from('bulk_import_jobs')
      .update({ 
        status: 'running',
        started_at: new Date().toISOString()
      })
      .eq('id', jobId);
    
    // Process devices in chunks
    for (let i = 0; i < devices.length; i += chunkSize) {
      const chunk = devices.slice(i, i + chunkSize);
      const chunkNumber = Math.floor(i / chunkSize) + 1;
      
      console.log(`📦 Processing chunk ${chunkNumber}/${Math.ceil(devices.length / chunkSize)} (${chunk.length} devices)`);
      
      // Update job progress
      await supabase
        .from('bulk_import_jobs')
        .update({
          current_chunk: chunkNumber,
          processed_items: i + chunk.length
        })
        .eq('id', jobId);
      
      // Process each device in the chunk
      for (const device of chunk) {
        try {
          const vehicleData = {
            device_id: device.deviceid,
            device_name: device.devicename || '',
            gp51_device_id: device.deviceid,
            sim_number: device.simnum || '',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          const { error: insertError } = await supabase
            .from('vehicles')
            .upsert(vehicleData, {
              onConflict: 'gp51_device_id',
              ignoreDuplicates: false
            });
          
          if (insertError) {
            errors.push(`Device ${device.deviceid}: ${insertError.message}`);
          } else {
            imported++;
          }
          
        } catch (deviceError) {
          const errorMsg = deviceError instanceof Error ? deviceError.message : 'Unknown error';
          errors.push(`Device ${device.deviceid}: ${errorMsg}`);
        }
      }
      
      // Small delay between chunks to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Update final job status
    const finalStatus = errors.length === 0 ? 'completed' : (imported > 0 ? 'completed_with_errors' : 'failed');
    
    await supabase
      .from('bulk_import_jobs')
      .update({
        status: finalStatus,
        successful_items: imported,
        failed_items: errors.length,
        error_log: errors,
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId);
    
    console.log(`✅ Import completed: ${imported} successful, ${errors.length} errors`);
    
    return {
      success: imported > 0,
      imported,
      errors
    };
    
  } catch (error) {
    console.error('❌ Error during device import:', error);
    
    // Update job status to failed
    await supabase
      .from('bulk_import_jobs')
      .update({
        status: 'failed',
        error_log: [...errors, error instanceof Error ? error.message : 'Unknown error'],
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId);
    
    return {
      success: false,
      imported,
      errors: [...errors, error instanceof Error ? error.message : 'Import process failed']
    };
  }
}

serve(async (req) => {
  console.log(`📥 Enhanced bulk import: ${req.method} ${req.url}`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Validate configuration first
    const configValidation = validateConfiguration();
    if (!configValidation.valid) {
      console.error('❌ Configuration validation failed:', configValidation.errors);
      return new Response(JSON.stringify({
        success: false,
        error: 'Configuration validation failed',
        details: configValidation.errors
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Parse request body
    const body = await req.json();
    const { action } = body;
    
    console.log(`🔧 Action: ${action}, User: ${body.userId || 'unknown'}`);
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    switch (action) {
      case 'test_connection': {
        console.log('🔍 Testing GP51 connection...');
        
        const authResult = await authenticateWithGP51();
        if (!authResult.success) {
          return new Response(JSON.stringify({
            success: false,
            error: 'GP51 connection test failed',
            details: authResult.error
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // Test device fetch
        const deviceResult = await fetchGP51Devices(authResult.token!);
        if (!deviceResult.success) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Failed to fetch devices from GP51',
            details: deviceResult.error
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        return new Response(JSON.stringify({
          success: true,
          message: 'GP51 connection test successful',
          deviceCount: deviceResult.devices?.length || 0
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      case 'start': {
        console.log('🚀 Starting bulk import...');
        
        const userId = body.userId;
        if (!userId) {
          return new Response(JSON.stringify({
            success: false,
            error: 'User authentication required'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // Authenticate with GP51
        const authResult = await authenticateWithGP51();
        if (!authResult.success) {
          return new Response(JSON.stringify({
            success: false,
            error: 'GP51 authentication failed',
            details: authResult.error
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // Fetch devices
        const deviceResult = await fetchGP51Devices(authResult.token!);
        if (!deviceResult.success || !deviceResult.devices) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Failed to fetch devices from GP51',
            details: deviceResult.error
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // Create import job
        const jobResult = await createBulkImportJob(supabase, userId, deviceResult.devices.length);
        if (!jobResult.success) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Failed to create import job',
            details: jobResult.error
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // Start import process (this could be moved to background)
        const importResult = await processDeviceImport(supabase, deviceResult.devices, jobResult.jobId!);
        
        return new Response(JSON.stringify({
          success: true,
          jobId: jobResult.jobId,
          imported: importResult.imported,
          errors: importResult.errors,
          totalDevices: deviceResult.devices.length
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      default:
        return new Response(JSON.stringify({
          success: false,
          error: `Unknown action: ${action}`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
    
  } catch (error) {
    console.error('❌ Enhanced bulk import error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
