
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { action, liveData, importConfig, jobId } = await req.json();
    
    console.log('GP51 Live Import request:', action);

    if (action === 'start_import') {
      return await handleStartImport(supabase, liveData, importConfig);
    } else if (action === 'get_progress') {
      return await handleGetProgress(supabase, jobId);
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('GP51 Live Import error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleStartImport(supabase: any, liveData: any, importConfig: any) {
  console.log('Starting GP51 live import...');
  
  const selectedUsers = liveData.users.filter((user: any) => 
    importConfig.selectedUserIds.includes(user.username)
  );
  
  const selectedDevices = liveData.devices.filter((device: any) => 
    importConfig.selectedDeviceIds.includes(device.deviceid)
  );

  const totalItems = 
    (importConfig.importUsers ? selectedUsers.length : 0) +
    (importConfig.importDevices ? selectedDevices.length : 0);

  // Create import job record
  const { data: jobData, error: jobError } = await supabase
    .from('csv_import_jobs')
    .insert({
      job_name: `GP51 Live Import - ${new Date().toISOString()}`,
      file_name: 'GP51 Live Platform',
      total_rows: totalItems,
      status: 'processing',
      created_by: null // Will be set by RLS
    })
    .select()
    .single();

  if (jobError) {
    console.error('Failed to create import job:', jobError);
    throw jobError;
  }

  const job = {
    id: jobData.id,
    status: 'processing',
    progress: 0,
    totalItems,
    processedItems: 0,
    successfulItems: 0,
    failedItems: 0,
    startedAt: new Date().toISOString(),
    results: {
      users: { created: 0, updated: 0, failed: 0 },
      devices: { created: 0, updated: 0, failed: 0 }
    },
    errors: []
  };

  // Process import in background
  processImportAsync(supabase, jobData.id, selectedUsers, selectedDevices, importConfig);

  return new Response(
    JSON.stringify({ job }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleGetProgress(supabase: any, jobId: string) {
  const { data: jobData, error } = await supabase
    .from('csv_import_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error || !jobData) {
    return new Response(
      JSON.stringify({ error: 'Job not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const job = {
    id: jobData.id,
    status: jobData.status,
    progress: jobData.progress_percentage || 0,
    totalItems: jobData.total_rows,
    processedItems: jobData.processed_rows || 0,
    successfulItems: jobData.successful_imports || 0,
    failedItems: jobData.failed_imports || 0,
    startedAt: jobData.created_at,
    completedAt: jobData.completed_at,
    results: jobData.import_results || {
      users: { created: 0, updated: 0, failed: 0 },
      devices: { created: 0, updated: 0, failed: 0 }
    },
    errors: jobData.error_log || []
  };

  return new Response(
    JSON.stringify({ job }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function processImportAsync(
  supabase: any, 
  jobId: string, 
  users: any[], 
  devices: any[], 
  config: any
) {
  const results = {
    users: { created: 0, updated: 0, failed: 0 },
    devices: { created: 0, updated: 0, failed: 0 }
  };
  const errors: string[] = [];
  
  let processedItems = 0;
  const totalItems = users.length + devices.length;

  try {
    // Process users
    if (config.importUsers) {
      for (const user of users) {
        try {
          // Check if user exists
          const { data: existingUser } = await supabase
            .from('envio_users')
            .select('id')
            .eq('email', `${user.username}@gp51.local`)
            .single();

          if (existingUser && config.conflictResolution === 'skip') {
            console.log(`Skipping existing user: ${user.username}`);
          } else {
            const userData = {
              name: user.username,
              email: `${user.username}@gp51.local`,
              phone_number: user.phone || '',
              gp51_username: user.username,
              gp51_user_type: user.usertype,
              is_gp51_imported: true,
              import_source: 'gp51_live'
            };

            if (existingUser) {
              // Update existing user
              await supabase
                .from('envio_users')
                .update(userData)
                .eq('id', existingUser.id);
              results.users.updated++;
            } else {
              // Create new user
              await supabase
                .from('envio_users')
                .insert(userData);
              results.users.created++;
            }
          }
        } catch (error) {
          console.error(`Failed to process user ${user.username}:`, error);
          errors.push(`User ${user.username}: ${error.message}`);
          results.users.failed++;
        }

        processedItems++;
        await updateJobProgress(supabase, jobId, processedItems, totalItems, results, errors);
      }
    }

    // Process devices
    if (config.importDevices) {
      for (const device of devices) {
        try {
          // Check if device exists
          const { data: existingDevice } = await supabase
            .from('vehicles')
            .select('id')
            .eq('device_id', device.deviceid)
            .single();

          if (existingDevice && config.conflictResolution === 'skip') {
            console.log(`Skipping existing device: ${device.deviceid}`);
          } else {
            const deviceData = {
              device_id: device.deviceid,
              device_name: device.devicename,
              device_type: device.devicetype.toString(),
              sim_number: device.simnum,
              status: 'active',
              is_active: true,
              gp51_metadata: {
                isfree: device.isfree,
                allowedit: device.allowedit,
                icon: device.icon,
                stared: device.stared,
                loginame: device.loginame,
                overduetime: device.overduetime,
                videochannelcount: device.videochannelcount,
                lastactivetime: device.lastactivetime
              }
            };

            if (existingDevice) {
              // Update existing device
              await supabase
                .from('vehicles')
                .update(deviceData)
                .eq('id', existingDevice.id);
              results.devices.updated++;
            } else {
              // Create new device
              await supabase
                .from('vehicles')
                .insert(deviceData);
              results.devices.created++;
            }
          }
        } catch (error) {
          console.error(`Failed to process device ${device.deviceid}:`, error);
          errors.push(`Device ${device.deviceid}: ${error.message}`);
          results.devices.failed++;
        }

        processedItems++;
        await updateJobProgress(supabase, jobId, processedItems, totalItems, results, errors);
      }
    }

    // Mark job as completed
    await supabase
      .from('csv_import_jobs')
      .update({
        status: 'completed',
        progress_percentage: 100,
        processed_rows: processedItems,
        successful_imports: results.users.created + results.users.updated + results.devices.created + results.devices.updated,
        failed_imports: results.users.failed + results.devices.failed,
        import_results: results,
        error_log: errors,
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId);

    console.log('GP51 live import completed successfully');

  } catch (error) {
    console.error('GP51 live import failed:', error);
    
    await supabase
      .from('csv_import_jobs')
      .update({
        status: 'failed',
        processed_rows: processedItems,
        import_results: results,
        error_log: [...errors, error.message]
      })
      .eq('id', jobId);
  }
}

async function updateJobProgress(
  supabase: any, 
  jobId: string, 
  processedItems: number, 
  totalItems: number, 
  results: any, 
  errors: string[]
) {
  const progress = Math.round((processedItems / totalItems) * 100);
  
  await supabase
    .from('csv_import_jobs')
    .update({
      progress_percentage: progress,
      processed_rows: processedItems,
      successful_imports: results.users.created + results.users.updated + results.devices.created + results.devices.updated,
      failed_imports: results.users.failed + results.devices.failed,
      import_results: results,
      error_log: errors
    })
    .eq('id', jobId);
}
