
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MapApiConfig {
  id: string;
  name: string;
  api_key: string;
  provider_type: string;
  threshold_type: string;
  threshold_value: number;
  is_active: boolean;
  fallback_priority: number;
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
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Map management error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getActiveMapKey(supabase: any) {
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
