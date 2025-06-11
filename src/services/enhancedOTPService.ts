
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
}

class EnhancedOTPService {
  async generateAndSendOTP(options: OTPOptions): Promise<OTPDeliveryResult> {
    const {
      deliveryMethod = 'email',
      phoneNumber,
      email,
      expiryMinutes = 10,
      purpose = 'verification'
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

    console.log(`🔐 Generating OTP with delivery method: ${deliveryMethod} for purpose: ${purpose}`);

    const deliveredVia: string[] = [];
    const failedVia: string[] = [];

    try {
      // Generate OTP via existing OTP service
      const { data, error } = await supabase.functions.invoke('otp-service', {
        body: {
          action: 'generate',
          email: email,
          expiryMinutes: expiryMinutes,
          purpose: purpose
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
          
          const smsMessage = this.generateOTPMessage(otpCode, purpose, expiryMinutes);
          
          const smsResult = await smsService.sendSMS(
            smsService.formatPhoneNumber(phoneNumber!),
            smsMessage,
            'OTP_VERIFICATION'
          );

          if (smsResult.success) {
            deliveredVia.push('SMS');
            console.log('✅ OTP sent successfully via SMS');
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
        deliveredVia.push('Email');
        console.log('📧 Email OTP delivery handled by existing service');
      }

      // Determine overall success
      const success = deliveredVia.length > 0;
      
      return {
        success,
        message: this.generateDeliveryMessage(deliveredVia, failedVia, deliveryMethod),
        deliveryMethod,
        deliveredVia,
        failedVia
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

  async verifyOTP(otp: string, email: string): Promise<any> {
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

  // New: Fleet-specific OTP methods
  async sendVehicleVerificationOTP(phoneNumber: string, vehicleId: string): Promise<OTPDeliveryResult> {
    const message = `Your FleetIQ vehicle verification code for ${vehicleId} is: {{OTP}}. Valid for 10 minutes.`;
    
    return this.generateAndSendOTP({
      deliveryMethod: 'sms',
      phoneNumber,
      purpose: 'verification'
    });
  }

  async sendDriverAuthOTP(phoneNumber: string, driverName: string): Promise<OTPDeliveryResult> {
    const customMessage = `Hello ${driverName}, your FleetIQ driver authentication code is: {{OTP}}. Valid for 5 minutes.`;
    
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
