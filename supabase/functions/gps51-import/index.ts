
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { GP51UnifiedClient } from '../_shared/gp51_api_client_fixed.ts';
import { corsHeaders } from '../_shared/cors.ts';

interface ImportRequest {
  action: 'full_import' | 'groups' | 'devices' | 'positions' | 'users' | 'sync_positions';
  batchId?: string;
  options?: {
    skipExisting?: boolean;
    validateData?: boolean;
    syncPositions?: boolean;
  };
}

interface ImportProgress {
  batchId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRecords: number;
  processedRecords: number;
  successfulRecords: number;
  failedRecords: number;
  errors: string[];
  startedAt: string;
  completedAt?: string;
}

serve(async (req) => {
  console.log(`🚀 [gps51-import] Starting request processing...`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody: ImportRequest = await req.json();
    const { action, batchId, options = {} } = requestBody;
    
    console.log(`🔄 [gps51-import] Processing action: ${action}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get GP51 credentials
    const username = Deno.env.get('GP51_ADMIN_USERNAME') || 'octopus';
    const password = Deno.env.get('GP51_ADMIN_PASSWORD');
    
    if (!password) {
      throw new Error('GP51_ADMIN_PASSWORD not found in environment');
    }

    const client = new GP51UnifiedClient(username, password);
    const currentBatchId = batchId || crypto.randomUUID();

    // Create import log entry
    const { data: importLog, error: logError } = await supabase
      .from('gps51_import_logs')
      .insert({
        import_type: action,
        batch_id: currentBatchId,
        status: 'processing'
      })
      .select()
      .single();

    if (logError) {
      console.error('Failed to create import log:', logError);
    }

    let result;
    switch (action) {
      case 'full_import':
        result = await performFullImport(client, supabase, currentBatchId, options);
        break;
      case 'groups':
        result = await importGroups(client, supabase, currentBatchId);
        break;
      case 'devices':
        result = await importDevices(client, supabase, currentBatchId, options);
        break;
      case 'positions':
        result = await importPositions(client, supabase, currentBatchId, options);
        break;
      case 'users':
        result = await importUsers(client, supabase, currentBatchId);
        break;
      case 'sync_positions':
        result = await syncLatestPositions(client, supabase, currentBatchId);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Update import log with results
    if (importLog) {
      await supabase
        .from('gps51_import_logs')
        .update({
          status: result.success ? 'completed' : 'failed',
          completed_at: new Date().toISOString(),
          total_records: result.totalRecords,
          successful_records: result.successfulRecords,
          failed_records: result.failedRecords,
          error_details: result.errors,
          import_summary: result.summary
        })
        .eq('id', importLog.id);
    }

    return new Response(JSON.stringify({
      success: result.success,
      batchId: currentBatchId,
      data: result,
      message: `${action} completed successfully`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ [gps51-import] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function performFullImport(client: GP51UnifiedClient, supabase: any, batchId: string, options: any) {
  console.log(`🔄 [gps51-import] Starting full import...`);
  
  const results = {
    success: true,
    totalRecords: 0,
    successfulRecords: 0,
    failedRecords: 0,
    errors: [] as string[],
    summary: {}
  };

  try {
    // Step 1: Import Groups
    console.log(`📁 [gps51-import] Importing groups...`);
    const groupsResult = await importGroups(client, supabase, batchId);
    results.totalRecords += groupsResult.totalRecords;
    results.successfulRecords += groupsResult.successfulRecords;
    results.failedRecords += groupsResult.failedRecords;
    results.errors.push(...groupsResult.errors);

    // Step 2: Import Devices
    console.log(`📱 [gps51-import] Importing devices...`);
    const devicesResult = await importDevices(client, supabase, batchId, options);
    results.totalRecords += devicesResult.totalRecords;
    results.successfulRecords += devicesResult.successfulRecords;
    results.failedRecords += devicesResult.failedRecords;
    results.errors.push(...devicesResult.errors);

    // Step 3: Import Users
    console.log(`👥 [gps51-import] Importing users...`);
    const usersResult = await importUsers(client, supabase, batchId);
    results.totalRecords += usersResult.totalRecords;
    results.successfulRecords += usersResult.successfulRecords;
    results.failedRecords += usersResult.failedRecords;
    results.errors.push(...usersResult.errors);

    // Step 4: Sync Positions (if enabled)
    if (options.syncPositions) {
      console.log(`📍 [gps51-import] Syncing positions...`);
      const positionsResult = await syncLatestPositions(client, supabase, batchId);
      results.totalRecords += positionsResult.totalRecords;
      results.successfulRecords += positionsResult.successfulRecords;
      results.failedRecords += positionsResult.failedRecords;
      results.errors.push(...positionsResult.errors);
    }

    results.summary = {
      groups: groupsResult.successfulRecords,
      devices: devicesResult.successfulRecords,
      users: usersResult.successfulRecords,
      positions: options.syncPositions ? (await syncLatestPositions(client, supabase, batchId)).successfulRecords : 0
    };

    results.success = results.failedRecords === 0;
    
    console.log(`✅ [gps51-import] Full import completed: ${results.successfulRecords}/${results.totalRecords} successful`);
    return results;

  } catch (error) {
    console.error('❌ [gps51-import] Full import failed:', error);
    results.success = false;
    results.errors.push(error instanceof Error ? error.message : 'Unknown error');
    return results;
  }
}

async function importGroups(client: GP51UnifiedClient, supabase: any, batchId: string) {
  console.log(`📁 [gps51-import] Starting groups import...`);
  
  const result = {
    success: true,
    totalRecords: 0,
    successfulRecords: 0,
    failedRecords: 0,
    errors:[] as string[]
  };

  try {
    const hierarchyResult = await client.getDevicesHierarchy();
    
    if (!hierarchyResult.success) {
      throw new Error(hierarchyResult.message || 'Failed to fetch device hierarchy');
    }

    const groups = hierarchyResult.data.groups;
    result.totalRecords = groups.length;

    for (const group of groups) {
      try {
        await supabase
          .from('gps51_groups')
          .upsert({
            group_id: group.groupid,
            group_name: group.groupname,
            remark: group.remark || null,
            shared: group.shared || 0,
            device_count: group.devices?.length || 0,
            last_sync_at: new Date().toISOString()
          })
          .onConflict('group_id');

        result.successfulRecords++;
      } catch (error) {
        console.error(`Failed to import group ${group.groupid}:`, error);
        result.errors.push(`Group ${group.groupid}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        result.failedRecords++;
      }
    }

    result.success = result.failedRecords === 0;
    console.log(`✅ [gps51-import] Groups import completed: ${result.successfulRecords}/${result.totalRecords} successful`);
    return result;

  } catch (error) {
    console.error('❌ [gps51-import] Groups import failed:', error);
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    return result;
  }
}

