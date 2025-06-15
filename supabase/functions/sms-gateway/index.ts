import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { CORS_HEADERS } from '../_shared/cors.ts';
import { getSmsSettings } from "../_shared/database.ts";

const SMS_COST_PER_SEGMENT = 0.02; // Example cost in USD, can be moved to config

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
    if (!user) throw new Error('User not authenticated');

    const body = await req.json();
    const { action } = body;

    const config = await getSmsSettings(user.id);
    if (!config) {
      throw new Error('SMS configuration not found for this user.');
    }

    switch (action) {
      case 'send_sms': {
        const { recipient, message, event_type } = body;
        
        // TODO: Implement rate limiting check from user_sms_usage
        // TODO: Implement cost check against user_sms_limits budget

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
        const smsData = await smsResponse.json();

        if (smsData.error) {
            throw new Error(`SMS Provider Error: ${smsData.error}`);
        }

        const cost = (message.length / 160) * SMS_COST_PER_SEGMENT;

        await supabase.from('sms_logs').insert({
            user_id: user.id,
            recipient_phone: recipient,
            message,
            event_type,
            status: 'submitted',
            provider_name: 'mysms',
            provider_message_id: smsData.message_id,
            cost,
            provider_response: smsData,
        });

        // TODO: Update user_sms_usage table

        return new Response(JSON.stringify({ success: true, ...smsData }), {
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
      }
      case 'get_balance': {
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
