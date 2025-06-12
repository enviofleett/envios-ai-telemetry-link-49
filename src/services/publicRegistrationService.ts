
import { supabase } from '@/integrations/supabase/client';

export interface PublicRegistrationData {
  name: string;
  email: string;
  phoneNumber: string;
  city: string;
}

export interface RegistrationResult {
  success: boolean;
  registrationId?: string;
  otpId?: string;
  error?: string;
  message?: string;
}

export interface OTPVerificationForRegistration {
  success: boolean;
  registrationId?: string;
  requiresAdminReview?: boolean;
  error?: string;
  message?: string;
}

export class PublicRegistrationService {
  static async submitRegistration(data: PublicRegistrationData): Promise<RegistrationResult> {
    try {
      const { data: result, error } = await supabase.functions.invoke('public-registration', {
        body: {
          action: 'submit-registration',
          ...data
        }
      });

      if (error) throw error;

      if (!result.success) {
        return { success: false, error: result.error };
      }

      return {
        success: true,
        registrationId: result.registrationId,
        otpId: result.otpId,
        message: result.message
      };
    } catch (error) {
      console.error('Registration submission failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit registration'
      };
    }
  }

  static async verifyOTPForRegistration(
    registrationId: string,
    otpCode: string
  ): Promise<OTPVerificationForRegistration> {
    try {
      const { data, error } = await supabase.functions.invoke('public-registration', {
        body: {
          action: 'verify-otp',
          registrationId,
          otpCode
        }
      });

      if (error) throw error;

      return {
        success: data.success,
        registrationId: data.registrationId,
        requiresAdminReview: data.requiresAdminReview,
        error: data.error,
        message: data.message
      };
    } catch (error) {
      console.error('OTP verification for registration failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify OTP'
      };
    }
  }

  static async getRegistrationStatus(registrationId: string) {
    try {
      const { data, error } = await supabase
        .from('pending_user_registrations')
        .select('*')
        .eq('id', registrationId)
        .single();

      if (error) throw error;
      return { success: true, registration: data };
    } catch (error) {
      console.error('Failed to get registration status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get registration status'
      };
    }
  }
}
