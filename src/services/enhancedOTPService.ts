
import { supabase } from '@/integrations/supabase/client';
import { smsService } from './smsService';

export interface OTPOptions {
  deliveryMethod?: 'email' | 'sms' | 'both';
  phoneNumber?: string;
  email?: string;
  expiryMinutes?: number;
  purpose?: 'registration' | 'login' | 'password_reset' | 'verification';
}

export interface OTPDeliveryResult {
  success: boolean;
  message: string;
  deliveryMethod: string;
  deliveredVia: string[];
  failedVia: string[];
  otpId?: string;
  expiresAt?: string;
}

export interface OTPVerificationForRegistration {
  success: boolean;
  verified?: boolean;
  error?: string;
  attemptsRemaining?: number;
}

class EnhancedOTPService {
  async generateAndSendOTP(options: OTPOptions): Promise<OTPDeliveryResult> {
    const {
      deliveryMethod = 'sms',
      phoneNumber,
      email,
      expiryMinutes = 10,
      purpose = 'verification'
    } = options;

    console.log(`🔐 Enhanced OTP Generation - Method: ${deliveryMethod}, Purpose: ${purpose}`);

    if (!email && !phoneNumber) {
      throw new Error('Either email or phone number is required');
    }

    if ((deliveryMethod === 'sms' || deliveryMethod === 'both') && !phoneNumber) {
      throw new Error('Phone number is required for SMS delivery');
    }

    if ((deliveryMethod === 'email' || deliveryMethod === 'both') && !email) {
      throw new Error('Email is required for email delivery');
    }

    const deliveredVia: string[] = [];
    const failedVia: string[] = [];
    let otpId: string | undefined;
    let expiresAt: string | undefined;

    try {
      // Generate OTP via existing OTP service
      const { data, error } = await supabase.functions.invoke('otp-service', {
        body: {
          action: 'generate',
          phoneNumber: phoneNumber,
          email: email,
          expiryMinutes: expiryMinutes,
          purpose: purpose,
          otpType: purpose
        }
      });

      if (error) {
        throw new Error(`Failed to generate OTP: ${error.message}`);
      }

      const otpCode = data.otp || data.otpCode;
      otpId = data.otpId;
      expiresAt = data.expiresAt;

      console.log(`🎯 OTP Generated - ID: ${otpId}, Code: ${otpCode?.substring(0, 2)}***`);

      // Send via SMS if requested
      if ((deliveryMethod === 'sms' || deliveryMethod === 'both') && phoneNumber) {
        try {
          console.log(`📱 Attempting SMS delivery to ${phoneNumber}`);
          
          const smsMessage = this.generateOTPMessage(otpCode, purpose, expiryMinutes);
          
          const smsResult = await smsService.sendSMS(
            smsService.formatPhoneNumber(phoneNumber),
            smsMessage,
            'OTP_VERIFICATION'
          );

          if (smsResult.success) {
            deliveredVia.push('SMS');
            console.log('✅ SMS OTP delivered successfully');
          } else {
            failedVia.push('SMS');
            console.warn('❌ SMS delivery failed:', smsResult.error);
          }
        } catch (smsError) {
          failedVia.push('SMS');
          console.error('❌ SMS OTP delivery error:', smsError);
        }
      }

      // Email delivery is handled by the existing OTP service
      if (deliveryMethod === 'email' || deliveryMethod === 'both') {
        if (data.emailDelivered) {
          deliveredVia.push('Email');
          console.log('📧 Email OTP delivery confirmed');
        } else {
          failedVia.push('Email');
          console.warn('❌ Email OTP delivery failed:', data.emailError);
        }
      }

      // Determine overall success
      const success = deliveredVia.length > 0;
      
      return {
        success,
        message: this.generateDeliveryMessage(deliveredVia, failedVia, deliveryMethod),
        deliveryMethod,
        deliveredVia,
        failedVia,
        otpId,
        expiresAt
      };

    } catch (error) {
      console.error('❌ Enhanced OTP service error:', error);
      throw error;
    }
  }

