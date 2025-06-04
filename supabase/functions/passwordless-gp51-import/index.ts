
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PasswordlessImportJob {
  jobName: string;
  adminGp51Username: string;
  adminGp51Password: string;
  targetUsernames: string[];
}

interface GP51Vehicle {
  deviceid: string;
  devicename: string;
  simnum?: string;
  lastactivetime?: string;
  status?: string;
  lastPosition?: any;
}

interface UserImportResult {
  gp51_username: string;
  envio_user_id?: string;
  vehicles_count: number;
  success: boolean;
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

    const { jobName, adminGp51Username, adminGp51Password, targetUsernames }: PasswordlessImportJob = await req.json();

    if (!jobName || !adminGp51Username || !adminGp51Password || !targetUsernames || !Array.isArray(targetUsernames)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid request. jobName, adminGp51Username, adminGp51Password, and targetUsernames array required.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Starting passwordless import job: ${jobName} for ${targetUsernames.length} users`);

    // Create import job record
    const { data: job, error: jobError } = await supabase
      .from('user_import_jobs')
      .insert({
        job_name: jobName,
        import_type: 'passwordless',
        total_usernames: targetUsernames.length,
        admin_gp51_username: adminGp51Username,
        imported_usernames: targetUsernames,
        status: 'processing'
      })
      .select()
      .single();

    if (jobError) {
      console.error('Failed to create import job record:', jobError);
      throw new Error('Failed to create import job');
    }

    console.log(`Created import job ${job.id} for ${targetUsernames.length} users`);

    // Get admin GP51 token for data access
    const adminToken = await authenticateGP51({ username: adminGp51Username, password: adminGp51Password });

    // Process users with rate limiting
    const results: UserImportResult[] = [];
    let processedCount = 0;
    let successCount = 0;
    let failedCount = 0;
    let totalVehicles = 0;
    const errorLog: any[] = [];

    for (const username of targetUsernames) {
      try {
        console.log(`Processing user ${processedCount + 1}/${targetUsernames.length}: ${username}`);
        
        // Add delay to respect rate limits
        if (processedCount > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        }

        const userResult = await importUserPasswordless(username, adminToken, job.id, supabase);
        results.push(userResult);
        
        if (!userResult.success) {
          failedCount++;
          errorLog.push({
            username: username,
            error: userResult.error,
            timestamp: new Date().toISOString()
          });
        } else {
          successCount++;
          totalVehicles += userResult.vehicles_count;
        }

        processedCount++;

        // Update job progress every 5 users
        if (processedCount % 5 === 0 || processedCount === targetUsernames.length) {
          await supabase
            .from('user_import_jobs')
            .update({
              processed_usernames: processedCount,
              successful_imports: successCount,
              failed_imports: failedCount,
              total_vehicles_imported: totalVehicles,
              updated_at: new Date().toISOString()
            })
            .eq('id', job.id);
        }

      } catch (error) {
        console.error(`Failed to process ${username}:`, error);
        failedCount++;
        errorLog.push({
          username: username,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        processedCount++;
      }
    }

    // Final job update
    const finalStatus = failedCount === targetUsernames.length ? 'failed' : 'completed';
    await supabase
      .from('user_import_jobs')
      .update({
        status: finalStatus,
        processed_usernames: processedCount,
        successful_imports: successCount,
        failed_imports: failedCount,
        total_vehicles_imported: totalVehicles,
        import_results: results,
        error_log: errorLog,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', job.id);

    console.log(`Passwordless import completed. Success: ${successCount}, Failed: ${failedCount}, Total Vehicles: ${totalVehicles}`);

    return new Response(JSON.stringify({
      success: true,
      jobId: job.id,
      summary: {
        totalUsers: targetUsernames.length,
        processedUsers: processedCount,
        successfulImports: successCount,
        failedImports: failedCount,
        totalVehicles: totalVehicles
      },
      results: results
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Passwordless import error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function importUserPasswordless(
  gp51Username: string, 
  adminToken: string, 
  jobId: string, 
  supabase: any
): Promise<UserImportResult> {
  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('envio_users')
      .select('id')
      .eq('gp51_username', gp51Username)
      .single();

    if (existingUser) {
      throw new Error('User already imported');
    }

    // Get vehicles for this user using admin token
    const vehicles = await getMonitorListForUser(gp51Username, adminToken);
    
    // Get positions for vehicles
    const vehiclesWithPositions = await enrichWithPositions(vehicles, adminToken);
    
    // Create Envio user with temporary password
    const tempPassword = generateTempPassword();
    const envioUser = await createEnvioUser(gp51Username, tempPassword, supabase);
    
    // Store vehicles linked to this user
    await storeVehiclesForUser(vehiclesWithPositions, gp51Username, envioUser.id, jobId, supabase);

    return {
      gp51_username: gp51Username,
      envio_user_id: envioUser.id,
      vehicles_count: vehiclesWithPositions.length,
      success: true
    };

  } catch (error) {
    console.error(`Failed to import user ${gp51Username}:`, error);
    return {
      gp51_username: gp51Username,
      vehicles_count: 0,
      success: false,
      error: error.message
    };
  }
}

async function authenticateGP51(credentials: { username: string; password: string }): Promise<string> {
  const md5Hash = await hashMD5(credentials.password);
  
  const authData = {
    action: 'login',
    username: credentials.username,
    password: md5Hash
  };

  console.log(`Authenticating admin ${credentials.username} with GP51...`);

  const response = await fetch('https://www.gps51.com/webapi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(authData)
  });

  const result = await response.json();
  
  if (result.status !== 'success') {
    throw new Error(`GP51 admin auth failed: ${result.cause || 'Unknown error'}`);
  }

  console.log(`Successfully authenticated admin ${credentials.username}`);
  return result.token;
}

async function getMonitorListForUser(username: string, token: string): Promise<GP51Vehicle[]> {
  console.log(`Fetching vehicle list for ${username}...`);

  const response = await fetch(`https://www.gps51.com/webapi?action=querymonitorlist&token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  });

  const result = await response.json();
  
  if (result.status !== 'success') {
    throw new Error(`Failed to get monitor list for ${username}: ${result.cause || 'Unknown error'}`);
  }

  console.log(`Found ${result.monitors?.length || 0} vehicles for ${username}`);
  return result.monitors || [];
}

async function enrichWithPositions(vehicles: GP51Vehicle[], token: string): Promise<GP51Vehicle[]> {
  if (!vehicles.length) return vehicles;

  const deviceIds = vehicles.map(v => v.deviceid);
  console.log(`Fetching positions for ${deviceIds.length} vehicles...`);

  try {
    const response = await fetch(`https://www.gps51.com/webapi?action=lastposition&token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceids: deviceIds,
        lastquerypositiontime: 0
      })
    });

    const result = await response.json();
    
    if (result.status === 'success' && result.positions) {
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

  return vehicles;
}

async function createEnvioUser(gp51Username: string, tempPassword: string, supabase: any) {
  // Generate a temporary email for the user
  const tempEmail = `${gp51Username}@temp.gp51import.local`;
  
  // Create user in Supabase Auth with temporary password
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: tempEmail,
    password: tempPassword,
    email_confirm: true
  });

  if (authError) {
    throw new Error(`Failed to create auth user: ${authError.message}`);
  }

  // Create user in envio_users table
  const { data: envioUser, error: envioError } = await supabase
    .from('envio_users')
    .insert({
      id: authUser.user.id,
      name: gp51Username,
      email: tempEmail,
      gp51_username: gp51Username,
      is_gp51_imported: true,
      needs_password_set: true,
      import_source: 'passwordless_import'
    })
    .select()
    .single();

  if (envioError) {
    // Cleanup auth user if envio user creation fails
    await supabase.auth.admin.deleteUser(authUser.user.id);
    throw new Error(`Failed to create envio user: ${envioError.message}`);
  }

  return envioUser;
}

async function storeVehiclesForUser(
  vehicles: GP51Vehicle[], 
  gp51Username: string, 
  envioUserId: string,
  jobId: string, 
  supabase: any
): Promise<void> {
  console.log(`Storing ${vehicles.length} vehicles for ${gp51Username}...`);

  for (const vehicle of vehicles) {
    try {
      const vehicleData = {
        device_id: vehicle.deviceid,
        device_name: vehicle.devicename,
        envio_user_id: envioUserId,
        gp51_username: gp51Username,
        sim_number: vehicle.simnum || null,
        status: vehicle.status || null,
        last_position: vehicle.lastPosition || null,
        gp51_metadata: {
          simnum: vehicle.simnum,
          lastactivetime: vehicle.lastactivetime,
          original_data: vehicle
        },
        import_job_type: 'passwordless_import',
        is_active: true
      };

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

function generateTempPassword(): string {
  return 'temp_' + crypto.randomUUID().replace(/-/g, '');
}

async function hashMD5(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
