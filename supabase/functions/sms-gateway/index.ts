
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MySMSConfig {
  username: string;
  password: string;
  sender: string;
  route: number;
}

interface SMSRequest {
  action: 'send_sms' | 'test_config' | 'get_logs';
  recipient?: string;
  message?: string;
  event_type?: string;
  config?: MySMSConfig;
  page?: number;
  limit?: number;
}

async function sendSMSViaMySMS(config: MySMSConfig, recipient: string, message: string): Promise<any> {
  const params = new URLSearchParams({
    username: config.username,
    password: config.password,
    sender: config.sender,
    recipient: recipient,
    message: message,
    route: config.route.toString()
  });

  const url = `https://mysmstab.com/api/sendsms.php?${params.toString()}`;
  
  console.log(`📱 Sending SMS to ${recipient} via MySMS`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'FleetIQ-SMS/1.0'
      }
    });
    
    const responseText = await response.text();
    console.log(`MySMS Response: ${responseText}`);
    
    // MySMS typically returns success/error status in response
    const isSuccess = responseText.toLowerCase().includes('success') || 
                     responseText.toLowerCase().includes('sent') ||
                     response.status === 200;
    
    return {
      success: isSuccess,
      response: responseText,
      status_code: response.status
    };
  } catch (error) {
    console.error('MySMS API Error:', error);
    throw error;
  }
}

async function logSMSActivity(
  supabase: any, 
  userId: string, 
  recipient: string, 
  message: string, 
  eventType: string,
  status: string,
  providerResponse: any,
  errorMessage?: string
) {
  const logData = {
    user_id: userId,
    recipient_phone: recipient,
    message: message,
    event_type: eventType,
    status: status,
    provider_name: 'mysms',
    provider_response: providerResponse,
    sent_at: status === 'sent' ? new Date().toISOString() : null,
    failed_at: status === 'failed' ? new Date().toISOString() : null,
    error_message: errorMessage
  };

  const { error } = await supabase
    .from('sms_logs')
    .insert(logData);

  if (error) {
    console.error('Failed to log SMS activity:', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      throw new Error('Authentication failed');
    }

    const requestData: SMSRequest = await req.json();
    
    switch (requestData.action) {
      case 'send_sms': {
        if (!requestData.recipient || !requestData.message) {
          throw new Error('Recipient and message are required');
        }

        // Get user's SMS configuration
        const { data: smsConfig, error: configError } = await supabase
          .from('sms_configurations')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        if (configError || !smsConfig) {
          throw new Error('SMS configuration not found or inactive');
        }

        const config: MySMSConfig = {
          username: smsConfig.api_username,
          password: smsConfig.api_password_encrypted, // In production, this should be decrypted
          sender: smsConfig.sender_id,
          route: smsConfig.route
        };

        try {
          const result = await sendSMSViaMySMS(config, requestData.recipient, requestData.message);
          
          await logSMSActivity(
            supabase,
            user.id,
            requestData.recipient,
            requestData.message,
            requestData.event_type || 'CUSTOM',
            result.success ? 'sent' : 'failed',
            result,
            result.success ? undefined : result.response
          );

          return new Response(JSON.stringify({
            success: result.success,
            message: result.success ? 'SMS sent successfully' : 'SMS failed to send',
            provider_response: result.response
          }), {
            status: result.success ? 200 : 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });

        } catch (error) {
          await logSMSActivity(
            supabase,
            user.id,
            requestData.recipient,
            requestData.message,
            requestData.event_type || 'CUSTOM',
            'failed',
            {},
            error.message
          );

          throw error;
        }
      }

      case 'test_config': {
        if (!requestData.config) {
          throw new Error('SMS configuration required for testing');
        }

        try {
          const testResult = await sendSMSViaMySMS(
            requestData.config,
            requestData.recipient || '+2348012345678', // Test number
            'Test message from FleetIQ SMS Gateway'
          );

          return new Response(JSON.stringify({
            success: testResult.success,
            message: testResult.success ? 'SMS configuration test successful' : 'SMS configuration test failed',
            details: testResult.response
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });

        } catch (error) {
          return new Response(JSON.stringify({
            success: false,
            message: 'SMS configuration test failed',
            error: error.message
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      case 'get_logs': {
        const page = requestData.page || 1;
        const limit = requestData.limit || 50;
        const offset = (page - 1) * limit;

        const { data: logs, error: logsError } = await supabase
          .from('sms_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (logsError) {
          throw logsError;
        }

        const { count } = await supabase
          .from('sms_logs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        return new Response(JSON.stringify({
          success: true,
          logs: logs || [],
          pagination: {
            page,
            limit,
            total: count || 0,
            pages: Math.ceil((count || 0) / limit)
          }
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        throw new Error(`Unknown action: ${requestData.action}`);
    }

  } catch (error) {
    console.error('SMS Gateway error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
