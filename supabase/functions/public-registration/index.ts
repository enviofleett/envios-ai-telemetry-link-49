
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

    const requestBody = await req.json();
    const { action } = requestBody;

    if (action === 'submit-registration') {
      const { name, email, phoneNumber, city } = requestBody;

      // Validate input
      if (!name || !email || !phoneNumber || !city) {
        return new Response(
          JSON.stringify({ success: false, error: 'All fields are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if email or phone already exists in pending registrations
      const { data: existingRegistration } = await supabase
        .from('pending_user_registrations')
        .select('id, status')
        .or(`email.eq.${email},phone_number.eq.${phoneNumber}`)
        .in('status', ['pending_otp', 'otp_verified', 'admin_review', 'approved'])
        .single();

      if (existingRegistration) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'A registration with this email or phone number is already pending' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if user already exists in envio_users
      const { data: existingUser } = await supabase
        .from('envio_users')
        .select('id')
        .or(`email.eq.${email},phone_number.eq.${phoneNumber}`)
        .single();

      if (existingUser) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'A user with this email or phone number already exists' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate OTP first
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      const { data: otpRecord, error: otpError } = await supabase
        .from('otp_verifications')
        .insert({
          phone_number: phoneNumber,
          email: email,
          otp_code: otpCode,
          otp_type: 'registration',
          expires_at: expiresAt,
          attempts_count: 0,
          max_attempts: 3,
          is_used: false
        })
        .select()
        .single();

      if (otpError) {
        console.error('Failed to create OTP:', otpError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to generate verification code' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create pending registration
      const { data: registration, error: regError } = await supabase
        .from('pending_user_registrations')
        .insert({
          name,
          email,
          phone_number: phoneNumber,
          city,
          registration_source: 'public_weblink',
          otp_verification_id: otpRecord.id,
          status: 'pending_otp'
        })
        .select()
        .single();

      if (regError) {
        console.error('Failed to create registration:', regError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to submit registration' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Send OTP notification
      try {
        await sendRegistrationOTP(phoneNumber, email, otpCode, name);
        console.log(`Registration OTP sent to ${phoneNumber} / ${email}: ${otpCode}`);
      } catch (sendError) {
        console.error('Failed to send registration OTP:', sendError);
        // Continue even if sending fails
      }

      return new Response(
        JSON.stringify({
          success: true,
          registrationId: registration.id,
          otpId: otpRecord.id,
          message: 'Registration submitted. Please verify your phone number with the OTP sent to you.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'verify-otp') {
      const { registrationId, otpCode } = requestBody;

      // Get registration with OTP details
      const { data: registration, error: regError } = await supabase
        .from('pending_user_registrations')
        .select(`
          *,
          otp_verifications (*)
        `)
        .eq('id', registrationId)
        .single();

      if (regError || !registration) {
        return new Response(
          JSON.stringify({ success: false, error: 'Registration not found' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const otpRecord = registration.otp_verifications;
      if (!otpRecord) {
        return new Response(
          JSON.stringify({ success: false, error: 'OTP verification not found' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify OTP using the OTP service
      const otpVerification = await supabase.functions.invoke('otp-service', {
        body: {
          action: 'verify',
          otpId: otpRecord.id,
          otpCode: otpCode
        }
      });

      if (otpVerification.error || !otpVerification.data.verified) {
        return new Response(
          JSON.stringify({
            success: false,
            error: otpVerification.data?.error || 'Invalid OTP',
            attemptsRemaining: otpVerification.data?.attemptsRemaining
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update registration status
      const { error: updateError } = await supabase
        .from('pending_user_registrations')
        .update({
          status: 'otp_verified',
          updated_at: new Date().toISOString()
        })
        .eq('id', registrationId);

      if (updateError) {
        console.error('Failed to update registration status:', updateError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to update registration status' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          registrationId: registrationId,
          requiresAdminReview: true,
          message: 'Phone number verified successfully. Your registration is now pending admin review.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Public registration error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function sendRegistrationOTP(phoneNumber: string, email: string, otpCode: string, name: string) {
  console.log(`=== REGISTRATION OTP ===`);
  console.log(`Name: ${name}`);
  console.log(`Phone: ${phoneNumber}`);
  console.log(`Email: ${email}`);
  console.log(`OTP Code: ${otpCode}`);
  console.log(`========================`);
  
  // TODO: Integrate with SMS service for phone OTP
  // TODO: Integrate with email service for email OTP
  // For now, just log the details
}
