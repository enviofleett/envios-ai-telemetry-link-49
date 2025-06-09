
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MapApiConfig {
  id?: string;
  name: string;
  api_key: string;
  provider_type: string;
  threshold_type: string;
  threshold_value: number;
  is_active: boolean;
  fallback_priority: number;
  provider_specific_config?: Record<string, any>;
  cost_per_request?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, ...payload } = await req.json();

    switch (action) {
      case 'get-best-provider':
        return await getBestProvider(supabase);
      
      case 'get-configs':
        return await getMapConfigs(supabase);
      
      case 'save-config':
        return await saveMapConfig(supabase, payload);
      
      case 'delete-config':
        return await deleteMapConfig(supabase, payload.id);
      
      case 'increment-usage':
        return await incrementUsage(supabase, payload.configId);
      
      case 'health-check':
        return await performHealthCheck(supabase, payload);
        
      case 'log-failover':
        return await logFailover(supabase, payload);

      case 'get-analytics':
        return await getAnalytics(supabase, payload);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Enhanced map management error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getBestProvider(supabase: any) {
  const { data, error } = await supabase.rpc('get_best_map_provider');
  
  if (error) {
    console.error('Error getting best provider:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get best provider' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ provider: data?.[0] || null }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getMapConfigs(supabase: any) {
  const { data, error } = await supabase
    .from('map_api_configs')
    .select(`
      *,
      map_api_usage(
        usage_date,
        request_count
      )
    `)
    .order('fallback_priority');

  if (error) {
    console.error('Error getting map configs:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get map configurations' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ configs: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function saveMapConfig(supabase: any, config: Partial<MapApiConfig>) {
  const { data, error } = await supabase
    .from('map_api_configs')
    .upsert({
      ...config,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving map config:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to save map configuration' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ config: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function deleteMapConfig(supabase: any, id: string) {
  const { error } = await supabase
    .from('map_api_configs')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting map config:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete map configuration' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function incrementUsage(supabase: any, configId: string) {
  const { error } = await supabase.rpc('increment_map_api_usage', {
    config_id: configId
  });

  if (error) {
    console.error('Error incrementing usage:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to increment usage' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function performHealthCheck(supabase: any, { configId, status, responseTime, errorMessage }: any) {
  const { error } = await supabase.rpc('log_map_provider_health', {
    p_config_id: configId,
    p_status: status,
    p_response_time: responseTime,
    p_error_message: errorMessage
  });

  if (error) {
    console.error('Error logging health check:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to log health check' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function logFailover(supabase: any, { fromConfigId, toConfigId, reason }: any) {
  const { error } = await supabase.rpc('log_map_failover', {
    p_from_config_id: fromConfigId,
    p_to_config_id: toConfigId,
    p_reason: reason
  });

  if (error) {
    console.error('Error logging failover:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to log failover' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getAnalytics(supabase: any, { timeRange = '7d' }: any) {
  const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  // Get usage analytics
  const { data: usageData, error: usageError } = await supabase
    .from('map_api_usage')
    .select(`
      usage_date,
      request_count,
      map_api_configs(name, provider_type)
    `)
    .gte('usage_date', fromDate.toISOString().split('T')[0]);

  // Get health metrics
  const { data: healthData, error: healthError } = await supabase
    .from('map_provider_health_logs')
    .select(`
      check_timestamp,
      status,
      response_time_ms,
      config_id,
      map_api_configs(name, provider_type)
    `)
    .gte('check_timestamp', fromDate.toISOString());

  // Get failover events
  const { data: failoverData, error: failoverError } = await supabase
    .from('map_failover_events')
    .select(`
      triggered_at,
      reason,
      from_config:map_api_configs!from_config_id(name, provider_type),
      to_config:map_api_configs!to_config_id(name, provider_type)
    `)
    .gte('triggered_at', fromDate.toISOString());

  if (usageError || healthError || failoverError) {
    console.error('Error getting analytics:', { usageError, healthError, failoverError });
    return new Response(
      JSON.stringify({ error: 'Failed to get analytics data' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ 
      usage: usageData || [],
      health: healthData || [],
      failovers: failoverData || []
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
