
import React from 'react';
import { useProductionSMTPService } from '@/hooks/useProductionSMTPService';

class ProductionSMTPIntegrationService {
  private smtpService: any;

  constructor() {
    // This will be initialized when used in a React component
  }

  // Integration with GP51 user creation
  async notifyUserCreated(email: string, userName: string, isFromGP51 = false) {
    try {
      if (this.smtpService && this.validateEmail(email)) {
        await this.smtpService.sendWelcomeEmail(email, userName);
        console.log(`Welcome email sent to ${email}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Don't throw - email failure shouldn't break user creation
      return false;
    }
  }

  // Integration with vehicle activation
  async notifyVehicleActivated(email: string, userName: string, vehicleName: string, deviceId: string) {
    try {
      if (this.smtpService && this.validateEmail(email)) {
        await this.smtpService.sendVehicleActivationEmail(email, userName, vehicleName, deviceId);
        console.log(`Vehicle activation email sent to ${email} for vehicle ${vehicleName}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to send vehicle activation email:', error);
      return false;
    }
  }

  // Integration with OTP system
  async sendOTPNotification(email: string, otpCode: string, expiryMinutes = 10) {
    try {
      if (this.smtpService && this.validateEmail(email) && this.validateOTP(otpCode)) {
        await this.smtpService.sendOTPEmail(email, otpCode, expiryMinutes);
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
      if (this.smtpService && this.validateEmail(email) && this.validateUrl(resetLink)) {
        await this.smtpService.sendPasswordResetEmail(email, userName, resetLink);
        console.log(`Password reset email sent to ${email}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return false;
    }
  }

  // Enhanced bulk email sending with rate limiting
  async sendBulkEmails(emails: Array<{
    email: string;
    userName: string;
    templateType: 'welcome' | 'otp' | 'password_reset' | 'vehicle_activation';
    placeholderData?: Record<string, string>;
  }>) {
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as Array<{ email: string; error: string }>
    };

    // Process emails in batches to avoid overwhelming the SMTP server
    const batchSize = 10;
    const delay = 1000; // 1 second delay between batches

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(async (emailData) => {
          try {
            if (!this.validateEmail(emailData.email)) {
              throw new Error('Invalid email address');
            }

            await this.smtpService.sendEmail({
              recipientEmail: emailData.email,
              templateType: emailData.templateType,
              placeholderData: {
                user_name: emailData.userName,
                ...emailData.placeholderData
              }
            });
            
            results.sent++;
          } catch (error) {
            results.failed++;
            results.errors.push({
              email: emailData.email,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        })
      );

      // Add delay between batches
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return results;
  }

  // Validation helpers
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private validateOTP(otp: string): boolean {
    // OTP should be 6 digits
    return /^\d{6}$/.test(otp);
  }

  private validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Set email service instance (called from React components)
  setSMTPService(smtpService: any) {
    this.smtpService = smtpService;
  }

  // Check if SMTP is configured and available
  async isSMTPConfigured(): Promise<boolean> {
    try {
      if (!this.smtpService || !this.smtpService.smtpConfigs) {
        return false;
      }
      
      const activeConfigs = this.smtpService.smtpConfigs.filter((config: any) => config.is_active);
      return activeConfigs.length > 0;
    } catch (error) {
      console.error('Failed to check SMTP status:', error);
      return false;
    }
  }

  // Get SMTP service health status
  async getHealthStatus() {
    try {
      const isConfigured = await this.isSMTPConfigured();
      const recentLogs = this.smtpService?.emailLogs?.slice(0, 10) || [];
      const recentFailures = recentLogs.filter((log: any) => log.status === 'failed').length;
      const successRate = recentLogs.length > 0 ? 
        ((recentLogs.length - recentFailures) / recentLogs.length * 100).toFixed(1) : '100';

      return {
        configured: isConfigured,
        recentSuccessRate: successRate,
        recentFailures,
        totalRecentEmails: recentLogs.length,
        status: isConfigured ? 'healthy' : 'not_configured'
      };
    } catch (error) {
      console.error('Failed to get SMTP health status:', error);
      return {
        configured: false,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const productionSMTPIntegrationService = new ProductionSMTPIntegrationService();

// React hook for using production SMTP integration in components
export const useProductionSMTPIntegration = () => {
  const smtpService = useProductionSMTPService();
  
  // Set email service instance
  React.useEffect(() => {
    productionSMTPIntegrationService.setSMTPService(smtpService);
  }, [smtpService]);

  return {
    // Enhanced service methods
    notifyUserCreated: productionSMTPIntegrationService.notifyUserCreated.bind(productionSMTPIntegrationService),
    notifyVehicleActivated: productionSMTPIntegrationService.notifyVehicleActivated.bind(productionSMTPIntegrationService),
    sendOTPNotification: productionSMTPIntegrationService.sendOTPNotification.bind(productionSMTPIntegrationService),
    sendPasswordResetNotification: productionSMTPIntegrationService.sendPasswordResetNotification.bind(productionSMTPIntegrationService),
    sendBulkEmails: productionSMTPIntegrationService.sendBulkEmails.bind(productionSMTPIntegrationService),
    isSMTPConfigured: productionSMTPIntegrationService.isSMTPConfigured.bind(productionSMTPIntegrationService),
    getHealthStatus: productionSMTPIntegrationService.getHealthStatus.bind(productionSMTPIntegrationService),
    
    // Original service methods and data
    ...smtpService
  };
};

// Export the original service for backward compatibility
export { smtpIntegrationService } from './smtpIntegrationService';
export const useSMTPIntegration = useProductionSMTPIntegration;
