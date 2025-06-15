
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { decrypt } from '../_shared/encryption.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_MAPS_API_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const MAPTILER_API_URL = 'https://api.maptiler.com/geocoding';

console.log('geocoding-proxy function deployed');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const { provider, lat, lon, isTest = false } = await req.json();

    if (!provider || typeof lat !== 'number' || typeof lon !== 'number') {
      return new Response(JSON.stringify({ error: 'Missing required parameters: provider, lat, lon' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { data: config, error: dbError } = await supabase
      .from('geocoding_configurations')
      .select('api_key_encrypted')
      .eq('user_id', user.id)
      .eq('provider_name', provider)
      .eq('is_active', true)
      .single();

    if (dbError || !config || !config.api_key_encrypted) {
      console.error(`No active configuration found for user ${user.id} and provider ${provider}`, dbError);
      return new Response(JSON.stringify({ error: `Geocoding provider ${provider} is not configured or active.` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    const encryptionKey = Deno.env.get('ENCRYPTION_KEY');
    if (!encryptionKey) {
      console.error('ENCRYPTION_KEY is not set in environment variables.');
      throw new Error('Server configuration error.');
    }
    const apiKey = await decrypt(config.api_key_encrypted, encryptionKey);

    let geocodingResponse;
    if (provider === 'google-maps') {
      const url = `${GOOGLE_MAPS_API_URL}?latlng=${lat},${lon}&key=${apiKey}`;
      geocodingResponse = await fetch(url);
    } else if (provider === 'maptiler') {
      const url = `${MAPTILER_API_URL}/${lon},${lat}.json?key=${apiKey}`;
      geocodingResponse = await fetch(url);
    } else {
      return new Response(JSON.stringify({ error: `Unsupported provider: ${provider}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    if (!geocodingResponse.ok) {
      const errorText = await geocodingResponse.text();
      console.error(`Error from ${provider} API:`, geocodingResponse.status, errorText);
      throw new Error(`Failed to fetch from ${provider}. Status: ${geocodingResponse.status}`);
    }

    if (isTest) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const data = await geocodingResponse.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in geocoding-proxy function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
