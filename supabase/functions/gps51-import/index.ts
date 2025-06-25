
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  console.log(`🚀 [gps51-import] Starting GPS51 import process...`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { importType = 'full', options = {} } = await req.json();
    console.log(`📥 Import type: ${importType}, options:`, options);

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

    // Start import log
    const { data: importLog, error: logError } = await supabase
      .from('gps51_import_logs')
      .insert({
        import_type: importType,
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (logError) {
      console.error('Failed to create import log:', logError);
      throw logError;
    }

    console.log(`✅ Import log created: ${importLog.id}`);

    try {
      // Mock GP51 API data for testing (replace with actual API calls)
      const mockData = await getMockGP51Data();
      
      let results = {
        groups: { imported: 0, errors: 0 },
        devices: { imported: 0, errors: 0 },
        users: { imported: 0, errors: 0 },
        positions: { imported: 0, errors: 0 }
      };

      // Import groups first
      if (mockData.groups?.length > 0) {
        console.log(`📦 Importing ${mockData.groups.length} groups...`);
        for (const group of mockData.groups) {
          try {
            // FIXED: Using upsert without onConflict
            const { error } = await supabase
              .from('gps51_groups')
              .upsert({
                group_id: group.groupid,
                group_name: group.groupname,
                device_count: group.devices?.length || 0,
                remark: group.remark || null,
                last_sync: new Date().toISOString()
              }, {
                onConflict: 'group_id'
              });

            if (error) {
              console.error(`❌ Group import error:`, error);
              results.groups.errors++;
            } else {
              results.groups.imported++;
            }
          } catch (error) {
            console.error(`❌ Group processing error:`, error);
            results.groups.errors++;
          }
        }
      }

      // Import devices
      if (mockData.devices?.length > 0) {
        console.log(`🚗 Importing ${mockData.devices.length} devices...`);
        for (const device of mockData.devices) {
          try {
            // FIXED: Using upsert with proper onConflict
            const { error } = await supabase
              .from('gps51_devices')
              .upsert({
                device_id: device.deviceid,
                device_name: device.devicename,
                device_type: device.devicetype?.toString() || 'unknown',
                sim_number: device.simnum,
                group_id: device.groupid,
                is_active: device.isfree === 0,
                is_expired: device.isexpired === 1,
                last_active_time: device.lastactivetime ? new Date(device.lastactivetime * 1000).toISOString() : null,
                last_sync: new Date().toISOString()
              }, {
                onConflict: 'device_id'
              });

            if (error) {
              console.error(`❌ Device import error:`, error);
              results.devices.errors++;
            } else {
              results.devices.imported++;
            }
          } catch (error) {
            console.error(`❌ Device processing error:`, error);
            results.devices.errors++;
          }
        }
      }

      // Update import log with success
      await supabase
        .from('gps51_import_logs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          import_results: results,
          total_imported: results.groups.imported + results.devices.imported + results.users.imported + results.positions.imported,
          total_errors: results.groups.errors + results.devices.errors + results.users.errors + results.positions.errors
        })
        .eq('id', importLog.id);

      console.log(`✅ Import completed successfully:`, results);

      return new Response(JSON.stringify({
        success: true,
        importId: importLog.id,
        results,
        message: `Import completed successfully. Imported: ${results.groups.imported + results.devices.imported} items`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (importError) {
      console.error('❌ Import process failed:', importError);
      
      // Update import log with failure
      await supabase
        .from('gps51_import_logs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: importError.message
        })
        .eq('id', importLog.id);

      throw importError;
    }

  } catch (error) {
    console.error('❌ GPS51 import error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'GPS51 import process failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function getMockGP51Data() {
  // Mock data for testing - replace with actual GP51 API calls
  return {
    groups: [
      {
        groupid: 'group_001',
        groupname: 'Fleet A',
        remark: 'Primary fleet vehicles',
        devices: []
      },
      {
        groupid: 'group_002', 
        groupname: 'Fleet B',
        remark: 'Secondary fleet vehicles',
        devices: []
      }
    ],
    devices: [
      {
        deviceid: 'dev_001',
        devicename: 'Vehicle 001',
        devicetype: 1,
        simnum: '1234567890',
        groupid: 'group_001',
        isfree: 0,
        isexpired: 0,
        lastactivetime: Math.floor(Date.now() / 1000)
      },
      {
        deviceid: 'dev_002',
        devicename: 'Vehicle 002', 
        devicetype: 1,
        simnum: '1234567891',
        groupid: 'group_001',
        isfree: 1,
        isexpired: 0,
        lastactivetime: Math.floor(Date.now() / 1000) - 3600
      },
      {
        deviceid: 'dev_003',
        devicename: 'Vehicle 003',
        devicetype: 2,
        simnum: '1234567892',
        groupid: 'group_002',
        isfree: 0,
        isexpired: 1,
        lastactivetime: Math.floor(Date.now() / 1000) - 7200
      }
    ]
  };
}