async function importDevices(client: GP51UnifiedClient, supabase: any, batchId: string, options: any) {
  console.log(`📱 [gps51-import] Starting devices import...`);
  
  const result = {
    success: true,
    totalRecords: 0,
    successfulRecords: 0,
    failedRecords: 0,
    errors: [] as string[]
  };

  try {
    const hierarchyResult = await client.getDevicesHierarchy();
    
    if (!hierarchyResult.success) {
      throw new Error(hierarchyResult.message || 'Failed to fetch device hierarchy');
    }

    const devices = hierarchyResult.data.flatDevices;
    result.totalRecords = devices.length;

    for (const device of devices) {
      try {
        // Skip existing devices if option is set
        if (options.skipExisting) {
          const { data: existing } = await supabase
            .from('gps51_devices')
            .select('device_id')
            .eq('device_id', device.deviceid)
            .single();
          
          if (existing) {
            result.successfulRecords++;
            continue;
          }
        }

        await supabase
          .from('gps51_devices')
          .upsert({
            device_id: device.deviceid,
            device_name: device.devicename,
            device_type: device.devicetype,
            group_id: device.groupid,
            sim_number: device.simnum,
            sim_iccid: device.simiccid,
            create_time: device.createtime,
            init_loc_time: device.initloctime,
            first_loc_time: device.firstloctime,
            overdue_time: device.overduetime,
            expire_notify_time: device.expirenotifytime,
            precharge_years: device.prechargeyears || 0,
            remark: device.remark,
            remark2: device.remark2,
            creator: device.creater,
            video_channel_count: device.videochannelcount || 4,
            video_channel_setting: device.videochannelsetting,
            last_active_time: device.lastactivetime,
            is_free: device.isfree || 0,
            allow_edit: device.allowedit || 1,
            starred: device.starred || 0,
            icon: device.icon || 0,
            login_name: device.loginname,
            forward_id: device.forwardid,
            need_alarm_str: device.needalarmstr,
            offline_delay: device.offlinedelay || 30,
            car_tag_color: device.cartagcolor || 1,
            package_ids: device.packageids || 0,
            notify_phone_num_is_open: device.notifyphonenumisopen || 0,
            device_tag: device.devicetag,
            last_sync_at: new Date().toISOString()
          })
          .onConflict('device_id');

        result.successfulRecords++;
      } catch (error) {
        console.error(`Failed to import device ${device.deviceid}:`, error);
        result.errors.push(`Device ${device.deviceid}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        result.failedRecords++;
      }
    }

    result.success = result.failedRecords === 0;
    console.log(`✅ [gps51-import] Devices import completed: ${result.successfulRecords}/${result.totalRecords} successful`);
    return result;

  } catch (error) {
    console.error('❌ [gps51-import] Devices import failed:', error);
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    return result;
  }
}

async function importUsers(client: GP51UnifiedClient, supabase: any, batchId: string) {
  console.log(`👥 [gps51-import] Starting users import...`);
  
  const result = {
    success: true,
    totalRecords: 0,
    successfulRecords: 0,
    failedRecords: 0,
    errors: [] as string[]
  };

  try {
    const userDetails = await client.queryUserDetail();
    
    if (userDetails.status !== 0) {
      throw new Error(userDetails.cause || 'Failed to get user details');
    }

    result.totalRecords = 1; // Currently only supports current user

    try {
      await supabase
        .from('gps51_users')
        .upsert({
          gp51_username: userDetails.username,
          user_type: userDetails.usertype,
          nickname: userDetails.showname,
          company_name: userDetails.companyname,
          email: userDetails.email,
          phone: userDetails.phone,
          qq: userDetails.qq,
          wechat: userDetails.wechat,
          multi_login: userDetails.multilogin || 0,
          last_sync_at: new Date().toISOString()
        })
        .onConflict('gp51_username');

      result.successfulRecords++;
    } catch (error) {
      console.error(`Failed to import user ${userDetails.username}:`, error);
      result.errors.push(`User ${userDetails.username}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.failedRecords++;
    }

    result.success = result.failedRecords === 0;
    console.log(`✅ [gps51-import] Users import completed: ${result.successfulRecords}/${result.totalRecords} successful`);
    return result;

  } catch (error) {
    console.error('❌ [gps51-import] Users import failed:', error);
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    return result;
  }
}

async function syncLatestPositions(client: GP51UnifiedClient, supabase: any, batchId: string) {
  console.log(`📍 [gps51-import] Starting positions sync...`);
  
  const result = {
    success: true,
    totalRecords: 0,
    successfulRecords: 0,
    failedRecords: 0,
    errors: [] as string[]
  };

  try {
    const positionsResult = await client.getDevicesWithPositions();
    
    if (!positionsResult.success) {
      throw new Error(positionsResult.message || 'Failed to fetch device positions');
    }

    const positions = positionsResult.data.positions;
    result.totalRecords = positions.length;

    for (const position of positions) {
      try {
        await supabase
          .from('gps51_positions')
          .insert({
            device_id: position.deviceid,
            latitude: position.lat,
            longitude: position.lng,
            speed: position.speed || 0,
            course: position.course || 0,
            altitude: position.altitude || 0,
            gps_time: position.gpstime,
            server_time: position.servertime,
            status_code: position.status,
            address: position.address,
            mileage: position.mileage || 0,
            is_valid: true
          });

        result.successfulRecords++;
      } catch (error) {
        console.error(`Failed to import position for device ${position.deviceid}:`, error);
        result.errors.push(`Position ${position.deviceid}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        result.failedRecords++;
      }
    }

    result.success = result.failedRecords === 0;
    console.log(`✅ [gps51-import] Positions sync completed: ${result.successfulRecords}/${result.totalRecords} successful`);
    return result;

  } catch (error) {
    console.error('❌ [gps51-import] Positions sync failed:', error);
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    return result;
  }
}

async function importPositions(client: GP51UnifiedClient, supabase: any, batchId: string, options: any) {
  // For now, this is the same as syncLatestPositions
  // In the future, this could support historical position import
  return await syncLatestPositions(client, supabase, batchId);
}
