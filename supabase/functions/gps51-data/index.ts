
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  console.log(`🔍 [gps51-data] Processing request...`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'dashboard_summary';
    
    console.log(`📊 Data request type: ${type}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    switch (type) {
      case 'dashboard_summary': {
        console.log('📊 Fetching dashboard summary...');
        
        // Get groups count
        const { count: groupsCount, error: groupsError } = await supabase
          .from('gps51_groups')
          .select('*', { count: 'exact', head: true });

        if (groupsError) {
          console.error('Groups count error:', groupsError);
        }

        // Get devices count and stats - handle both is_active and is_expired columns
        const { data: devices, count: devicesCount, error: devicesError } = await supabase
          .from('gps51_devices')
          .select('is_active, is_expired', { count: 'exact' });

        if (devicesError) {
          console.error('Devices count error:', devicesError);
        }

        // Get users count
        const { count: usersCount, error: usersError } = await supabase
          .from('gps51_users')
          .select('*', { count: 'exact', head: true });

        if (usersError) {
          console.error('Users count error:', usersError);
        }

        const activeDevices = devices?.filter(d => d.is_active)?.length || 0;
        const expiredDevices = devices?.filter(d => d.is_expired)?.length || 0;

        const summary = {
          total_devices: devicesCount || 0,
          active_devices: activeDevices,
          expired_devices: expiredDevices,
          total_groups: groupsCount || 0,
          total_users: usersCount || 0
        };

        console.log('✅ Dashboard summary:', summary);

        return new Response(JSON.stringify({
          success: true,
          data: summary
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'device_list': {
        console.log('🚗 Fetching device list...');
        
        const { data: devices, error } = await supabase
          .from('gps51_devices')
          .select(`
            *,
            gps51_groups!inner(group_name)
          `)
          .order('device_name')
          .limit(100);

        if (error) {
          console.error('Device list error:', error);
          throw error;
        }

        console.log(`✅ Found ${devices?.length || 0} devices`);

        return new Response(JSON.stringify({
          success: true,
          data: devices || []
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'group_list': {
        console.log('📦 Fetching group list...');
        
        const { data: groups, error } = await supabase
          .from('gps51_groups')
          .select('*')
          .order('group_name');

        if (error) {
          console.error('Group list error:', error);
          throw error;
        }

        console.log(`✅ Found ${groups?.length || 0} groups`);

        return new Response(JSON.stringify({
          success: true,
          data: groups || []
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'diagnostic': {
        console.log('🔍 Running diagnostic check...');

        const tests = [];

        // Test groups table
        try {
          const { count: groupsCount, error: groupsError } = await supabase
            .from('gps51_groups')
            .select('*', { count: 'exact', head: true });

          tests.push({
            name: 'GPS51 Groups Table',
            success: !groupsError,
            data: groupsCount || 0,
            error: groupsError?.message
          });
        } catch (error) {
          tests.push({
            name: 'GPS51 Groups Table',
            success: false,
            data: 0,
            error: error.message
          });
        }

        // Test devices table
        try {
          const { count: devicesCount, error: devicesError } = await supabase
            .from('gps51_devices')
            .select('*', { count: 'exact', head: true });

          tests.push({
            name: 'GPS51 Devices Table',
            success: !devicesError,
            data: devicesCount || 0,
            error: devicesError?.message
          });
        } catch (error) {
          tests.push({
            name: 'GPS51 Devices Table',
            success: false,
            data: 0,
            error: error.message
          });
        }

        // Test users table
        try {
          const { count: usersCount, error: usersError } = await supabase
            .from('gps51_users')
            .select('*', { count: 'exact', head: true });

          tests.push({
            name: 'GPS51 Users Table',
            success: !usersError,
            data: usersCount || 0,
            error: usersError?.message
          });
        } catch (error) {
          tests.push({
            name: 'GPS51 Users Table',
            success: false,
            data: 0,
            error: error.message
          });
        }

        console.log('✅ Diagnostic completed:', tests);

        return new Response(JSON.stringify({
          success: true,
          data: tests
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        return new Response(JSON.stringify({
          success: false,
          error: `Unknown data type: ${type}`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    console.error('❌ GPS51 data error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
