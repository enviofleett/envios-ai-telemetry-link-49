
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { decrypt } from '../_shared/encryption.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAPTILER_API_URL = 'https://api.maptiler.com';

console.log('map-proxy function deployed');

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
      return new Response(JSON.stringify({ error: 'Unauthorized to access map proxy' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const { data: config, error: dbError } = await supabase
      .from('geocoding_configurations')
      .select('api_key_encrypted')
      .eq('user_id', user.id)
      .eq('provider_name', 'maptiler')
      .eq('is_active', true)
      .single();

    if (dbError || !config || !config.api_key_encrypted) {
      console.error(`No active MapTiler configuration found for user ${user.id}`, dbError);
      return new Response(JSON.stringify({ error: 'MapTiler is not configured or active.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    const encryptionKey = Deno.env.get('ENCRYPTION_KEY');
    if (!encryptionKey) {
      console.error('ENCRYPTION_KEY is not set for map-proxy.');
      throw new Error('Server configuration error.');
    }
    const apiKey = await decrypt(config.api_key_encrypted, encryptionKey);

    const url = new URL(req.url);
    const requestPath = url.pathname.split('/functions/v1/map-proxy')[1];

    if (!requestPath) {
        return new Response(JSON.stringify({ error: 'Invalid map proxy path' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
    
    const targetUrl = `${MAPTILER_API_URL}${requestPath}?key=${apiKey}`;
    
    const maptilerResponse = await fetch(targetUrl);

    if (!maptilerResponse.ok) {
        const errorText = await maptilerResponse.text();
        console.error(`Error from MapTiler API for path ${requestPath}:`, maptilerResponse.status, errorText);
        return new Response(errorText, {
            status: maptilerResponse.status,
            headers: { ...corsHeaders, 'Content-Type': maptilerResponse.headers.get('Content-Type') || 'text/plain' }
        });
    }

    if (requestPath.endsWith('style.json')) {
        const styleJson = await maptilerResponse.json();
        const functionUrl = `${Deno.env.get('SUPABASE_URL')!}/functions/v1/map-proxy`;

        if (styleJson.sprite) styleJson.sprite = styleJson.sprite.replace(MAPTILER_API_URL, functionUrl);
        if (styleJson.glyphs) styleJson.glyphs = styleJson.glyphs.replace(MAPTILER_API_URL, functionUrl);

        if (styleJson.sources) {
            for (const sourceKey in styleJson.sources) {
                const source = styleJson.sources[sourceKey];
                if (source.url) source.url = source.url.replace(MAPTILER_API_URL, functionUrl);
                if (source.tiles) {
                  source.tiles = source.tiles.map((tileUrl: string) => tileUrl.replace(MAPTILER_API_URL, functionUrl));
                }
            }
        }
        
        return new Response(JSON.stringify(styleJson), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }

    const responseHeaders = new Headers(maptilerResponse.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => responseHeaders.set(key, value));
    
    return new Response(maptilerResponse.body, {
        status: maptilerResponse.status,
        headers: responseHeaders,
    });

  } catch (error) {
    console.error('Error in map-proxy function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
