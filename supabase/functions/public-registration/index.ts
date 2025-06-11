
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SMSConfig {
  username: string;
  password: string;
  sender: string;
  route: number;
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

async function sendSMSViaMySMS(config: SMSConfig, recipient: string, message: string): Promise<any> {
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
  
  console.log(`📱 Sending registration OTP to ${recipient} via MySMS API`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'FleetIQ-Registration/1.0'
      }
    });
    
    const responseText = await response.text();
    console.log(`📞 MySMS API Response (Status ${response.status}):`, responseText);
    
    const isSuccess = analyzeMysmstabResponse(responseText, response.status);
    
    return {
      success: isSuccess,
      response: responseText,
      status_code: response.status
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

async function getSMSConfiguration(supabase: any): Promise<SMSConfig | null> {
  try {
    const { data: smsConfig, error } = await supabase
      .from('sms_configurations')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error || !smsConfig) {
      console.log('No SMS configuration found');
      return null;
    }

    // Decrypt the password
    const decryptedPassword = await CredentialEncryption.decrypt(smsConfig.password_encrypted);

    return {
      username: smsConfig.username,
      password: decryptedPassword,
      sender: smsConfig.sender_id,
      route: parseInt(smsConfig.route)
    };
  } catch (error) {
    console.error('Failed to get SMS configuration:', error);
    return null;
  }
}

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

      console.log('📝 Registration request received:', { name, email, phoneNumber: phoneNumber?.substring(0, 8) + '***', city });

      // Enhanced validation
      if (!name || !email || !phoneNumber || !city) {
        return new Response(
          JSON.stringify({ success: false, error: 'All fields are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate phone number format
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(phoneNumber)) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid phone number format. Please use international format (e.g., +2348012345678)' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if email or phone already exists in pending registrations
      const { data: existingRegistration } = await supabase
        .from('pending_user_registrations')
        .select('id, status, phone_number, email')
        .or(`email.eq.${email},phone_number.eq.${phoneNumber}`)
        .in('status', ['pending_otp', 'otp_verified', 'admin_review', 'approved'])
        .single();

      if (existingRegistration) {
        const conflictField = existingRegistration.email === email ? 'email' : 'phone number';
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `A registration with this ${conflictField} is already pending or approved` 
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

      console.log(`🔐 Generated OTP for ${phoneNumber}: ${otpCode}`);

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

      // Send OTP via SMS
      try {
        const smsConfig = await getSMSConfiguration(supabase);
        
        if (smsConfig) {
          const message = `Your FleetIQ verification code is: ${otpCode}. Valid for 10 minutes. Do not share this code.`;
          
          const smsResult = await sendSMSViaMySMS(smsConfig, phoneNumber, message);
          
          if (smsResult.success) {
            console.log(`✅ OTP sent successfully to ${phoneNumber}`);
          } else {
            console.warn(`⚠️ SMS delivery failed but registration continues: ${smsResult.response}`);
          }
        } else {
          console.warn('⚠️ No SMS configuration found - OTP sent via email only');
        }
      } catch (smsError) {
        console.error('SMS sending failed:', smsError);
        // Continue with registration even if SMS fails
      }

      // Also send email notification (backup method)
      try {
        await sendRegistrationOTPEmail(phoneNumber, email, otpCode, name);
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          registrationId: registration.id,
          otpId: otpRecord.id,
          message: 'Registration submitted. Please verify your phone number with the SMS code sent to you.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'verify-otp') {
      const { registrationId, otpCode } = requestBody;

      console.log('🔍 OTP verification request:', { registrationId, otpCode: '***' });

      if (!registrationId || !otpCode) {
        return new Response(
          JSON.stringify({ success: false, error: 'Registration ID and OTP code are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

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

      // Check if OTP is expired
      if (new Date(otpRecord.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ success: false, error: 'OTP has expired. Please request a new verification code.' }),
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
          JSON.stringify({ success: false, error: 'Maximum verification attempts exceeded. Please request a new code.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify OTP code
      const isValid = otpRecord.otp_code === otpCode;
      const newAttempts = otpRecord.attempts_count + 1;

      if (isValid) {
        // Mark OTP as used
        const { error: otpUpdateError } = await supabase
          .from('otp_verifications')
          .update({
            is_used: true,
            verified_at: new Date().toISOString(),
            attempts_count: newAttempts
          })
          .eq('id', otpRecord.id);

        if (otpUpdateError) {
          console.error('Failed to update OTP record:', otpUpdateError);
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

        console.log(`✅ OTP verified successfully for registration ${registrationId}`);

        return new Response(
          JSON.stringify({
            success: true,
            registrationId: registrationId,
            requiresAdminReview: true,
            message: 'Phone number verified successfully. Your registration is now pending admin review.'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // Increment attempts
        const { error: updateError } = await supabase
          .from('otp_verifications')
          .update({ attempts_count: newAttempts })
          .eq('id', otpRecord.id);

        if (updateError) {
          console.error('Failed to update OTP attempts:', updateError);
        }

        const attemptsRemaining = otpRecord.max_attempts - newAttempts;
        
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid OTP code',
            attemptsRemaining: Math.max(0, attemptsRemaining)
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
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

async function sendRegistrationOTPEmail(phoneNumber: string, email: string, otpCode: string, name: string) {
  console.log(`=== REGISTRATION OTP EMAIL BACKUP ===`);
  console.log(`Name: ${name}`);
  console.log(`Phone: ${phoneNumber}`);
  console.log(`Email: ${email}`);
  console.log(`OTP Code: ${otpCode}`);
  console.log(`=====================================`);
  
  // TODO: Integrate with email service for email OTP backup
  // For now, just log the details for debugging
}
