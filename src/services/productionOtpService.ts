
import { supabase } from '@/integrations/supabase/client';

export interface OTPGenerationResult {
  success: boolean;
  otpId?: string;
  error?: string;
  emailDelivered?: boolean;
  emailError?: string;
  expiresAt?: string;
  message?: string;
}

export interface OTPVerificationResult {
  success: boolean;
  verified?: boolean;
  error?: string;
  attemptsRemaining?: number;
}

export interface OTPResendResult {
  success: boolean;
  error?: string;
  otpId?: string;
}

export class ProductionOTPService {
  static async generateOTP(
    phoneNumber: string,
    email: string,
    type: 'registration' | 'password_reset'
  ): Promise<OTPGenerationResult> {
    try {
      console.log(`Generating OTP for ${email} (type: ${type})`);
      
      const { data, error } = await supabase.functions.invoke('otp-service', {
        body: {
          action: 'generate',
          email,
          phoneNumber,
          otpType: type,
          expiryMinutes: 10
        }
      });

      if (error) {
        console.error('OTP generation error:', error);
        return {
          success: false,
          error: error.message || 'Failed to generate OTP',
          emailDelivered: false
        };
      }

      return {
        success: true,
        otpId: data.otpId,
        expiresAt: data.expiresAt,
        emailDelivered: data.emailDelivered || false,
        emailError: data.emailError,
        message: data.message || 'OTP sent successfully'
      };
    } catch (error) {
      console.error('OTP generation error:', error);
      return {
        success: false,
        error: 'Failed to generate OTP',
        emailDelivered: false
      };
    }
  }

  static async verifyOTP(otpId: string, otpCode: string): Promise<OTPVerificationResult> {
    try {
      console.log(`Verifying OTP ${otpCode} for ID ${otpId}`);
      
      const { data, error } = await supabase.functions.invoke('otp-service', {
        body: {
          action: 'verify',
          otpId,
          otpCode
        }
      });

      if (error) {
        console.error('OTP verification error:', error);
        return {
          success: false,
          error: error.message || 'Failed to verify OTP',
          attemptsRemaining: 0
        };
      }

      return {
        success: data.success,
        verified: data.verified,
        error: data.error,
        attemptsRemaining: data.attemptsRemaining || 0
      };
    } catch (error) {
      console.error('OTP verification error:', error);
      return {
        success: false,
        error: 'Failed to verify OTP',
        attemptsRemaining: 0
      };
    }
  }

  static async resendOTP(otpId: string): Promise<OTPResendResult> {
    try {
      console.log(`Resending OTP for ID ${otpId}`);
      
      const { data, error } = await supabase.functions.invoke('otp-service', {
        body: {
          action: 'resend',
          otpId
        }
      });

      if (error) {
        console.error('OTP resend error:', error);
        return {
          success: false,
          error: error.message || 'Failed to resend OTP'
        };
      }

      return {
        success: true,
        otpId: data.otpId
      };
    } catch (error) {
      console.error('OTP resend error:', error);
      return {
        success: false,
        error: 'Failed to resend OTP'
      };
    }
  }
}
