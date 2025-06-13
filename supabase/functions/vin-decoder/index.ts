
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VinDecodeRequest {
  vin: string;
}

interface VinDecodeResponse {
  success: boolean;
  data?: {
    make: string;
    model: string;
    year: string;
    [key: string]: any;
  };
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { vin }: VinDecodeRequest = await req.json();

    if (!vin || vin.length !== 17) {
      return new Response(
        JSON.stringify({ error: 'Invalid VIN. VIN must be exactly 17 characters.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get VIN API configuration
    const { data: config, error: configError } = await supabase
      .from('vin_api_configurations')
      .select('*')
      .eq('is_active', true)
      .eq('primary_provider', true)
      .single();

    if (configError || !config) {
      return new Response(
        JSON.stringify({ error: 'VIN API configuration not found. Please contact administrator.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate signature for vindecoder.eu API
    const requestId = crypto.randomUUID();
    const apiKey = config.api_key_encrypted; // In production, decrypt this
    const secretKey = config.secret_key_encrypted; // In production, decrypt this
    
    // Create signature according to vindecoder.eu API docs
    const signatureString = `${apiKey}|${vin}|${requestId}|${secretKey}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(signatureString);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const startTime = Date.now();

    try {
      // Call vindecoder.eu API
      const vinApiResponse = await fetch(`https://api.vindecoder.eu/3.2/${apiKey}/${signature}/${requestId}/decode/${vin}.json`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const responseTime = Date.now() - startTime;
      const vinData = await vinApiResponse.json();

      let result: VinDecodeResponse;

      if (vinApiResponse.ok && vinData.success !== false) {
        // Extract relevant data
        const extractedData = {
          make: vinData.Make || vinData.make || '',
          model: vinData.Model || vinData.model || '',
          year: vinData['Model Year'] || vinData.year || vinData.modelYear || '',
          engine: vinData.Engine || vinData.engine || '',
          fuelType: vinData['Fuel Type'] || vinData.fuelType || '',
          bodyStyle: vinData['Body Style'] || vinData.bodyStyle || '',
        };

        result = {
          success: true,
          data: extractedData
        };

        // Log successful decode
        await supabase.from('vin_decode_history').insert({
          user_id: user.id,
          vin: vin,
          provider_name: config.provider_name,
          decode_success: true,
          decoded_data: vinData,
          api_response_time_ms: responseTime
        });

      } else {
        const errorMessage = vinData.error || vinData.message || 'VIN decode failed';
        result = {
          success: false,
          error: errorMessage
        };

        // Log failed decode
        await supabase.from('vin_decode_history').insert({
          user_id: user.id,
          vin: vin,
          provider_name: config.provider_name,
          decode_success: false,
          error_message: errorMessage,
          api_response_time_ms: responseTime
        });
      }

      return new Response(
        JSON.stringify(result),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (apiError) {
      const errorMessage = apiError instanceof Error ? apiError.message : 'VIN API service unavailable';
      
      // Log API error
      await supabase.from('vin_decode_history').insert({
        user_id: user.id,
        vin: vin,
        provider_name: config.provider_name,
        decode_success: false,
        error_message: errorMessage,
        api_response_time_ms: Date.now() - startTime
      });

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'VIN decoding service temporarily unavailable. Please try again later.' 
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('VIN decoder error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
