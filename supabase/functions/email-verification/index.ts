
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (action === 'verify') {
      return await handleEmailVerification(supabase, url);
    }

    if (action === 'resend') {
      return await handleResendVerification(supabase, req);
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Email verification error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleEmailVerification(supabase: any, url: URL) {
  const token = url.searchParams.get('token');
  
  if (!token) {
    return new Response(
      JSON.stringify({ error: 'Verification token required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Find verification record
    const { data: verification, error: fetchError } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('token', token)
      .eq('verified', false)
      .single();

    if (fetchError || !verification) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired verification token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token is expired
    if (new Date(verification.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Verification token has expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark as verified
    const { error: updateError } = await supabase
      .from('email_verifications')
      .update({
        verified: true,
        verified_at: new Date().toISOString()
      })
      .eq('token', token);

    if (updateError) {
      throw updateError;
    }

    // Update user's email confirmation status if they exist
    const { data: user } = await supabase
      .from('envio_users')
      .select('id')
      .eq('email', verification.email)
      .single();

    if (user) {
      await supabase
        .from('envio_users')
        .update({
          registration_status: 'approved',
          email_verified: true
        })
        .eq('id', user.id);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email verified successfully',
        redirect_url: '/auth?verified=true'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Verification error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to verify email' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleResendVerification(supabase: any, req: Request) {
  const { email } = await req.json();

  if (!email) {
    return new Response(
      JSON.stringify({ error: 'Email address required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Generate new verification token
    const verificationToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update existing verification record or create new one
    const { error: upsertError } = await supabase
      .from('email_verifications')
      .upsert({
        email: email,
        token: verificationToken,
        expires_at: expiresAt.toISOString(),
        verified: false
      }, {
        onConflict: 'email'
      });

    if (upsertError) {
      throw upsertError;
    }

    // Get user name for email
    const { data: user } = await supabase
      .from('envio_users')
      .select('name')
      .eq('email', email)
      .single();

    const userName = user?.name || 'User';

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
      throw error;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Verification email sent successfully' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Resend verification error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send verification email' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
