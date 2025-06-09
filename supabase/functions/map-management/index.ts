
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

    console.log('Map management action:', action);

    switch (action) {
      case 'get-best-provider':
        return await getBestProvider(supabase);
      
      case 'get-active-key':
        return await getActiveMapKey(supabase);
      
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

      case 'get-fallback-provider':
        return await getFallbackProvider(supabase, payload.excludeConfigId);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Map management error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getBestProvider(supabase: any) {
  try {
    const { data, error } = await supabase.rpc('get_best_map_provider');
    
    if (error) {
      console.error('Error getting best provider:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to get best provider' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No active map providers configured' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get full config details
    const { data: configData, error: configError } = await supabase
      .from('map_api_configs')
      .select('*')
      .eq('id', data[0].config_id)
      .single();

    if (configError) {
      console.error('Error fetching config details:', configError);
      return new Response(
        JSON.stringify({ error: 'Failed to get provider details' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ provider: configData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in getBestProvider:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function getFallbackProvider(supabase: any, excludeConfigId: string) {
  try {
    const { data, error } = await supabase
      .from('map_api_configs')
      .select('*')
      .eq('is_active', true)
      .neq('id', excludeConfigId)
      .order('fallback_priority', { ascending: true })
      .limit(1);

    if (error || !data || data.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No fallback providers available' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ provider: data[0] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error getting fallback provider:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get fallback provider' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function getActiveMapKey(supabase: any) {
  try {
    const { data, error } = await supabase.rpc('get_active_map_api');
    
    if (error) {
      console.error('Error getting active map API:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to get active map API' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No active map API configured' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        apiKey: data[0].api_key,
        providerType: data[0].provider_type,
        configId: data[0].config_id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in getActiveMapKey:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function getMapConfigs(supabase: any) {
  try {
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
      JSON.stringify({ configs: data || [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in getMapConfigs:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function saveMapConfig(supabase: any, config: Partial<MapApiConfig>) {
  try {
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
  } catch (error) {
    console.error('Error in saveMapConfig:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function deleteMapConfig(supabase: any, id: string) {
  try {
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
  } catch (error) {
    console.error('Error in deleteMapConfig:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function incrementUsage(supabase: any, configId: string) {
  try {
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
  } catch (error) {
    console.error('Error in incrementUsage:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function performHealthCheck(supabase: any, { configId, status, responseTime, errorMessage }: any) {
  try {
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
  } catch (error) {
    console.error('Error in performHealthCheck:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function logFailover(supabase: any, { fromConfigId, toConfigId, reason }: any) {
  try {
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
  } catch (error) {
    console.error('Error in logFailover:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
