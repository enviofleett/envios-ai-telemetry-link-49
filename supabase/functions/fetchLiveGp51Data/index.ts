
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GP51ApiResponse {
  status: number;
  cause: string;
  records?: any[];
  groups?: any[];
  lastquerypositiontime?: string;
}

interface SyncResult {
  type: 'fullSync' | 'batchedUpdate';
  devices?: any[];
  positions: any[];
  statistics: {
    totalDevices: number;
    totalPositions: number;
    batchesProcessed?: number;
    responseTime: number;
  };
  metadata: {
    fetchedAt: string;
    source: string;
    syncType: string;
  };
}

const BATCH_SIZE = 100;
const FULL_SYNC_TIMEOUT = 180000; // 3 minutes for full sync
const BATCH_TIMEOUT = 30000; // 30 seconds for individual batches
const MAX_RETRIES = 3;

async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  maxRetries: number = MAX_RETRIES,
  timeoutMs: number = BATCH_TIMEOUT
): Promise<Response> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${maxRetries} - Timeout: ${timeoutMs}ms`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.error(`❌ Attempt ${attempt} failed:`, lastError.message);
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

async function performFullSync(
  username: string,
  password: string,
  apiUrl: string
): Promise<{ devices: any[], positions: any[] }> {
  console.log('🔄 Starting Full Sync - fetching ALL device positions...');
  
  try {
    const response = await fetchWithRetry(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        username: username,
        password: password,
        action: 'lastposition',
        'export-type': 'json'
      }),
    }, MAX_RETRIES, FULL_SYNC_TIMEOUT);

    const responseText = await response.text();
    console.log('📡 Full Sync Response Length:', responseText.length);

    const result: GP51ApiResponse = JSON.parse(responseText);
    
    if (result.status !== 0) {
      throw new Error(`GP51 API Error - Status: ${result.status}, Message: ${result.cause}`);
    }

    const positions = result.records || [];
    console.log(`📍 Full Sync: Found ${positions.length} position records`);

    // Extract unique devices from positions
    const uniqueDeviceIds = new Set<string>();
    const extractedDevices: any[] = [];

    positions.forEach((record: any) => {
      let deviceId = record.deviceid || record.imei || record.unit_id || record.device_id;
      
      if (deviceId !== null && deviceId !== undefined) {
        const deviceIdStr = String(deviceId).trim();
        
        if (deviceIdStr && !uniqueDeviceIds.has(deviceIdStr)) {
          uniqueDeviceIds.add(deviceIdStr);
          
          const deviceData = {
            gp51_device_id: deviceIdStr,
            name: record.devicename || record.device_name || `Device ${deviceIdStr}`,
            sim_number: record.simnum || record.sim_number || null,
            last_position: {
              latitude: record.lat || record.latitude || null,
              longitude: record.lng || record.longitude || null,
              timestamp: record.loctime || record.timestamp || null,
              speed: record.speed || null,
              heading: record.course || record.heading || null
            }
          };
          
          extractedDevices.push(deviceData);
        }
      }
    });

    console.log(`✅ Full Sync Complete: ${extractedDevices.length} unique devices extracted`);
    return { devices: extractedDevices, positions };

  } catch (error) {
    console.error('❌ Full Sync failed:', error);
    throw error;
  }
}

async function performBatchedUpdate(
  username: string,
  password: string,
  apiUrl: string,
  supabase: any
): Promise<{ positions: any[], batchesProcessed: number }> {
  console.log('🔄 Starting Batched Update - fetching existing device positions...');
  
  try {
    // Get existing device IDs from local database
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('gp51_device_id')
      .not('gp51_device_id', 'is', null);

    if (vehiclesError) {
      throw new Error(`Failed to fetch vehicle IDs: ${vehiclesError.message}`);
    }

    const deviceIds = vehicles.map((v: any) => v.gp51_device_id);
    console.log(`📋 Found ${deviceIds.length} devices in local database`);

    if (deviceIds.length === 0) {
      console.log('⚠️ No devices found - falling back to full sync');
      const fullSyncResult = await performFullSync(username, password, apiUrl);
      return { positions: fullSyncResult.positions, batchesProcessed: 0 };
    }

    // Create batches
    const batches: string[][] = [];
    for (let i = 0; i < deviceIds.length; i += BATCH_SIZE) {
      batches.push(deviceIds.slice(i, i + BATCH_SIZE));
    }

    console.log(`📦 Created ${batches.length} batches with batch size ${BATCH_SIZE}`);

    // Process batches with Promise.allSettled for fault tolerance
    const batchPromises = batches.map(async (batch, index) => {
      console.log(`🔄 Processing batch ${index + 1}/${batches.length} (${batch.length} devices)`);
      
      try {
        const response = await fetchWithRetry(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            username: username,
            password: password,
            action: 'lastposition',
            'export-type': 'json',
            deviceids: JSON.stringify(batch)
          }),
        }, MAX_RETRIES, BATCH_TIMEOUT);

        const responseText = await response.text();
        const result: GP51ApiResponse = JSON.parse(responseText);
        
        if (result.status !== 0) {
          throw new Error(`Batch ${index + 1} - GP51 API Error: ${result.cause}`);
        }

        const batchPositions = result.records || [];
        console.log(`✅ Batch ${index + 1} completed: ${batchPositions.length} positions`);
        return batchPositions;

      } catch (error) {
        console.error(`❌ Batch ${index + 1} failed:`, error);
        return []; // Return empty array for failed batches
      }
    });

    const batchResults = await Promise.allSettled(batchPromises);
    
    // Aggregate successful results
    let allPositions: any[] = [];
    let successfulBatches = 0;

    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allPositions = allPositions.concat(result.value);
        if (result.value.length > 0) {
          successfulBatches++;
        }
      } else {
        console.error(`❌ Batch ${index + 1} promise rejected:`, result.reason);
      }
    });

    console.log(`✅ Batched Update Complete: ${successfulBatches}/${batches.length} batches successful, ${allPositions.length} total positions`);
    return { positions: allPositions, batchesProcessed: successfulBatches };

  } catch (error) {
    console.error('❌ Batched Update failed:', error);
    throw error;
  }
}

async function determineIfFullSyncNeeded(supabase: any, forceFullSync: boolean = false): Promise<boolean> {
  if (forceFullSync) {
    console.log('🔄 Force full sync requested');
    return true;
  }

  try {
    const { count, error } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Error checking vehicle count:', error);
      return true; // Default to full sync on error
    }

    const isEmpty = count === 0;
    console.log(`📊 Local vehicles count: ${count} - ${isEmpty ? 'Empty (Full Sync needed)' : 'Has data (Batched Update)'}`);
    return isEmpty;

  } catch (error) {
    console.error('❌ Error determining sync type:', error);
    return true; // Default to full sync on error
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting Enhanced GP51 Live Data Import...');
    const startTime = Date.now();

    // Parse request body for optional parameters
    let forceFullSync = false;
    try {
      const body = await req.json();
      forceFullSync = body?.forceFullSync || false;
    } catch {
      // No body or invalid JSON, use defaults
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get GP51 credentials from secure storage
    const { data: credentials, error: credError } = await supabase
      .from('gp51_secure_credentials')
      .select('username, credential_vault_id, api_url')
      .eq('is_active', true)
      .single();

    if (credError || !credentials) {
      console.error('❌ No GP51 credentials found:', credError);
      return new Response(
        JSON.stringify({ error: 'GP51 credentials not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get password from vault
    const { data: vaultData, error: vaultError } = await supabase
      .from('vault.decrypted_secrets')
      .select('decrypted_secret')
      .eq('id', credentials.credential_vault_id)
      .single();

    if (vaultError || !vaultData) {
      console.error('❌ Could not retrieve GP51 password:', vaultError);
      return new Response(
        JSON.stringify({ error: 'Could not retrieve GP51 credentials' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const username = credentials.username;
    const password = vaultData.decrypted_secret;
    const apiUrl = credentials.api_url || 'https://www.gps51.com/webapi';

    console.log(`🔐 Using GP51 credentials for user: ${username}`);

    // Determine sync strategy
    const needsFullSync = await determineIfFullSyncNeeded(supabase, forceFullSync);
    
    let syncResult: SyncResult;
    
    if (needsFullSync) {
      console.log('📥 Executing FULL SYNC strategy...');
      const { devices, positions } = await performFullSync(username, password, apiUrl);
      
      syncResult = {
        type: 'fullSync',
        devices,
        positions,
        statistics: {
          totalDevices: devices.length,
          totalPositions: positions.length,
          responseTime: Date.now() - startTime
        },
        metadata: {
          fetchedAt: new Date().toISOString(),
          source: 'gp51_lastposition_api',
          syncType: 'full_sync'
        }
      };
    } else {
      console.log('📦 Executing BATCHED UPDATE strategy...');
      const { positions, batchesProcessed } = await performBatchedUpdate(username, password, apiUrl, supabase);
      
      // Extract unique devices from positions for consistency
      const uniqueDeviceIds = new Set<string>();
      positions.forEach((record: any) => {
        const deviceId = record.deviceid || record.imei || record.unit_id || record.device_id;
        if (deviceId) uniqueDeviceIds.add(String(deviceId).trim());
      });
      
      syncResult = {
        type: 'batchedUpdate',
        positions,
        statistics: {
          totalDevices: uniqueDeviceIds.size,
          totalPositions: positions.length,
          batchesProcessed,
          responseTime: Date.now() - startTime
        },
        metadata: {
          fetchedAt: new Date().toISOString(),
          source: 'gp51_lastposition_api',
          syncType: 'batched_update'
        }
      };
    }

    const responseTime = Date.now() - startTime;
    console.log(`✅ GP51 Enhanced Data Import completed successfully in ${responseTime}ms`);

    // Final summary with timing
    console.log('🎯 Final Processed Data Summary:', {
      success: true,
      syncType: syncResult.type,
      total_devices: syncResult.statistics.totalDevices,
      total_positions: syncResult.statistics.totalPositions,
      batches_processed: syncResult.statistics.batchesProcessed,
      response_time: responseTime
    });

    // Return the processed data in the expected format
    return new Response(
      JSON.stringify({
        success: true,
        data: syncResult
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ GP51 Enhanced Data Import failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
