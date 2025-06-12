
import { supabase } from '@/integrations/supabase/client';
import { smsService } from './smsService';

export interface OTPOptions {
  deliveryMethod?: 'email' | 'sms' | 'both';
  phoneNumber?: string;
  email?: string;
  expiryMinutes?: number;
}

class EnhancedOTPService {
  async generateAndSendOTP(options: OTPOptions) {
    const {
      deliveryMethod = 'email',
      phoneNumber,
      email,
      expiryMinutes = 10
    } = options;

    if (!email && !phoneNumber) {
      throw new Error('Either email or phone number is required');
    }

    if ((deliveryMethod === 'sms' || deliveryMethod === 'both') && !phoneNumber) {
      throw new Error('Phone number is required for SMS delivery');
    }

    if ((deliveryMethod === 'email' || deliveryMethod === 'both') && !email) {
      throw new Error('Email is required for email delivery');
    }

    try {
      console.log(`🔐 Generating OTP with delivery method: ${deliveryMethod}`);

      // Generate OTP via existing OTP service
      const { data, error } = await supabase.functions.invoke('otp-service', {
        body: {
          action: 'generate',
          email: email,
          expiryMinutes: expiryMinutes
        }
      });

      if (error) {
        throw new Error(`Failed to generate OTP: ${error.message}`);
      }

      const otpCode = data.otp;

      // Send via SMS if requested
      if (deliveryMethod === 'sms' || deliveryMethod === 'both') {
        try {
          console.log(`📱 Sending OTP via SMS to ${phoneNumber}`);
          
          const smsMessage = `Your FleetIQ verification code is: ${otpCode}. Valid for ${expiryMinutes} minutes. Do not share this code.`;
          
          const smsResult = await smsService.sendSMS(
            smsService.formatPhoneNumber(phoneNumber!),
            smsMessage,
            'OTP'
          );

          if (!smsResult.success) {
            console.warn('SMS delivery failed, falling back to email if available');
            
            // If SMS fails and we have email as backup, continue with email
            if (deliveryMethod === 'both' && email) {
              console.log('📧 SMS failed, email will be sent as backup');
            } else {
              throw new Error('SMS delivery failed and no backup method available');
            }
          } else {
            console.log('✅ OTP sent successfully via SMS');
          }
        } catch (smsError) {
          console.error('SMS OTP delivery error:', smsError);
          
          // If this was SMS-only delivery, throw the error
          if (deliveryMethod === 'sms') {
            throw new Error(`SMS delivery failed: ${smsError instanceof Error ? smsError.message : 'Unknown error'}`);
          }
          
          // For 'both' delivery method, continue with email as fallback
          console.log('📧 Continuing with email delivery as SMS fallback');
        }
      }

      // Email delivery is handled by the existing OTP service
      if (deliveryMethod === 'email' || deliveryMethod === 'both') {
        console.log('📧 Email OTP delivery handled by existing service');
      }

      return {
        success: true,
        message: `OTP sent successfully via ${deliveryMethod}`,
        deliveryMethod: deliveryMethod
      };

    } catch (error) {
      console.error('Enhanced OTP service error:', error);
      throw error;
    }
  }

  async verifyOTP(otp: string, email: string) {
    console.log(`🔍 Verifying OTP for ${email}`);
    
    const { data, error } = await supabase.functions.invoke('otp-service', {
      body: {
        action: 'verify',
        otp: otp,
        email: email
      }
    });

    if (error) {
      throw new Error(`OTP verification failed: ${error.message}`);
    }

    return data;
  }

  async getUserPreferredDeliveryMethod(): Promise<'email' | 'sms' | 'both'> {
    try {
      const { data, error } = await supabase
        .from('user_email_preferences')
        .select('sms_otp_verification, email_notifications')
        .single();

      if (error) {
        console.warn('Could not fetch user preferences, defaulting to email');
        return 'email';
      }

      const smsEnabled = data?.sms_otp_verification ?? false;
      const emailEnabled = data?.email_notifications ?? true;

      if (smsEnabled && emailEnabled) {
        return 'both';
      } else if (smsEnabled) {
        return 'sms';
      } else {
        return 'email';
      }
    } catch (error) {
      console.warn('Error fetching delivery preferences:', error);
      return 'email';
    }
  }
}

export const enhancedOTPService = new EnhancedOTPService();