  private generateOTPMessage(otp: string, purpose: string, expiryMinutes: number): string {
    const purposeText = {
      'registration': 'account registration',
      'login': 'login verification',
      'password_reset': 'password reset',
      'verification': 'account verification'
    };

    const purposeDescription = purposeText[purpose as keyof typeof purposeText] || 'verification';

    return `Your FleetIQ ${purposeDescription} code is: ${otp}. Valid for ${expiryMinutes} minutes. Do not share this code. If you didn't request this, please ignore.`;
  }

  private generateDeliveryMessage(deliveredVia: string[], failedVia: string[], requestedMethod: string): string {
    if (deliveredVia.length === 0) {
      return `Failed to deliver OTP via ${requestedMethod}`;
    }
    
    if (failedVia.length === 0) {
      return `OTP sent successfully via ${deliveredVia.join(' and ')}`;
    }
    
    return `OTP sent via ${deliveredVia.join(' and ')}. ${failedVia.join(' and ')} delivery failed.`;
  }

  async verifyOTP(otpId: string, otpCode: string): Promise<OTPVerificationForRegistration> {
    console.log(`🔍 Enhanced OTP verification for ${otpId}`);
    
    const { data, error } = await supabase.functions.invoke('otp-service', {
      body: {
        action: 'verify',
        otpId: otpId,
        otpCode: otpCode
      }
    });

    if (error) {
      throw new Error(`OTP verification failed: ${error.message}`);
    }

    return {
      success: data.success,
      verified: data.verified,
      error: data.error,
      attemptsRemaining: data.attemptsRemaining
    };
  }

  async getUserPreferredDeliveryMethod(): Promise<'email' | 'sms' | 'both'> {
    try {
      const { data, error } = await supabase
        .from('user_email_preferences')
        .select('sms_otp_verification, email_notifications')
        .single();

      if (error) {
        console.warn('Could not fetch user preferences, defaulting to SMS');
        return 'sms';
      }

      const smsEnabled = data?.sms_otp_verification ?? true;
      const emailEnabled = data?.email_notifications ?? false;

      if (smsEnabled && emailEnabled) {
        return 'both';
      } else if (smsEnabled) {
        return 'sms';
      } else {
        return 'email';
      }
    } catch (error) {
      console.warn('Error fetching delivery preferences:', error);
      return 'sms';
    }
  }

  // Enhanced registration-specific OTP methods
  async sendRegistrationOTP(phoneNumber: string, email: string, name: string): Promise<OTPDeliveryResult> {
    console.log(`📝 Sending registration OTP to ${name} at ${phoneNumber}`);
    
    return this.generateAndSendOTP({
      deliveryMethod: 'sms', // Primary method for registration
      phoneNumber,
      email,
      purpose: 'registration',
      expiryMinutes: 10
    });
  }

  // Fleet-specific OTP methods
  async sendVehicleVerificationOTP(phoneNumber: string, vehicleId: string): Promise<OTPDeliveryResult> {
    return this.generateAndSendOTP({
      deliveryMethod: 'sms',
      phoneNumber,
      purpose: 'verification',
      expiryMinutes: 10
    });
  }

  async sendDriverAuthOTP(phoneNumber: string, driverName: string): Promise<OTPDeliveryResult> {
    return this.generateAndSendOTP({
      deliveryMethod: 'sms',
      phoneNumber,
      expiryMinutes: 5,
      purpose: 'login'
    });
  }

  async sendEmergencyOTP(phoneNumber: string, emergencyType: string): Promise<OTPDeliveryResult> {
    return this.generateAndSendOTP({
      deliveryMethod: 'sms',
      phoneNumber,
      expiryMinutes: 15,
      purpose: 'verification'
    });
  }
}

export const enhancedOTPService = new EnhancedOTPService();
