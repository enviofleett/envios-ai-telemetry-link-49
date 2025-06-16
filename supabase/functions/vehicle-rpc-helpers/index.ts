
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, ...params } = await req.json()

    let result;

    switch (action) {
      case 'check_device_exists':
        result = await supabaseClient
          .from('vehicles')
          .select('gp51_device_id')
          .eq('gp51_device_id', params.device_id_param)
          .limit(1)
        break;

      case 'find_user_by_gp51_username':
        result = await supabaseClient
          .from('envio_users')
          .select('id, name')
          .eq('gp51_username', params.username_param)
          .limit(1)
        break;

      case 'link_vehicle_to_user':
        result = await supabaseClient
          .from('vehicles')
          .update({ 
            user_id: params.user_id_param,
            updated_at: new Date().toISOString()
          })
          .eq('gp51_device_id', params.device_id_param)
        break;

      case 'find_unassigned_vehicles_by_username':
        result = await supabaseClient
          .from('vehicles')
          .select('id, gp51_device_id')
          .eq('gp51_username', params.username_param)
          .is('user_id', null)
          .eq('is_active', true)
        break;

      case 'bulk_link_vehicles_to_user':
        result = await supabaseClient
          .from('vehicles')
          .update({ 
            user_id: params.user_id_param,
            updated_at: new Date().toISOString()
          })
          .eq('gp51_username', params.username_param)
          .is('user_id', null)
        break;

      default:
        throw new Error(`Unknown action: ${action}`)
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
