
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
    const gp51GlobalToken = Deno.env.get('GP51_GLOBAL_API_TOKEN');
    
    if (!gp51Username || !gp51Password || !gp51GlobalToken) {
      console.error('❌ [enhanced-bulk-import] GP51 configuration incomplete');
      return new Response(JSON.stringify({
        success: false,
        error: 'GP51 configuration incomplete',
        details: 'Please configure GP51_ADMIN_USERNAME, GP51_ADMIN_PASSWORD, and GP51_GLOBAL_API_TOKEN in Supabase secrets'
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
          // Validate credentials are available
          const credentialsValid = await importService.authenticate();
          if (!credentialsValid) {
            throw new Error('GP51 credentials validation failed');
          }
          
          console.log('✅ [enhanced-bulk-import] GP51 credentials validated');
          
          // Get preview data using rate-limited requests
          const previewResult = await importService.performImport({
            importUsers: true,
            importDevices: true,
            conflictResolution: 'skip' // Preview mode
          });
          
          if (previewResult.success) {
            const statistics = {
              vehicles: previewResult.statistics.devicesProcessed,
              users: previewResult.statistics.usersProcessed,
              groups: 0
            };

            console.log(`📊 [enhanced-bulk-import] Preview data:`, statistics);

            const hasData = statistics.vehicles > 0 || statistics.users > 0;
            const message = hasData
              ? `Found ${statistics.vehicles} vehicles and ${statistics.users} users ready for import.`
              : 'Connection successful, but no data found. This may be due to GP51 rate limiting. Please try again in a few minutes or contact GP51 support.';

            return new Response(JSON.stringify({
              success: true,
              summary: statistics,
              details: {
                vehicles: [],
                users: [],
                groups: []
              },
              message,
              authenticationStatus: {
                connected: true,
                username: gp51Username,
                authenticatedAt: new Date().toISOString(),
                tokenStrategy: 'per-request-authentication-with-rate-limiting'
              },
              rateLimiting: {
                enabled: true,
                baseDelay: '3000ms',
                protection: 'IP rate limit protection active'
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
          
          // Check for specific GP51 rate limiting errors
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const isRateLimit = errorMessage.toLowerCase().includes('ip limit') || 
                            errorMessage.toLowerCase().includes('8902') ||
                            errorMessage.toLowerCase().includes('rate limit');

          const recommendedAction = isRateLimit
            ? 'GP51 is rate limiting requests from this IP. Try again in a few minutes or contact GP51 support for IP whitelisting.'
            : 'Check GP51 credentials and try again. Tokens expire very quickly (1-2 seconds).';

          return new Response(JSON.stringify({
            success: false,
            summary: { vehicles: 0, users: 0, groups: 0 },
            details: { vehicles: [], users: [], groups: [] },
            message: `Connection or data fetch failed: ${errorMessage}`,
            authenticationStatus: {
              connected: false,
              error: errorMessage,
              recommendation: recommendedAction,
              rateLimitDetected: isRateLimit
            }
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      case 'start_import': {
        console.log('🎯 [enhanced-bulk-import] Starting import process with rate limiting...');
        
        try {
          // Validate credentials are available
          const credentialsValid = await importService.authenticate();
          if (!credentialsValid) {
            throw new Error('GP51 credentials validation failed');
          }
          
          console.log('✅ [enhanced-bulk-import] GP51 credentials validated for import');
          
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
            errors: result.errors.slice(0, 10),
            authenticationStatus: {
              connected: true,
              username: gp51Username,
              tokenStrategy: 'per-request-authentication-with-rate-limiting'
            },
            rateLimiting: {
              enabled: true,
              protection: 'Rate limiting and exponential backoff applied'
            }
          }), {
            status: result.success ? 200 : 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
          
        } catch (error) {
          console.error('❌ [enhanced-bulk-import] Import failed:', error);
          
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const isRateLimit = errorMessage.toLowerCase().includes('ip limit') || 
                            errorMessage.toLowerCase().includes('8902');

          return new Response(JSON.stringify({
            success: false,
            statistics: {
              usersProcessed: 0,
              usersImported: 0,
              devicesProcessed: 0,
              devicesImported: 0,
              conflicts: 0
            },
            message: `Import failed: ${errorMessage}`,
            errors: [errorMessage],
            authenticationStatus: {
              connected: false,
              error: errorMessage,
              recommendation: isRateLimit 
                ? 'GP51 rate limiting detected. Contact GP51 support for IP whitelisting.'
                : 'Check GP51 credentials and try again.',
              rateLimitDetected: isRateLimit
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
