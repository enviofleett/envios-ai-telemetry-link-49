
import { supabase } from '@/integrations/supabase/client';

export interface EmailVerificationResult {
  success: boolean;
  message?: string;
  error?: string;
  redirectUrl?: string;
}

export class EmailVerificationService {
  static async verifyEmail(token: string): Promise<EmailVerificationResult> {
    try {
      const { data, error } = await supabase.functions.invoke('email-verification', {
        body: null,
        headers: {
          'Content-Type': 'application/json'
        }
      }, {
        method: 'GET',
        query: { action: 'verify', token }
      });

      if (error) throw error;

      return {
        success: data.success,
        message: data.message,
        redirectUrl: data.redirect_url
      };
    } catch (error) {
      console.error('Email verification failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify email'
      };
    }
  }

  static async resendVerification(email: string): Promise<EmailVerificationResult> {
    try {
      const { data, error } = await supabase.functions.invoke('email-verification', {
        body: { email },
        headers: {
          'Content-Type': 'application/json'
        }
      }, {
        method: 'POST',
        query: { action: 'resend' }
      });

      if (error) throw error;

      return {
        success: data.success,
        message: data.message
      };
    } catch (error) {
      console.error('Resend verification failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send verification email'
      };
    }
  }

  static async checkVerificationStatus(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('email_verifications')
        .select('verified')
        .eq('email', email)
        .eq('verified', true)
        .single();

      if (error) return false;
      return data?.verified || false;
    } catch (error) {
      console.error('Failed to check verification status:', error);
      return false;
    }
  }
}
