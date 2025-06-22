
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, ...data } = await req.json();

    switch (action) {
      case 'submit-registration':
        return await handleRegistrationSubmission(data);
      case 'verify-otp':
        return await handleOTPVerification(data);
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Registration error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});

async function handleRegistrationSubmission(data: any) {
  const { name, email, phoneNumber, city } = data;

  // Validate required fields
  if (!name || !email || !phoneNumber || !city) {
    throw new Error('All fields are required');
  }

  // Check if user already exists
  const { data: existingUser } = await supabase
    .from('pending_user_registrations')
    .select('id')
    .eq('email', email)
    .single();

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Generate OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Store OTP
  const { data: otpData, error: otpError } = await supabase
    .from('otp_verifications')
    .insert({
      email,
      otp_code: otpCode,
      purpose: 'registration',
      expires_at: expiresAt.toISOString()
    })
    .select()
    .single();

  if (otpError) throw otpError;

  // Store pending registration
  const { data: registrationData, error: regError } = await supabase
    .from('pending_user_registrations')
    .insert({
      name,
      email,
      phone_number: phoneNumber,
      city,
      status: 'pending'
    })
    .select()
    .single();

  if (regError) throw regError;

  // TODO: Send OTP via email (integrate with your email service)
  console.log(`OTP for ${email}: ${otpCode}`);

  return new Response(
    JSON.stringify({
      success: true,
      registrationId: registrationData.id,
      otpId: otpData.id,
      message: 'Registration submitted. Please check your email for OTP.'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleOTPVerification(data: any) {
  const { registrationId, otpCode } = data;

  // Verify OTP
  const { data: otpData, error: otpError } = await supabase
    .from('otp_verifications')
    .select('*')
    .eq('id', registrationId)
    .eq('otp_code', otpCode)
    .eq('is_used', false)
    .gte('expires_at', new Date().toISOString())
    .single();

  if (otpError || !otpData) {
    throw new Error('Invalid or expired OTP');
  }

  // Mark OTP as used
  await supabase
    .from('otp_verifications')
    .update({ is_used: true })
    .eq('id', otpData.id);

  // Update registration status
  const { error: updateError } = await supabase
    .from('pending_user_registrations')
    .update({ 
      status: 'verified',
      otp_verified_at: new Date().toISOString()
    })
    .eq('id', registrationId);

  if (updateError) throw updateError;

  return new Response(
    JSON.stringify({
      success: true,
      registrationId,
      requiresAdminReview: true,
      message: 'OTP verified successfully. Your registration is pending admin review.'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
