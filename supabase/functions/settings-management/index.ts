import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { CORS_HEADERS } from '../_shared/cors.ts';
import { 
  saveGP51Session, 
  getGP51Status, 
  saveSmtpSettings, 
  updateSmtpTestStatus,
  saveSmsSettings,
  getSmsSettings
} from './database.ts';
import { createHash } from "./crypto.ts";

async function getGP51Token(apiUrl: string, username: string, password_md5: string): Promise<string> {
    const loginUrl = `${apiUrl}/user/login`;
    const loginParams = new URLSearchParams({
        username,
        password: password_md5,
        autologin: '1'
    });

    const response = await fetch(`${loginUrl}?${loginParams.toString()}`);
    const data = await response.json();

    if (!data.success || !data.token) {
        throw new Error(data.error || 'Failed to authenticate with GP51');
    }
    return data.token;
}

serve(async (req) => {
  console.log(`[settings-management] Received request: ${req.method} ${req.url}`);
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const body = await req.json();
    const { action } = body;
    
    const loggableBody = { ...body };
    if (loggableBody.password) loggableBody.password = '********';
    if (loggableBody.smtp_password) loggableBody.smtp_password = '********';
    console.log(`[settings-management] Action: '${action}'. Body:`, loggableBody);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    console.log('[settings-management] Verifying user authentication...');
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        console.error('[settings-management] Authentication error: Missing Authorization header.');
        throw new Error('Missing Authorization header');
    }
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
        console.error('[settings-management] Authentication error: User not authenticated.');
        throw new Error('User not authenticated');
    }
    console.log(`[settings-management] User authenticated: ${user.email} (${user.id})`);


    switch (action) {
      case 'get-gp51-status': {
        console.log('[settings-management] Executing get-gp51-status action.');
        const data = await getGP51Status();
        return new Response(JSON.stringify(data), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
      }
      case 'save-gp51-credentials': {
        console.log('[settings-management] Executing save-gp51-credentials action.');
        const { username, password, apiUrl } = body;
        if (!username || !password) {
            console.error('[settings-management] Validation error: Username and password are required for GP51.');
            throw new Error('Username and password are required');
        }
        
        const password_md5 = createHash(password);
        const token = await getGP51Token(apiUrl, username, password_md5);

        const data = await saveGP51Session(username, token, apiUrl, user.id);
        console.log('[settings-management] GP51 credentials saved successfully.');
        return new Response(JSON.stringify({ success: true, data }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
      }
      case 'save-smtp-settings': {
        console.log('[settings-management] Executing save-smtp-settings action.');
        const data = await saveSmtpSettings(body);
        console.log('[settings-management] SMTP settings saved successfully.');
        return new Response(JSON.stringify({ success: true, data }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
      }
      case 'test-smtp-connection': {
        console.log('[settings-management] Executing test-smtp-connection action.');
        // This invokes another function, which will use the saved settings.
        const { data: invokeData, error: invokeError } = await supabase.functions.invoke('smtp-email-service', {
          body: {
            to: user.email,
            subject: 'SMTP Test Email',
            message: 'This is a test email to verify your SMTP configuration.',
          }
        });
        
        if (invokeError) {
          console.error('[settings-management] Error invoking smtp-email-service:', invokeError);
          throw invokeError;
        }
        
        console.log('[settings-management] SMTP test invocation result:', invokeData);
        const testStatus = invokeData.success ? 'success' : 'failure';
        const testMessage = invokeData.success ? 'Connection successful.' : invokeData.error || 'Test failed.';
        await updateSmtpTestStatus(testStatus, testMessage);
        
        return new Response(JSON.stringify(invokeData), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
      }
      case 'save-sms-settings': {
        console.log('[settings-management] Executing save-sms-settings action.');
        const data = await saveSmsSettings({ ...body, userId: user.id });
        console.log('[settings-management] SMS settings saved successfully.');
        return new Response(JSON.stringify({ success: true, data }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
      }
      case 'get-sms-settings': {
        console.log('[settings-management] Executing get-sms-settings action.');
        const data = await getSmsSettings(user.id);
        console.log('[settings-management] SMS settings retrieved.');
        return new Response(JSON.stringify({ success: true, data }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
      }
      default:
        console.error(`[settings-management] Invalid action received: '${action}'`);
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error(`[settings-management] Top-level error: ${error.message}`);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
