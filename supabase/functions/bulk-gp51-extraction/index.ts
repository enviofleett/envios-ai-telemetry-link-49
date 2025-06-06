
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GP51Credentials {
  username: string;
  password: string;
}

interface ExtractionJob {
  jobName: string;
  credentials: GP51Credentials[];
}

interface GP51Vehicle {
  deviceid: string;
  devicename: string;
  simnum?: string;
  lastactivetime?: string;
  status?: string;
  lastPosition?: any;
}

interface UserExtraction {
  gp51_username: string;
  gp51_user_token?: string;
  vehicles: GP51Vehicle[];
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { jobName, credentials }: ExtractionJob = await req.json();

    if (!jobName || !credentials || !Array.isArray(credentials)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid request. jobName and credentials array required.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Starting bulk extraction job: ${jobName} with ${credentials.length} accounts`);

    // Create extraction job record
    const { data: job, error: jobError } = await supabase
      .from('bulk_extraction_jobs')
      .insert({
        job_name: jobName,
        total_accounts: credentials.length,
        status: 'processing'
      })
      .select()
      .single();

    if (jobError) {
      console.error('Failed to create job record:', jobError);
      throw new Error('Failed to create extraction job');
    }

    console.log(`Created job ${job.id} for ${credentials.length} accounts`);

    // Process accounts with rate limiting
    const results: UserExtraction[] = [];
    let processedCount = 0;
    let successCount = 0;
    let failedCount = 0;
    let totalVehicles = 0;
    const errorLog: any[] = [];

    for (const cred of credentials) {
      try {
        console.log(`Processing account ${processedCount + 1}/${credentials.length}: ${cred.username}`);
        
        // Add delay to respect rate limits
        if (processedCount > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        }

        const userResult = await extractUserData(cred, job.id, supabase);
        results.push(userResult);
        
        if (userResult.error) {
          failedCount++;
          errorLog.push({
            username: cred.username,
            error: userResult.error,
            timestamp: new Date().toISOString()
          });
        } else {
          successCount++;
          totalVehicles += userResult.vehicles.length;
        }

        processedCount++;

        // Update job progress every 5 accounts
        if (processedCount % 5 === 0 || processedCount === credentials.length) {
          await supabase
            .from('bulk_extraction_jobs')
            .update({
              processed_accounts: processedCount,
              successful_accounts: successCount,
              failed_accounts: failedCount,
              total_vehicles: totalVehicles,
              updated_at: new Date().toISOString()
            })
            .eq('id', job.id);
        }

      } catch (error) {
        console.error(`Failed to process ${cred.username}:`, error);
        failedCount++;
        errorLog.push({
          username: cred.username,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        processedCount++;
      }
    }

    // Final job update
    const finalStatus = failedCount === credentials.length ? 'failed' : 'completed';
    await supabase
      .from('bulk_extraction_jobs')
      .update({
        status: finalStatus,
        processed_accounts: processedCount,
        successful_accounts: successCount,
        failed_accounts: failedCount,
        total_vehicles: totalVehicles,
        extracted_data: results,
        error_log: errorLog,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', job.id);

    console.log(`Bulk extraction completed. Success: ${successCount}, Failed: ${failedCount}, Total Vehicles: ${totalVehicles}`);

    return new Response(JSON.stringify({
      success: true,
      jobId: job.id,
      summary: {
        totalAccounts: credentials.length,
        processedAccounts: processedCount,
        successfulAccounts: successCount,
        failedAccounts: failedCount,
        totalVehicles: totalVehicles
      },
      results: results
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Bulk extraction error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function extractUserData(
  credentials: GP51Credentials, 
  jobId: string, 
  supabase: any
): Promise<UserExtraction> {
  try {
    // Step 1: Authenticate with GP51
    const token = await authenticateGP51(credentials);
    
    // Step 2: Get all vehicles for this user
    const vehicles = await getMonitorList(credentials.username, token);
    
    // Step 3: Get last positions for all vehicles
    const vehiclesWithPositions = await enrichWithPositions(vehicles, token);
    
    // Step 4: Store vehicles in database
    await storeVehicles(vehiclesWithPositions, credentials.username, jobId, supabase);

    return {
      gp51_username: credentials.username,
      gp51_user_token: token.substring(0, 10) + '...', // Partial token for logging
      vehicles: vehiclesWithPositions
    };

  } catch (error) {
    console.error(`Failed to extract data for ${credentials.username}:`, error);
    return {
      gp51_username: credentials.username,
      vehicles: [],
      error: error.message
    };
  }
}

async function authenticateGP51(credentials: GP51Credentials): Promise<string> {
  const md5Hash = await hashMD5(credentials.password);
  
  const authData = {
    action: 'login',
    username: credentials.username,
    password: md5Hash
  };

  console.log(`Authenticating ${credentials.username} with GP51...`);

  const GP51_API_BASE = Deno.env.get('GP51_API_BASE_URL') || 'https://www.gps51.com';
  const response = await fetch(`${GP51_API_BASE}/webapi`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(authData)
  });

  const result = await response.json();
  
  if (result.status !== 'success') {
    throw new Error(`GP51 auth failed: ${result.cause || 'Unknown error'}`);
  }

  console.log(`Successfully authenticated ${credentials.username}`);
  return result.token;
}

async function getMonitorList(username: string, token: string): Promise<GP51Vehicle[]> {
  console.log(`Fetching vehicle list for ${username}...`);

  const GP51_API_BASE = Deno.env.get('GP51_API_BASE_URL') || 'https://www.gps51.com';
  const response = await fetch(`${GP51_API_BASE}/webapi?action=querymonitorlist&token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  });

  const result = await response.json();
  
  if (result.status !== 'success') {
    throw new Error(`Failed to get monitor list: ${result.cause || 'Unknown error'}`);
  }

  console.log(`Found ${result.monitors?.length || 0} vehicles for ${username}`);
  return result.monitors || [];
}

