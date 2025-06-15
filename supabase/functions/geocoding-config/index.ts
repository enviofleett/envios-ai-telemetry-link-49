
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encrypt } from '../_shared/encryption.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('geocoding-config function deployed');

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
    
    const { provider, apiKey, isPrimary } = await req.json();

    if (!provider || !apiKey) {
      throw new Error('Provider and API key are required.');
    }

    const encryptionKey = Deno.env.get('ENCRYPTION_KEY');
    if (!encryptionKey) {
      console.error('ENCRYPTION_KEY is not set.');
      throw new Error('Server configuration error: ENCRYPTION_KEY is not set.');
    }
    
    const encryptedKey = await encrypt(apiKey, encryptionKey);

    const { error: rpcError } = await supabase.rpc('upsert_geocoding_configuration', {
      p_provider_name: provider,
      p_api_key_encrypted: encryptedKey,
      p_is_active: true,
      p_primary_provider: isPrimary,
    });

    if (rpcError) throw rpcError;

    return new Response(JSON.stringify({ success: true, message: `Configuration for ${provider} saved securely.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in geocoding-config function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
