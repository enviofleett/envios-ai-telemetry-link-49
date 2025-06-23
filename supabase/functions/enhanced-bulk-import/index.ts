
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GP51ImportService, ImportOptions } from '../_shared/gp51_import_service.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log(`🚀 [enhanced-bulk-import] ${req.method} ${req.url}`);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, options } = body;

    console.log(`🔧 [enhanced-bulk-import] Action: ${action}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const importService = new GP51ImportService(supabaseUrl, supabaseServiceKey);

    switch (action) {
      case 'fetch_available_data': {
        console.log('📊 [enhanced-bulk-import] Fetching available data for import preview...');
        
        try {
          // Authenticate and get sample data for preview
          await importService.authenticate();
          
          const defaultUsername = Deno.env.get('GP51_ADMIN_USERNAME');
          if (!defaultUsername) {
            throw new Error('GP51 admin username not configured');
          }

          // Get sample data using the standard client
          const { gp51StandardClient } = await import('../_shared/gp51_standard_client.ts');
          const completeData = await gp51StandardClient.getCompleteUserData(defaultUsername);
          
          const statistics = {
            vehicles: completeData.devices.length,
            users: completeData.userDetail.username ? 1 : 0,
            groups: completeData.groups.length
          };

          console.log(`📊 [enhanced-bulk-import] Preview data:`, statistics);

          return new Response(JSON.stringify({
            success: true,
            summary: statistics,
            details: {
              vehicles: completeData.devices.slice(0, 5), // Show first 5 for preview
              users: completeData.userDetail.username ? [completeData.userDetail] : [],
              groups: completeData.groups.slice(0, 3) // Show first 3 groups for preview
            },
            message: statistics.vehicles > 0 
              ? `Found ${statistics.vehicles} vehicles, ${statistics.users} users, and ${statistics.groups} groups ready for import.`
              : 'Connection successful, but no data found. Please check GP51 account configuration.'
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });

        } catch (error) {
          console.error('❌ [enhanced-bulk-import] Preview failed:', error);
          
          return new Response(JSON.stringify({
            success: false,
            summary: { vehicles: 0, users: 0, groups: 0 },
            details: { vehicles: [], users: [], groups: [] },
            message: `Connection or data fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          }), {
            status: 200, // Return 200 for graceful handling in UI
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      case 'start_import': {
        console.log('🎯 [enhanced-bulk-import] Starting import process...');
        
        const importOptions: ImportOptions = {
          usernames: options?.usernames || undefined,
          importUsers: options?.importUsers !== false,
          importDevices: options?.importDevices !== false,
          conflictResolution: options?.conflictResolution || 'update'
        };

        console.log('📋 [enhanced-bulk-import] Import options:', importOptions);

        const result = await importService.performImport(importOptions);

        return new Response(JSON.stringify({
          success: result.success,
          statistics: result.statistics,
          message: result.message,
          errors: result.errors.slice(0, 10) // Limit errors in response
        }), {
          status: result.success ? 200 : 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        console.warn(`❌ Unknown action: ${action}`);
        return new Response(JSON.stringify({
          success: false,
          error: `Unknown action: ${action}`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    console.error('❌ [enhanced-bulk-import] Request processing failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
