
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase_client.ts";

interface SyncConfiguration {
  id: string;
  sync_type: string;
  is_enabled: boolean;
  sync_interval_minutes: number;
  last_sync_at?: string;
  next_sync_at?: string;
  retry_count: number;
  max_retries: number;
  backoff_multiplier: number;
  sync_settings: any;
}

serve(async (req) => {
  try {
    const supabase = getSupabaseClient();
    console.log('🕐 Vehicle sync cron job started');

    // Get sync configurations that are enabled and due for sync
    const now = new Date();
    const { data: configs, error: configError } = await supabase
      .from('sync_configuration')
      .select('*')
      .eq('is_enabled', true)
      .or(`next_sync_at.is.null,next_sync_at.lte.${now.toISOString()}`);

    if (configError) {
      console.error('Failed to fetch sync configurations:', configError);
      return new Response(JSON.stringify({ error: configError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!configs || configs.length === 0) {
      console.log('ℹ️ No sync configurations due for execution');
      return new Response(JSON.stringify({ 
        message: 'No sync configurations due for execution',
        timestamp: now.toISOString()
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const results = [];

    for (const config of configs) {
      console.log(`🔄 Processing sync configuration: ${config.sync_type}`);
      
      try {
        // Calculate next sync time
        const nextSyncTime = new Date(now.getTime() + (config.sync_interval_minutes * 60 * 1000));

        // Call the live GP51 data fetch function
        const syncResponse = await supabase.functions.invoke('fetchLiveGp51Data', {
          body: { 
            syncType: config.sync_type,
            syncSettings: config.sync_settings
          }
        });

        if (syncResponse.error) {
          console.error(`❌ Sync failed for ${config.sync_type}:`, syncResponse.error);
          
          // Update configuration with failure info
          await supabase
            .from('sync_configuration')
            .update({
              retry_count: config.retry_count + 1,
              next_sync_at: config.retry_count < config.max_retries 
                ? new Date(now.getTime() + (Math.pow(config.backoff_multiplier, config.retry_count) * 60 * 1000)).toISOString()
                : nextSyncTime.toISOString()
            })
            .eq('id', config.id);

          results.push({
            sync_type: config.sync_type,
            status: 'failed',
            error: syncResponse.error.message,
            retry_count: config.retry_count + 1
          });
          continue;
        }

        // Update configuration with success info
        await supabase
          .from('sync_configuration')
          .update({
            last_sync_at: now.toISOString(),
            next_sync_at: nextSyncTime.toISOString(),
            retry_count: 0
          })
          .eq('id', config.id);

        console.log(`✅ Sync completed for ${config.sync_type}`);
        results.push({
          sync_type: config.sync_type,
          status: 'success',
          data: syncResponse.data,
          next_sync_at: nextSyncTime.toISOString()
        });

      } catch (error) {
        console.error(`❌ Error processing sync for ${config.sync_type}:`, error);
        results.push({
          sync_type: config.sync_type,
          status: 'error',
          error: error.message
        });
      }
    }

    console.log(`🏁 Cron job completed. Processed ${results.length} configurations`);

    return new Response(JSON.stringify({
      success: true,
      timestamp: now.toISOString(),
      processed_configs: results.length,
      results: results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Cron job error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
