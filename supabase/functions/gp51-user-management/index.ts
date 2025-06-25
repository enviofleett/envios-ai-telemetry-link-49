
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { GP51UnifiedClient } from '../_shared/gp51_api_client_fixed.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  console.log(`🔧 [gp51-user-management] Starting request processing...`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();
    console.log(`🔄 [gp51-user-management] Processing action: ${action}`);

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

    switch (action) {
      case 'get_user_details': {
        const { targetUsername } = params;
        console.log(`👤 [gp51-user-management] Getting user details for: ${targetUsername || 'current user'}`);
        
        const result = await client.queryUserDetail(targetUsername);
        
        if (result.status === 0) {
          return new Response(JSON.stringify({
            success: true,
            data: {
              username: result.username,
              showname: result.showname,
              usertype: result.usertype,
              companyname: result.companyname,
              email: result.email,
              phone: result.phone,
              qq: result.qq,
              wechat: result.wechat,
              multilogin: result.multilogin,
            },
            message: 'User details retrieved successfully'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          throw new Error(result.cause || 'Failed to get user details');
        }
      }

      case 'get_current_user_info': {
        console.log(`👤 [gp51-user-management] Getting current user info`);
        
        const result = await client.queryUserDetail();
        
        if (result.status === 0) {
          // Map user types to readable names
          const userTypeMap: Record<number, string> = {
            3: 'Sub Admin',
            4: 'Company Admin', 
            11: 'End User',
            99: 'Device'
          };

          return new Response(JSON.stringify({
            success: true,
            data: {
              username: result.username,
              displayName: result.showname,
              userType: result.usertype,
              userTypeLabel: userTypeMap[result.usertype || 0] || 'Unknown',
              company: result.companyname,
              contact: {
                email: result.email,
                phone: result.phone,
                qq: result.qq,
                wechat: result.wechat,
              },
              permissions: {
                multiLogin: result.multilogin === 1,
              }
            },
            message: 'Current user info retrieved successfully'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          throw new Error(result.cause || 'Failed to get current user info');
        }
      }

      case 'export_user_data': {
        console.log(`📤 [gp51-user-management] Exporting user data`);
        
        const userDetails = await client.queryUserDetail();
        const devicesData = await client.getDevicesWithPositions();
        
        if (userDetails.status !== 0) {
          throw new Error(userDetails.cause || 'Failed to get user details');
        }

        if (!devicesData.success) {
          throw new Error(devicesData.message || 'Failed to get devices data');
        }

        const exportData = {
          userInfo: {
            username: userDetails.username,
            displayName: userDetails.showname,
            userType: userDetails.usertype,
            company: userDetails.companyname,
            contact: {
              email: userDetails.email,
              phone: userDetails.phone,
              qq: userDetails.qq,
              wechat: userDetails.wechat,
            }
          },
          devicesInfo: {
            totalDevices: devicesData.data.deviceCount,
            totalGroups: devicesData.data.groupCount,
            groups: devicesData.data.groups,
            devices: devicesData.data.devices,
          },
          exportTimestamp: new Date().toISOString(),
        };

        return new Response(JSON.stringify({
          success: true,
          data: exportData,
          message: `User data exported successfully (${devicesData.data.deviceCount} devices, ${devicesData.data.groupCount} groups)`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        console.error(`❌ Unknown action: ${action}`);
        return new Response(JSON.stringify({
          success: false,
          error: `Unknown action: ${action}`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    console.error('❌ [gp51-user-management] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
