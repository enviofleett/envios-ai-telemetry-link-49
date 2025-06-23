
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

    // Validate GP51 environment configuration
    const gp51Username = Deno.env.get('GP51_ADMIN_USERNAME');
    const gp51Password = Deno.env.get('GP51_ADMIN_PASSWORD');
    
    if (!gp51Username || !gp51Password) {
      console.error('❌ [enhanced-bulk-import] GP51 credentials not configured');
      return new Response(JSON.stringify({
        success: false,
        error: 'GP51 credentials not configured',
        details: 'Please configure GP51_ADMIN_USERNAME and GP51_ADMIN_PASSWORD in Supabase secrets'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const importService = new GP51ImportService(supabaseUrl, supabaseServiceKey);

    switch (action) {
      case 'fetch_available_data': {
        console.log('📊 [enhanced-bulk-import] Fetching available data for import preview...');
        
        try {
          // Authenticate with GP51
          await importService.authenticate();
          console.log('✅ [enhanced-bulk-import] GP51 authentication successful');
          
          // Get sample data using the authenticated import service
          const previewResult = await importService.performImport({
            importUsers: true,
            importDevices: true,
            conflictResolution: 'skip' // Just for preview, don't actually import
          });
          
          if (previewResult.success) {
            const statistics = {
              vehicles: previewResult.statistics.devicesProcessed,
              users: previewResult.statistics.usersProcessed,
              groups: 0 // We'll add group counting later if needed
            };

            console.log(`📊 [enhanced-bulk-import] Preview data:`, statistics);

            return new Response(JSON.stringify({
              success: true,
              summary: statistics,
              details: {
                vehicles: [], // Preview data will be empty since we're using 'skip' mode
                users: [],
                groups: []
              },
              message: statistics.vehicles > 0 
                ? `Found ${statistics.vehicles} vehicles and ${statistics.users} users ready for import.`
                : 'Connection successful, but no data found. Please check GP51 account configuration.',
              authenticationStatus: {
                connected: true,
                username: gp51Username,
                authenticatedAt: new Date().toISOString()
              }
            }), {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          } else {
            throw new Error(previewResult.message);
          }

        } catch (error) {
          console.error('❌ [enhanced-bulk-import] Preview failed:', error);
          
          return new Response(JSON.stringify({
            success: false,
            summary: { vehicles: 0, users: 0, groups: 0 },
            details: { vehicles: [], users: [], groups: [] },
            message: `Connection or data fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            authenticationStatus: {
              connected: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }), {
            status: 200, // Return 200 for graceful handling in UI
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      case 'start_import': {
        console.log('🎯 [enhanced-bulk-import] Starting import process...');
        
        try {
          // Authenticate with GP51
          await importService.authenticate();
          console.log('✅ [enhanced-bulk-import] GP51 authentication successful for import');
          
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
            errors: result.errors.slice(0, 10), // Limit errors in response
            authenticationStatus: {
              connected: true,
              username: gp51Username
            }
          }), {
            status: result.success ? 200 : 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
          
        } catch (error) {
          console.error('❌ [enhanced-bulk-import] Import failed:', error);
          
          return new Response(JSON.stringify({
            success: false,
            statistics: {
              usersProcessed: 0,
              usersImported: 0,
              devicesProcessed: 0,
              devicesImported: 0,
              conflicts: 0
            },
            message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            errors: [error instanceof Error ? error.message : 'Unknown error'],
            authenticationStatus: {
              connected: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
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
