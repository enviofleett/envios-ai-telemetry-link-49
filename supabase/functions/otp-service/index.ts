
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
      case 'generate':
        return await generateOTP(data);
      case 'verify':
        return await verifyOTP(data);
      case 'resend':
        return await resendOTP(data);
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('OTP service error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});

async function generateOTP(data: any) {
  const { phoneNumber, email, otpType = 'registration', userId, expiryMinutes = 10 } = data;

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  const { data: otpData, error } = await supabase
    .from('otp_verifications')
    .insert({
      email: email || phoneNumber,
      otp_code: otpCode,
      purpose: otpType,
      expires_at: expiresAt.toISOString()
    })
    .select()
    .single();

  if (error) throw error;

  // TODO: Send OTP via email/SMS
  console.log(`OTP for ${email || phoneNumber}: ${otpCode}`);

  return new Response(
    JSON.stringify({
      success: true,
      otpId: otpData.id,
      expiresAt: expiresAt.toISOString(),
      emailDelivered: true
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function verifyOTP(data: any) {
  const { otpId, otpCode } = data;

  const { data: otpData, error } = await supabase
    .from('otp_verifications')
    .select('*')
    .eq('id', otpId)
    .single();

  if (error || !otpData) {
    throw new Error('OTP not found');
  }

  if (otpData.is_used) {
    throw new Error('OTP already used');
  }

  if (new Date() > new Date(otpData.expires_at)) {
    throw new Error('OTP expired');
  }

  if (otpData.attempts >= otpData.max_attempts) {
    throw new Error('Maximum attempts exceeded');
  }

  if (otpData.otp_code !== otpCode) {
    await supabase
      .from('otp_verifications')
      .update({ attempts: otpData.attempts + 1 })
      .eq('id', otpId);
    
    throw new Error('Invalid OTP');
  }

  // Mark as used
  await supabase
    .from('otp_verifications')
    .update({ is_used: true })
    .eq('id', otpId);

  return new Response(
    JSON.stringify({
      success: true,
      verified: true
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function resendOTP(data: any) {
  const { otpId } = data;

  const { data: otpData, error } = await supabase
    .from('otp_verifications')
    .select('*')
    .eq('id', otpId)
    .single();

  if (error || !otpData) {
    throw new Error('OTP not found');
  }

  const newOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const newExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const { data: newOtpData, error: updateError } = await supabase
    .from('otp_verifications')
    .update({
      otp_code: newOtpCode,
      expires_at: newExpiresAt.toISOString(),
      attempts: 0,
      is_used: false
    })
    .eq('id', otpId)
    .select()
    .single();

  if (updateError) throw updateError;

  // TODO: Send new OTP
  console.log(`New OTP for ${otpData.email}: ${newOtpCode}`);

  return new Response(
    JSON.stringify({
      success: true,
      otpId: newOtpData.id,
      expiresAt: newExpiresAt.toISOString()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
