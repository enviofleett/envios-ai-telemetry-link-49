
import { supabase } from '@/integrations/supabase/client';
import { enhancedOTPService } from './enhancedOTPService';
import { GP51IntegrationService } from './gp51IntegrationService';

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
  requiresOTPVerification?: boolean;
}

export interface OTPVerificationResult {
  success: boolean;
  verified?: boolean;
  error?: string;
  attemptsRemaining?: number;
  requiresAdminReview?: boolean;
}

export interface AdminApprovalResult {
  success: boolean;
  userId?: string;
  gp51Username?: string;
  error?: string;
}

export class PublicRegistrationService {
  /**
   * Submit initial registration and trigger OTP
   */
  static async submitRegistration(data: PublicRegistrationData): Promise<RegistrationResult> {
    try {
      console.log('📝 PublicRegistrationService: Submitting registration', {
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber?.substring(0, 8) + '***',
        city: data.city
      });

      const { data: result, error } = await supabase.functions.invoke('public-registration', {
        body: {
          action: 'submit-registration',
          ...data
        }
      });

      if (error) {
        console.error('❌ Registration submission failed:', error);
        return {
          success: false,
          error: error.message
        };
      }

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Registration failed'
        };
      }

      console.log('✅ Registration submitted successfully');
      return {
        success: true,
        registrationId: result.registrationId,
        otpId: result.otpId,
        requiresOTPVerification: true
      };

    } catch (error) {
      console.error('❌ Registration service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Verify OTP for registration
   */
  static async verifyOTPForRegistration(registrationId: string, otpCode: string): Promise<OTPVerificationResult> {
    try {
      console.log('🔍 PublicRegistrationService: Verifying OTP', { registrationId, otpCode: '***' });

      const { data: result, error } = await supabase.functions.invoke('public-registration', {
        body: {
          action: 'verify-otp',
          registrationId,
          otpCode
        }
      });

      if (error) {
        console.error('❌ OTP verification failed:', error);
        return {
          success: false,
          error: error.message
        };
      }

      if (!result.success) {
        return {
          success: false,
          verified: false,
          error: result.error || 'OTP verification failed',
          attemptsRemaining: result.attemptsRemaining
        };
      }

      console.log('✅ OTP verified successfully');
      return {
        success: true,
        verified: true,
        requiresAdminReview: result.requiresAdminReview || true
      };

    } catch (error) {
      console.error('❌ OTP verification service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Admin approval workflow - creates user in both local DB and GP51
   */
  static async approveRegistration(registrationId: string, adminUserId: string, options?: {
    createGP51User?: boolean;
    generateGP51Username?: boolean;
    temporaryPassword?: string;
  }): Promise<AdminApprovalResult> {
    try {
      console.log('👨‍💼 PublicRegistrationService: Processing admin approval', { registrationId, adminUserId });

      const { data: result, error } = await supabase.functions.invoke('public-registration', {
        body: {
          action: 'admin-approve',
          registrationId,
          adminUserId,
          options: {
            createGP51User: options?.createGP51User ?? true,
            generateGP51Username: options?.generateGP51Username ?? true,
            temporaryPassword: options?.temporaryPassword || 'TempPass123!'
          }
        }
      });

      if (error) {
        console.error('❌ Admin approval failed:', error);
        return {
          success: false,
          error: error.message
        };
      }

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Admin approval failed'
        };
      }

      console.log('✅ Registration approved and user created successfully');
      return {
        success: true,
        userId: result.userId,
        gp51Username: result.gp51Username
      };

    } catch (error) {
      console.error('❌ Admin approval service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get pending registrations for admin review
   */
  static async getPendingRegistrations(): Promise<{
    success: boolean;
    registrations?: any[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('pending_user_registrations')
        .select(`
          *,
          otp_verifications (
            verified_at,
            expires_at,
            attempts_count,
            max_attempts
          )
        `)
        .eq('status', 'otp_verified')
        .order('created_at', { ascending: false });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        registrations: data || []
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Reject a registration with reason
   */
  static async rejectRegistration(registrationId: string, adminUserId: string, reason?: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('pending_user_registrations')
        .update({
          status: 'rejected',
          admin_review_notes: reason || 'Registration rejected by admin',
          reviewed_by: adminUserId,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', registrationId);

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
