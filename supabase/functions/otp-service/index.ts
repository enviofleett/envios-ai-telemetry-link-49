
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

    const { action, phoneNumber, email, otpType, userId, expiryMinutes, otpId, otpCode } = await req.json();

    if (action === 'generate') {
      // Generate OTP code
      const otpCodeGenerated = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + (expiryMinutes || 10) * 60 * 1000).toISOString();

      // Insert OTP record
      const { data: otpRecord, error: otpError } = await supabase
        .from('otp_verifications')
        .insert({
          user_id: userId || null,
          phone_number: phoneNumber,
          email: email,
          otp_code: otpCodeGenerated,
          otp_type: otpType,
          expires_at: expiresAt,
          attempts_count: 0,
          max_attempts: 3,
          is_used: false
        })
        .select()
        .single();

      if (otpError) {
        console.error('Failed to create OTP record:', otpError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to generate OTP' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Send OTP via SMS/Email (integrate with your SMS/Email service)
      try {
        await sendOTPNotification(phoneNumber, email, otpCodeGenerated, otpType);
        console.log(`OTP sent to ${phoneNumber} / ${email}: ${otpCodeGenerated}`);
      } catch (sendError) {
        console.error('Failed to send OTP:', sendError);
        // Continue even if sending fails for now
      }

      return new Response(
        JSON.stringify({
          success: true,
          otpId: otpRecord.id,
          expiresAt: otpRecord.expires_at,
          message: 'OTP sent successfully'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'verify') {
      // Get OTP record
      const { data: otpRecord, error: fetchError } = await supabase
        .from('otp_verifications')
        .select('*')
        .eq('id', otpId)
        .single();

      if (fetchError || !otpRecord) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid OTP ID' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if OTP is expired
      if (new Date(otpRecord.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ success: false, error: 'OTP has expired' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if OTP is already used
      if (otpRecord.is_used) {
        return new Response(
          JSON.stringify({ success: false, error: 'OTP has already been used' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if max attempts exceeded
      if (otpRecord.attempts_count >= otpRecord.max_attempts) {
        return new Response(
          JSON.stringify({ success: false, error: 'Maximum verification attempts exceeded' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify OTP code
      const isValid = otpRecord.otp_code === otpCode;
      const newAttempts = otpRecord.attempts_count + 1;

      if (isValid) {
        // Mark OTP as used and verified
        const { error: updateError } = await supabase
          .from('otp_verifications')
          .update({
            is_used: true,
            verified_at: new Date().toISOString(),
            attempts_count: newAttempts
          })
          .eq('id', otpId);

        if (updateError) {
          console.error('Failed to update OTP record:', updateError);
        }

        return new Response(
          JSON.stringify({
            success: true,
            verified: true,
            message: 'OTP verified successfully'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // Increment attempts
        const { error: updateError } = await supabase
          .from('otp_verifications')
          .update({ attempts_count: newAttempts })
          .eq('id', otpId);

        if (updateError) {
          console.error('Failed to update OTP attempts:', updateError);
        }

        const attemptsRemaining = otpRecord.max_attempts - newAttempts;
        
        return new Response(
          JSON.stringify({
            success: false,
            verified: false,
            error: 'Invalid OTP code',
            attemptsRemaining: Math.max(0, attemptsRemaining)
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (action === 'resend') {
      // Get existing OTP record
      const { data: existingOTP, error: fetchError } = await supabase
        .from('otp_verifications')
        .select('*')
        .eq('id', otpId)
        .single();

      if (fetchError || !existingOTP) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid OTP ID' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate new OTP
      const newOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const newExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      // Update existing record
      const { data: updatedOTP, error: updateError } = await supabase
        .from('otp_verifications')
        .update({
          otp_code: newOtpCode,
          expires_at: newExpiresAt,
          attempts_count: 0,
          is_used: false,
          verified_at: null
        })
        .eq('id', otpId)
        .select()
        .single();

      if (updateError) {
        console.error('Failed to update OTP:', updateError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to resend OTP' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Send new OTP
      try {
        await sendOTPNotification(existingOTP.phone_number, existingOTP.email, newOtpCode, existingOTP.otp_type);
        console.log(`OTP resent to ${existingOTP.phone_number} / ${existingOTP.email}: ${newOtpCode}`);
      } catch (sendError) {
        console.error('Failed to resend OTP:', sendError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          otpId: updatedOTP.id,
          expiresAt: updatedOTP.expires_at,
          message: 'OTP resent successfully'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('OTP service error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function sendOTPNotification(phoneNumber: string, email: string, otpCode: string, otpType: string) {
  // For now, just log the OTP. In production, integrate with SMS/Email service
  console.log(`=== OTP NOTIFICATION ===`);
  console.log(`Type: ${otpType}`);
  console.log(`Phone: ${phoneNumber}`);
  console.log(`Email: ${email}`);
  console.log(`Code: ${otpCode}`);
  console.log(`======================`);
  
  // TODO: Integrate with actual SMS/Email service like Twilio, SendGrid, etc.
  // Example for email integration with existing SMTP service:
  /*
  try {
    const { data, error } = await supabase.functions.invoke('smtp-email-service', {
      body: {
        action: 'send-email',
        recipientEmail: email,
        templateType: 'otp',
        placeholderData: {
          user_name: email.split('@')[0],
          otp_code: otpCode,
          expiry_minutes: '10'
        }
      }
    });
    
    if (error) throw error;
  } catch (emailError) {
    console.error('Failed to send OTP email:', emailError);
  }
  */
}
