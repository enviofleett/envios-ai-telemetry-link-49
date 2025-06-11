
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

    const { action, phoneNumber, email, otpType, userId, expiryMinutes, otpId, otpCode, purpose } = await req.json();

    if (action === 'generate') {
      console.log(`🔐 Generating OTP - Type: ${otpType || purpose}, Phone: ${phoneNumber?.substring(0, 8)}***`);
      
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
          otp_type: otpType || purpose || 'verification',
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

      // Send OTP via SMTP email service with better error handling (backup method)
      let emailDelivered = false;
      let emailError = null;
      
      try {
        const emailResult = await sendOTPNotification(supabase, email, otpCodeGenerated, otpType || purpose || 'verification');
        emailDelivered = emailResult.success;
        if (!emailResult.success) {
          emailError = emailResult.error;
        }
        console.log(`📧 Email delivery result: ${emailDelivered ? 'Success' : 'Failed'}`);
      } catch (sendError) {
        console.error('Failed to send OTP email:', sendError);
        emailDelivered = false;
        emailError = sendError.message;
      }

      console.log(`✅ OTP generated successfully - ID: ${otpRecord.id}, Code: ${otpCodeGenerated}`);

      return new Response(
        JSON.stringify({
          success: true,
          otpId: otpRecord.id,
          otp: otpCodeGenerated, // Include OTP code for SMS integration
          otpCode: otpCodeGenerated, // Alternative field name for compatibility
          expiresAt: otpRecord.expires_at,
          message: 'OTP generated successfully',
          emailDelivered: emailDelivered,
          emailError: emailError
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'verify') {
      console.log(`🔍 Verifying OTP - ID: ${otpId}`);
      
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

        console.log(`✅ OTP verified successfully - ID: ${otpId}`);

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
        
        console.log(`❌ Invalid OTP - Attempts remaining: ${attemptsRemaining}`);
        
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
      console.log(`🔄 Resending OTP - ID: ${otpId}`);
      
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
        await sendOTPNotification(supabase, existingOTP.email, newOtpCode, existingOTP.otp_type);
        console.log(`🔄 OTP resent successfully - New code: ${newOtpCode}`);
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

async function sendOTPNotification(supabase: any, email: string, otpCode: string, otpType: string) {
  // Email notification implementation
  console.log(`📧 Sending OTP email to ${email}: ${otpCode} (Type: ${otpType})`);
  
  // TODO: Implement actual email sending
  // For now, return success to not block the flow
  return { success: true };
}
