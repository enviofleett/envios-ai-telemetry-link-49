
import { useSMTPIntegration } from '@/services/smtpIntegrationService';
import { useToast } from '@/hooks/use-toast';

export const useUserManagementEmails = () => {
  const { 
    sendWelcomeEmail, 
    sendPasswordResetNotification, 
    sendOTPNotification,
    isSMTPConfigured 
  } = useSMTPIntegration();
  const { toast } = useToast();

  const sendUserWelcomeEmail = async (email: string, userName: string) => {
    if (!(await isSMTPConfigured())) {
      console.warn('SMTP not configured, skipping welcome email');
      return false;
    }

    try {
      const success = await sendWelcomeEmail(email, userName);
      if (success) {
        toast({
          title: "Welcome Email Sent",
          description: `Welcome email sent to ${email}`,
        });
      }
      return success;
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      toast({
        title: "Email Failed",
        description: "Failed to send welcome email",
        variant: "destructive"
      });
      return false;
    }
  };

  const sendUserPasswordReset = async (email: string, userName: string, resetLink: string) => {
    if (!(await isSMTPConfigured())) {
      console.warn('SMTP not configured, skipping password reset email');
      return false;
    }

    try {
      const success = await sendPasswordResetNotification(email, userName, resetLink);
      if (success) {
        toast({
          title: "Password Reset Email Sent",
          description: `Password reset instructions sent to ${email}`,
        });
      }
      return success;
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      toast({
        title: "Email Failed",
        description: "Failed to send password reset email",
        variant: "destructive"
      });
      return false;
    }
  };

  const sendUserOTP = async (email: string, otpCode: string, expiryMinutes = 10) => {
    if (!(await isSMTPConfigured())) {
      console.warn('SMTP not configured, skipping OTP email');
      return false;
    }

    try {
      const success = await sendOTPNotification(email, otpCode, expiryMinutes);
      if (success) {
        toast({
          title: "OTP Email Sent",
          description: `Verification code sent to ${email}`,
        });
      }
      return success;
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      toast({
        title: "Email Failed",
        description: "Failed to send verification code",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    sendUserWelcomeEmail,
    sendUserPasswordReset,
    sendUserOTP,
    isSMTPConfigured
  };
};
