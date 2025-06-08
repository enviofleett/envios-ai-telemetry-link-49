
import { supabase } from '@/integrations/supabase/client';

export interface OTPGenerationResult {
  success: boolean;
  otpId?: string;
  expiresAt?: string;
  error?: string;
}

export interface OTPVerificationResult {
  success: boolean;
  verified?: boolean;
  error?: string;
  attemptsRemaining?: number;
}

export class OTPService {
  private static readonly OTP_EXPIRY_MINUTES = 10;
  private static readonly MAX_ATTEMPTS = 3;

  static async generateOTP(
    phoneNumber: string,
    email: string,
    otpType: 'registration' | 'login' | 'password_reset' = 'registration',
    userId?: string
  ): Promise<OTPGenerationResult> {
    try {
      const { data, error } = await supabase.functions.invoke('otp-service', {
        body: {
          action: 'generate',
          phoneNumber,
          email,
          otpType,
          userId,
          expiryMinutes: this.OTP_EXPIRY_MINUTES
        }
      });

      if (error) throw error;

      if (!data.success) {
        return { success: false, error: data.error };
      }

      // Check if email was delivered successfully
      if (!data.emailDelivered) {
        console.warn('OTP generated but email delivery failed:', data.emailError);
        return {
          success: true,
          otpId: data.otpId,
          expiresAt: data.expiresAt,
          emailDelivered: false,
          emailError: data.emailError
        };
      }

      return {
        success: true,
        otpId: data.otpId,
        expiresAt: data.expiresAt,
        emailDelivered: true
      };
    } catch (error) {
      console.error('OTP generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate OTP'
      };
    }
  }

  static async verifyOTP(
    otpId: string,
    otpCode: string
  ): Promise<OTPVerificationResult> {
    try {
      const { data, error } = await supabase.functions.invoke('otp-service', {
        body: {
          action: 'verify',
          otpId,
          otpCode
        }
      });

      if (error) throw error;

      return {
        success: data.success,
        verified: data.verified,
        error: data.error,
        attemptsRemaining: data.attemptsRemaining
      };
    } catch (error) {
      console.error('OTP verification failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify OTP'
      };
    }
  }

  static async resendOTP(otpId: string): Promise<OTPGenerationResult> {
    try {
      const { data, error } = await supabase.functions.invoke('otp-service', {
        body: {
          action: 'resend',
          otpId
        }
      });

      if (error) throw error;

      if (!data.success) {
        return { success: false, error: data.error };
      }

      return {
        success: true,
        otpId: data.otpId,
        expiresAt: data.expiresAt
      };
    } catch (error) {
      console.error('OTP resend failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to resend OTP'
      };
    }
  }
}
