
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  console.log(`🔄 [gps51-import] Processing import request...`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { importType = 'full', options = {} } = await req.json();
    console.log(`📥 Import type: ${importType}`, options);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // For now, create sample data to demonstrate the system working
    if (importType === 'test' || importType === 'full') {
      console.log('🧪 Creating sample GPS51 data...');

      // Sample groups
      const sampleGroups = [
        { group_id: 'group_001', group_name: 'Fleet Alpha', device_count: 5, remark: 'Primary delivery fleet' },
        { group_id: 'group_002', group_name: 'Fleet Beta', device_count: 3, remark: 'Secondary fleet' },
        { group_id: 'group_003', group_name: 'Fleet Gamma', device_count: 2, remark: 'Test vehicles' }
      ];

      // Sample devices
      const sampleDevices = [
        { device_id: 'DEV001', device_name: 'Vehicle Alpha-1', group_id: 'group_001', device_type: 'GPS Tracker', sim_number: '1234567890', is_active: true, is_expired: false },
        { device_id: 'DEV002', device_name: 'Vehicle Alpha-2', group_id: 'group_001', device_type: 'GPS Tracker', sim_number: '1234567891', is_active: true, is_expired: false },
        { device_id: 'DEV003', device_name: 'Vehicle Beta-1', group_id: 'group_002', device_type: 'GPS Tracker', sim_number: '1234567892', is_active: false, is_expired: false },
        { device_id: 'DEV004', device_name: 'Vehicle Gamma-1', group_id: 'group_003', device_type: 'GPS Tracker', sim_number: '1234567893', is_active: true, is_expired: true }
      ];

      // Sample users
      const sampleUsers = [
        { username: 'admin_user', display_name: 'System Administrator', user_type: 1, user_type_text: 'Admin', device_count: 10 },
        { username: 'fleet_manager', display_name: 'Fleet Manager', user_type: 2, user_type_text: 'Manager', device_count: 8 }
      ];

      let groupsInserted = 0;
      let devicesInserted = 0;
      let usersInserted = 0;

      // Insert groups using upsert
      for (const group of sampleGroups) {
        const { error } = await supabase
          .from('gps51_groups')
          .upsert(group, { onConflict: 'group_id' });
        
        if (!error) groupsInserted++;
        else console.error('Group insert error:', error);
      }

      // Insert devices using upsert
      for (const device of sampleDevices) {
        const { error } = await supabase
          .from('gps51_devices')
          .upsert(device, { onConflict: 'device_id' });
        
        if (!error) devicesInserted++;
        else console.error('Device insert error:', error);
      }

      // Insert users using upsert
      for (const user of sampleUsers) {
        const { error } = await supabase
          .from('gps51_users')
          .upsert(user, { onConflict: 'username' });
        
        if (!error) usersInserted++;
        else console.error('User insert error:', error);
      }

      console.log(`✅ Import completed: ${groupsInserted} groups, ${devicesInserted} devices, ${usersInserted} users`);

      return new Response(JSON.stringify({
        success: true,
        message: 'Sample data imported successfully',
        results: {
          groups: groupsInserted,
          devices: devicesInserted,
          users: usersInserted
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Unsupported import type'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ GPS51 import error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
