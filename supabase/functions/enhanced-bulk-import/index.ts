
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { GP51UnifiedClient } from '../_shared/gp51_api_client_fixed.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  console.log(`🚀 [enhanced-bulk-import] Starting request processing...`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action } = await req.json();
    console.log(`🔄 [enhanced-bulk-import] Processing action: ${action}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    switch (action) {
      case 'get_import_preview':
        return await handleGetImportPreview(supabase);
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
    console.error('❌ [enhanced-bulk-import] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function handleGetImportPreview(supabase: any) {
  try {
    console.log(`🔄 [enhanced-bulk-import] Fetching available data from GP51...`);

    // Get credentials
    const username = Deno.env.get('GP51_ADMIN_USERNAME') || 'octopus';
    const password = Deno.env.get('GP51_ADMIN_PASSWORD');
    
    if (!password) {
      throw new Error('GP51_ADMIN_PASSWORD not found in environment');
    }

    console.log(`✅ [enhanced-bulk-import] Using credentials for user: ${username}`);

    // Use the corrected GP51 client
    console.log(`🌳 [enhanced-bulk-import] Calling corrected querymonitorlist API...`);
    
    const client = new GP51UnifiedClient(username, password);
    const result = await client.getDevicesHierarchy();

    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch devices hierarchy');
    }

    console.log(`✅ [enhanced-bulk-import] Successfully retrieved devices data`);

    // Transform the data for preview
    const { groups, flatDevices, deviceCount, groupCount } = result.data;
    
    const preview = {
      summary: {
        totalGroups: groupCount,
        totalDevices: deviceCount,
        availableForImport: deviceCount
      },
      groups: groups.map((group: any) => ({
        groupId: group.groupid,
        groupName: group.groupname,
        deviceCount: group.devices?.length || 0,
        devices: group.devices?.slice(0, 5).map((device: any) => ({
          deviceId: device.deviceid,
          deviceName: device.devicename,
          deviceType: device.devicetype,
          simNumber: device.simnum,
          isActive: device.isfree === 0
        })) || []
      })),
      sampleDevices: flatDevices.slice(0, 10).map((device: any) => ({
        deviceId: device.deviceid,
        deviceName: device.devicename,
        deviceType: device.devicetype,
        simNumber: device.simnum,
        creator: device.creater,
        lastActiveTime: device.lastactivetime,
        isActive: device.isfree === 0
      }))
    };

    return new Response(JSON.stringify({
      success: true,
      data: preview,
      message: `Found ${deviceCount} devices in ${groupCount} groups ready for import`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`❌ [enhanced-bulk-import] GP51 querymonitorlist failed:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch GP51 data',
      details: 'Using corrected GP51 client with querymonitorlist method'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
