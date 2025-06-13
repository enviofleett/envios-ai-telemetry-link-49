
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders, handleCorsPreflightRequest } from './cors.ts';
import { getCurrentUser } from './auth.ts';
import { 
  handleGetRequest, 
  handlePostRequest, 
  handlePutRequest, 
  handleDeleteRequest 
} from './requestHandlers.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const authHeader = req.headers.get('Authorization');
    
    // Verify authentication for all requests
    const currentUserId = await getCurrentUser(supabase, authHeader);
    
    console.log(`User Management API - ${req.method} ${url.pathname} - User: ${currentUserId}`);

    switch (req.method) {
      case 'GET':
        const result = await handleGetRequest(supabase, url, currentUserId);
        return new Response(
          JSON.stringify(result),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'POST':
        // Parse request body once and handle JSON parsing errors
        let requestBody;
        try {
          requestBody = await req.json();
        } catch (error) {
          console.error('Failed to parse request body:', error);
          return new Response(
            JSON.stringify({ error: 'Invalid JSON in request body' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if this is a user creation with email verification
        if (requestBody.email && requestBody.send_verification) {
          // Send verification email through our SMTP system
          await sendVerificationEmail(supabase, requestBody.email, requestBody.name || 'User');
        }
        
        return await handlePostRequest(supabase, requestBody, currentUserId);

      case 'PUT':
        // Parse request body once for PUT requests
        let putRequestBody;
        try {
          putRequestBody = await req.json();
        } catch (error) {
          console.error('Failed to parse PUT request body:', error);
          return new Response(
            JSON.stringify({ error: 'Invalid JSON in request body' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        return await handlePutRequest(supabase, putRequestBody, url, currentUserId);

      case 'DELETE':
        return await handleDeleteRequest(supabase, url, currentUserId);

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error: any) {
    console.error('User Management API error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: error.message.includes('Authentication failed') || error.message.includes('Admin access required') ? 401 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function sendVerificationEmail(supabase: any, email: string, userName: string) {
  try {
    // Generate verification token
    const verificationToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Store verification token in database
    await supabase
      .from('email_verifications')
      .insert({
        email: email,
        token: verificationToken,
        expires_at: expiresAt.toISOString(),
        verified: false
      });

    // Send verification email through our SMTP service
    const { data, error } = await supabase.functions.invoke('smtp-email-service', {
      body: {
        action: 'send-email',
        recipientEmail: email,
        templateType: 'verification',
        placeholderData: {
          user_name: userName,
          verification_link: `${Deno.env.get('SUPABASE_URL')}/verify-email?token=${verificationToken}`,
          company_name: 'Envio Platform'
        }
      }
    });

    if (error) {
      console.error('Failed to send verification email:', error);
      throw error;
    }

    console.log(`Verification email sent successfully to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
}