async function enrichWithPositions(vehicles: GP51Vehicle[], token: string): Promise<GP51Vehicle[]> {
  if (!vehicles.length) return vehicles;

  const deviceIds = vehicles.map(v => v.deviceid);
  console.log(`Fetching positions for ${deviceIds.length} vehicles...`);

  try {
    const GP51_API_BASE = Deno.env.get('GP51_API_BASE_URL') || 'https://www.gps51.com';
    const response = await fetch(`${GP51_API_BASE}/webapi?action=lastposition&token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceids: deviceIds,
        lastquerypositiontime: 0
      })
    });

    const result = await response.json();
    
    if (result.status === 'success' && result.positions) {
      // Map positions back to vehicles
      const positionMap = new Map();
      result.positions.forEach((pos: any) => {
        positionMap.set(pos.deviceid, pos);
      });

      return vehicles.map(vehicle => ({
        ...vehicle,
        lastPosition: positionMap.get(vehicle.deviceid) || null
      }));
    }
  } catch (error) {
    console.error('Failed to fetch positions:', error);
  }

  return vehicles; // Return vehicles without positions if fetch fails
}

async function storeVehicles(
  vehicles: GP51Vehicle[], 
  username: string, 
  jobId: string, 
  supabase: any
): Promise<void> {
  console.log(`Storing ${vehicles.length} vehicles for ${username}...`);

  for (const vehicle of vehicles) {
    try {
      const vehicleData = {
        device_id: vehicle.deviceid,
        device_name: vehicle.devicename,
        extraction_job_id: jobId,
        gp51_username: username,
        sim_number: vehicle.simnum || null,
        status: vehicle.status || null,
        last_position: vehicle.lastPosition || null,
        gp51_metadata: {
          simnum: vehicle.simnum,
          lastactivetime: vehicle.lastactivetime,
          original_data: vehicle
        },
        is_active: true
      };

      // Use upsert to handle duplicates
      await supabase
        .from('vehicles')
        .upsert(vehicleData, { 
          onConflict: 'device_id',
          ignoreDuplicates: false 
        });

    } catch (error) {
      console.error(`Failed to store vehicle ${vehicle.deviceid}:`, error);
    }
  }
}

async function hashMD5(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
