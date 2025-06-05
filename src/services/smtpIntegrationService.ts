
import { useEmailService } from '@/hooks/useEmailService';

class SMTPIntegrationService {
  private emailService: any;

  constructor() {
    // This will be initialized when used in a React component
  }

  // Integration with GP51 user creation
  async notifyUserCreated(email: string, userName: string, isFromGP51 = false) {
    try {
      if (this.emailService) {
        await this.emailService.sendWelcomeEmail(email, userName);
        console.log(`Welcome email sent to ${email}`);
      }
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Don't throw - email failure shouldn't break user creation
    }
  }

  // Integration with vehicle activation
  async notifyVehicleActivated(email: string, userName: string, vehicleName: string, deviceId: string) {
    try {
      if (this.emailService) {
        await this.emailService.sendVehicleActivationEmail(email, userName, vehicleName, deviceId);
        console.log(`Vehicle activation email sent to ${email} for vehicle ${vehicleName}`);
      }
    } catch (error) {
      console.error('Failed to send vehicle activation email:', error);
    }
  }

  // Integration with OTP system
  async sendOTPNotification(email: string, otpCode: string, expiryMinutes = 10) {
    try {
      if (this.emailService) {
        await this.emailService.sendOTPEmail(email, otpCode, expiryMinutes);
        console.log(`OTP email sent to ${email}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      return false;
    }
  }

  // Integration with password reset
  async sendPasswordResetNotification(email: string, userName: string, resetLink: string) {
    try {
      if (this.emailService) {
        await this.emailService.sendPasswordResetEmail(email, userName, resetLink);
        console.log(`Password reset email sent to ${email}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return false;
    }
  }

  // Set email service instance (called from React components)
  setEmailService(emailService: any) {
    this.emailService = emailService;
  }

  // Check if SMTP is configured and available
  async isSMTPConfigured(): Promise<boolean> {
    try {
      const response = await fetch('/api/smtp/status');
      const data = await response.json();
      return data.configured === true;
    } catch (error) {
      console.error('Failed to check SMTP status:', error);
      return false;
    }
  }
}

export const smtpIntegrationService = new SMTPIntegrationService();

// React hook for using SMTP integration in components
export const useSMTPIntegration = () => {
  const emailService = useEmailService();
  
  // Set email service instance
  React.useEffect(() => {
    smtpIntegrationService.setEmailService(emailService);
  }, [emailService]);

  return {
    notifyUserCreated: smtpIntegrationService.notifyUserCreated.bind(smtpIntegrationService),
    notifyVehicleActivated: smtpIntegrationService.notifyVehicleActivated.bind(smtpIntegrationService),
    sendOTPNotification: smtpIntegrationService.sendOTPNotification.bind(smtpIntegrationService),
    sendPasswordResetNotification: smtpIntegrationService.sendPasswordResetNotification.bind(smtpIntegrationService),
    isSMTPConfigured: smtpIntegrationService.isSMTPConfigured.bind(smtpIntegrationService),
    ...emailService
  };
};
