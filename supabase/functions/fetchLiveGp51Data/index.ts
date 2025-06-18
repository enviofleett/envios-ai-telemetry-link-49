
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting GP51 Live Data Import...');
    const startTime = Date.now();

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

    // Make GP51 API call with retry logic
    let result: GP51ApiResponse | null = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts && !result) {
      attempts++;
      console.log(`🌐 GP51 API call attempt ${attempts}/${maxAttempts}...`);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch(apiUrl, {
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
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const responseText = await response.text();
        console.log('📡 GP51 API Raw Response Length:', responseText.length);

        try {
          result = JSON.parse(responseText);
          console.log('✅ GP51 API call successful on attempt', attempts);
        } catch (parseError) {
          console.error('❌ Failed to parse GP51 response as JSON:', parseError);
          if (attempts === maxAttempts) {
            throw new Error('Invalid JSON response from GP51 API');
          }
          continue;
        }

      } catch (error) {
        console.error(`❌ GP51 API call attempt ${attempts} failed:`, error);
        if (attempts === maxAttempts) {
          throw error;
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    if (!result) {
      throw new Error('Failed to get valid response from GP51 API after all attempts');
    }

    // Analyze GP51 response structure
    console.log('📋 GP51 Response Analysis:', {
      hasStatus: typeof result.status !== 'undefined',
      status: result.status,
      hasCause: typeof result.cause !== 'undefined',
      cause: result.cause,
      hasGroups: typeof result.groups !== 'undefined',
      groupsType: typeof result.groups,
      groupsLength: result.groups?.length || 0,
      hasRecords: typeof result.records !== 'undefined',
      recordsType: typeof result.records,
      recordsLength: result.records?.length || 0,
      topLevelKeys: Object.keys(result)
    });

    // Check for API errors
    if (result.status !== 0) {
      const errorMsg = `GP51 API Error - Status: ${result.status}, Message: ${result.cause}`;
      console.error('❌', errorMsg);
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extract positions from records
    const positions = result.records || [];
    console.log(`📍 Found ${positions.length} position records`);

    // NEW LOGIC: Extract unique devices from records instead of groups
    const uniqueDeviceIds = new Set<string>();
    const extractedDevices: any[] = [];

    positions.forEach((record: any, index: number) => {
      // Identify the device ID field - try common GP51 field names
      let deviceId = record.deviceid || record.imei || record.unit_id || record.device_id;
      
      // Convert to string and validate
      if (deviceId !== null && deviceId !== undefined) {
        const deviceIdStr = String(deviceId).trim();
        
        if (deviceIdStr && !uniqueDeviceIds.has(deviceIdStr)) {
          uniqueDeviceIds.add(deviceIdStr);
          
          // Create device object with available metadata from the record
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
      } else if (index < 5) {
        // Log structure of first few records for debugging
        console.log(`📋 Record ${index} structure:`, Object.keys(record));
      }
    });

    // Updated logging to reflect new extraction method
    console.log('📊 GP51 Data Processing Results:', {
      rawGroupsCount: result.groups?.length || 0,
      extractedDevicesCount: extractedDevices.length, // Now correctly reflects unique devices from records
      positionsCount: positions.length,
      deviceSample: extractedDevices.slice(0, 2).map(d => ({
        id: d.gp51_device_id,
        name: d.name
      })) // Sample of extracted devices
    });

    const responseTime = Date.now() - startTime;
    console.log(`✅ GP51 Live Data Import completed successfully in ${responseTime}ms`);

    // Final summary with timing
    console.log('🎯 Final Processed Data Summary:', {
      success: true,
      total_devices: extractedDevices.length,
      total_positions: positions.length,
      has_groups: (result.groups?.length || 0) > 0,
      response_time: responseTime
    });

    // Return the processed data in the expected format
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          devices: extractedDevices, // Now contains actual extracted unique devices
          positions: positions,
          statistics: {
            totalDevices: extractedDevices.length,
            totalPositions: positions.length,
            responseTime: responseTime
          },
          metadata: {
            fetchedAt: new Date().toISOString(),
            source: 'gp51_lastposition_api',
            extractionMethod: 'records_based' // Indicates the new method
          }
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ GP51 Live Data Import failed:', error);
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
