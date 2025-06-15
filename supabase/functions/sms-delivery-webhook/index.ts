
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { CORS_HEADERS } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload = await req.json();

    // Log the incoming webhook request for debugging and auditing
    await supabase.from('sms_webhook_logs').insert({
      provider: 'mysms',
      request_body: payload,
      request_headers: Object.fromEntries(req.headers),
    });

    const { message_id, status } = payload;
    if (!message_id || !status) {
      throw new Error('Invalid webhook payload. Missing message_id or status.');
    }

    const { error } = await supabase
      .from('sms_logs')
      .update({
        delivery_status: status.toLowerCase(),
        status_updated_at: new Date().toISOString(),
        provider_response: payload,
      })
      .eq('provider_message_id', message_id);

    if (error) {
      await supabase.from('sms_webhook_logs').update({
        is_processed: false,
        processing_error: error.message
      }).eq('request_body->>message_id', message_id);
      throw error;
    }

     await supabase.from('sms_webhook_logs').update({
        is_processed: true
     }).eq('request_body->>message_id', message_id);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
