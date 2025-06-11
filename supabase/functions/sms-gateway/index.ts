
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
  action: 'send_sms' | 'test_config' | 'get_logs' | 'update_status';
  recipient?: string;
  message?: string;
  event_type?: string;
  config?: MySMSConfig;
  page?: number;
  limit?: number;
  sms_log_id?: string;
  status?: string;
  delivery_details?: any;
}

// Encryption utility matching the frontend implementation
class CredentialEncryption {
  private static async getEncryptionKey(): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode('envio-sms-encryption-key-v1'),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode('envio-salt'),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  static async decrypt(encryptedData: string): Promise<string> {
    try {
      const key = await this.getEncryptionKey();
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );
      
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);
      
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );
      
      return new TextDecoder().decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt credentials');
    }
  }
}

async function sendSMSViaMySMS(config: MySMSConfig, recipient: string, message: string): Promise<any> {
  const baseUrl = 'https://app.mysmstab.com/api/sendsms.php';
  
  const params = new URLSearchParams({
    username: config.username,
    password: config.password,
    sender: config.sender,
    mobiles: recipient,
    message: encodeURIComponent(message),
    route: config.route.toString()
  });

  const url = `${baseUrl}?${params.toString()}`;
  
  console.log(`📱 Sending SMS to ${recipient} via MySMS API`);
  console.log(`🔗 API URL: ${url.replace(config.password, '***')}`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'FleetIQ-SMS/1.0'
      }
    });
    
    const responseText = await response.text();
    console.log(`📞 MySMS API Response (Status ${response.status}):`, responseText);
    
    const isSuccess = analyzeMysmstabResponse(responseText, response.status);
    
    return {
      success: isSuccess,
      response: responseText,
      status_code: response.status,
      delivery_id: extractDeliveryId(responseText) // Extract delivery ID for tracking
    };
  } catch (error) {
    console.error('❌ MySMS API Error:', error);
    throw error;
  }
}

function analyzeMysmstabResponse(responseText: string, statusCode: number): boolean {
  const lowerResponse = responseText.toLowerCase();
  
  if (lowerResponse.includes('success') || lowerResponse.includes('sent') || lowerResponse.includes('delivered')) {
    return true;
  }
  
  const errorIndicators = [
    'auth failed', 'authentication failed', 'invalid route', 'insufficient balance',
    'invalid sender', 'message empty', 'invalid mobile', 'error', 'failed',
    '404 not found', 'unauthorized'
  ];
  
  for (const indicator of errorIndicators) {
    if (lowerResponse.includes(indicator)) {
      return false;
    }
  }
  
  return statusCode === 200;
}

function extractDeliveryId(responseText: string): string | null {
  // Extract delivery ID from response for tracking purposes
  const deliveryIdMatch = responseText.match(/id[:\s]*([a-zA-Z0-9]+)/i);
  return deliveryIdMatch ? deliveryIdMatch[1] : null;
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
    error_message: errorMessage,
    delivery_id: providerResponse.delivery_id || null
  };

  const { data, error } = await supabase
    .from('sms_logs')
    .insert(logData)
    .select()
    .single();

  if (error) {
    console.error('Failed to log SMS activity:', error);
  } else {
    console.log('✅ SMS activity logged successfully:', data.id);
    return data.id; // Return log ID for tracking
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
    console.log(`📨 SMS Gateway Request: ${requestData.action}`);
    
    switch (requestData.action) {
      case 'send_sms': {
        if (!requestData.recipient || !requestData.message) {
          throw new Error('Recipient and message are required');
        }

        // Get user's SMS configuration with CORRECTED field names
        const { data: smsConfig, error: configError } = await supabase
          .from('sms_configurations')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        if (configError || !smsConfig) {
          throw new Error('SMS configuration not found or inactive');
        }

        // Decrypt the password
        let decryptedPassword: string;
        try {
          decryptedPassword = await CredentialEncryption.decrypt(smsConfig.api_password_encrypted);
        } catch (error) {
          console.error('Failed to decrypt SMS password:', error);
          throw new Error('Failed to decrypt SMS credentials');
        }

        const config: MySMSConfig = {
          username: smsConfig.api_username, // FIXED: use api_username from schema
          password: decryptedPassword, // FIXED: decrypt the password
          sender: smsConfig.sender_id,
          route: parseInt(smsConfig.route)
        };

        try {
          const result = await sendSMSViaMySMS(config, requestData.recipient, requestData.message);
          
          const smsLogId = await logSMSActivity(
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
            provider_response: result.response,
            sms_log_id: smsLogId,
            delivery_id: result.delivery_id
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

      case 'update_status': {
        // New action for updating SMS delivery status
        if (!requestData.sms_log_id || !requestData.status) {
          throw new Error('SMS log ID and status are required');
        }

        const { error: updateError } = await supabase
          .from('sms_logs')
          .update({
            status: requestData.status,
            provider_response: requestData.delivery_details || {},
            updated_at: new Date().toISOString()
          })
          .eq('id', requestData.sms_log_id)
          .eq('user_id', user.id); // Ensure user can only update their own logs

        if (updateError) {
          throw updateError;
        }

        return new Response(JSON.stringify({
          success: true,
          message: 'SMS status updated successfully'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'test_config': {
        if (!requestData.config) {
          throw new Error('SMS configuration required for testing');
        }

        try {
          const testResult = await sendSMSViaMySMS(
            requestData.config,
            requestData.recipient || '+2348012345678',
            'Test message from FleetIQ SMS Gateway - Configuration verified!'
          );

          return new Response(JSON.stringify({
            success: testResult.success,
            message: testResult.success ? 'SMS configuration test successful' : 'SMS configuration test failed',
            details: testResult.response,
            delivery_id: testResult.delivery_id
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
    console.error('❌ SMS Gateway error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
