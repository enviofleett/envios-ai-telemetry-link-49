
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { CORS_HEADERS } from '../_shared/cors.ts';
import { saveGP51Session, getGP51Status, saveSmtpSettings, updateSmtpTestStatus } from './database.ts';
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const body = await req.json();
    const { action } = body;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) throw new Error('User not authenticated');


    switch (action) {
      case 'get-gp51-status': {
        const data = await getGP51Status();
        return new Response(JSON.stringify(data), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
      }
      case 'save-gp51-credentials': {
        const { username, password, apiUrl } = body;
        if (!username || !password) throw new Error('Username and password are required');
        
        const password_md5 = createHash(password);
        const token = await getGP51Token(apiUrl, username, password_md5);

        const data = await saveGP51Session(username, token, apiUrl, user.id);
        return new Response(JSON.stringify({ success: true, data }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
      }
      case 'save-smtp-settings': {
        const data = await saveSmtpSettings(body);
        return new Response(JSON.stringify({ success: true, data }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
      }
      case 'test-smtp-connection': {
        // This invokes another function, which will use the saved settings.
        const { data: invokeData, error: invokeError } = await supabase.functions.invoke('smtp-email-service', {
          body: {
            to: user.email,
            subject: 'SMTP Test Email',
            message: 'This is a test email to verify your SMTP configuration.',
          }
        });
        
        if (invokeError) throw invokeError;
        
        const testStatus = invokeData.success ? 'success' : 'failure';
        const testMessage = invokeData.success ? 'Connection successful.' : invokeData.error || 'Test failed.';
        await updateSmtpTestStatus(testStatus, testMessage);
        
        return new Response(JSON.stringify(invokeData), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
      }
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in settings-management function:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
