
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { CORS_HEADERS } from '../_shared/cors.ts';
import { getSmsSettings, getSmsLogsPaginated } from "../_shared/database.ts";

const SMS_COST_PER_SEGMENT = 0.02; // Example cost in USD

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user || !user.id) throw new Error('User not authenticated');

    const body = await req.json();
    const { action } = body;

    // Fetch user SMS configuration for all actions except 'get_logs'. (For get_logs, still fetch for user_id scoping.)
    let config = null;
    if (action !== 'get_logs') {
      config = await getSmsSettings(user.id);
      if (!config) {
        throw new Error('SMS configuration not found for this user.');
      }
    }

    switch (action) {
      case 'send_sms': {
        const { recipient, message, event_type } = body;
        if (!recipient || !message) {
          throw new Error('Recipient and message are required.');
        }
        // Compose live API call
        const params = new URLSearchParams({
          username: config.username,
          password: config.password,
          sender: config.sender_id,
          recipient,
          message,
          action: 'send',
        });
        const smsApiUrl = `https://sms.mysmstab.com/api/?${params.toString()}`;
        const smsResponse = await fetch(smsApiUrl);
        let smsData: any = {};
        try {
          smsData = await smsResponse.json();
        } catch {
          // fallback: parse as text
          smsData = { error: 'Malformed provider response', raw: await smsResponse.text() };
        }

        if (smsData.error) {
          throw new Error(`SMS Provider Error: ${smsData.error}`);
        }

        // Estimate SMS cost, 160 chars per segment
        const segmentCount = Math.ceil(message.length / 160);
        const cost = segmentCount * SMS_COST_PER_SEGMENT;

        const insertRes = await supabase.from('sms_logs').insert({
          user_id: user.id,
          recipient_phone: recipient,
          message,
          event_type: event_type || "CUSTOM",
          status: 'submitted',
          provider_name: 'mysms',
          provider_message_id: smsData.message_id || smsData.id,
          cost,
          provider_response: smsData,
        });
        // No error throwing on log insert, let it slide if fails.

        // TODO: Optionally update usage/budget table here.

        return new Response(JSON.stringify({ success: true, ...smsData }), {
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
      }

      case 'get_balance': {
        // Use current (decrypted) credentials from config
        const params = new URLSearchParams({
          username: config.username,
          password: config.password,
          action: 'balance',
        });
        const balanceUrl = `https://sms.mysmstab.com/api/?${params.toString()}`;
        const balanceResponse = await fetch(balanceUrl);
        const balanceData = await balanceResponse.json();

        if (balanceData.error) {
          return new Response(JSON.stringify({ success: false, error: balanceData.error }), {
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
            status: 400
          });
        }

        return new Response(JSON.stringify({ success: true, balance: balanceData.balance }), {
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
      }

      case 'get_logs': {
        // Default pagination
        const page = Number(body.page) || 1;
        const limit = Number(body.limit) || 50;
        // Fetch paginated logs for this user
        const res = await getSmsLogsPaginated(user.id, page, limit, supabase);
        return new Response(JSON.stringify(res), {
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
      }

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
