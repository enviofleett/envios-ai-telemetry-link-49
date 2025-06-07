
import React from 'react';
import { useGenericSMTPService } from '@/hooks/useGenericSMTPService';

class SMTPIntegrationService {
  private smtpService: any;

  constructor() {
    // This will be initialized when used in a React component
  }

  // Send welcome email
  async sendWelcomeEmail(email: string, userName: string) {
    try {
      if (this.smtpService && this.validateEmail(email)) {
        await this.smtpService.sendEmail({
          recipientEmail: email,
          subject: 'Welcome to Envio Platform!',
          htmlContent: `
            <h2>Welcome ${userName}!</h2>
            <p>Thank you for joining the Envio Platform.</p>
            <p>We're excited to have you on board and look forward to helping you manage your fleet efficiently.</p>
            <p>Best regards,<br>The Envio Team</p>
          `,
          textContent: `Welcome ${userName}! Thank you for joining the Envio Platform.`
        });
        console.log(`Welcome email sent to ${email}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return false;
    }
  }

  // Send vehicle activation notification
  async sendVehicleActivationEmail(email: string, userName: string, vehicleName: string, deviceId: string) {
    try {
      if (this.smtpService && this.validateEmail(email)) {
        await this.smtpService.sendEmail({
          recipientEmail: email,
          subject: 'Vehicle Activated Successfully',
          htmlContent: `
            <h2>Vehicle Activation Confirmation</h2>
            <p>Hello ${userName},</p>
            <p>Your vehicle "${vehicleName}" (Device ID: ${deviceId}) has been successfully activated.</p>
            <p>You can now track and manage this vehicle through your Envio dashboard.</p>
            <p>Best regards,<br>Envio Platform</p>
          `,
          textContent: `Hello ${userName}, your vehicle "${vehicleName}" (Device ID: ${deviceId}) has been successfully activated.`
        });
        console.log(`Vehicle activation email sent to ${email} for vehicle ${vehicleName}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to send vehicle activation email:', error);
      return false;
    }
  }

  // Send OTP notification
  async sendOTPNotification(email: string, otpCode: string, expiryMinutes = 10) {
    try {
      if (this.smtpService && this.validateEmail(email) && this.validateOTP(otpCode)) {
        await this.smtpService.sendEmail({
          recipientEmail: email,
          subject: 'Your OTP Verification Code',
          htmlContent: `
            <h2>OTP Verification</h2>
            <p>Hello,</p>
            <p>Your OTP verification code is: <strong>${otpCode}</strong></p>
            <p>This code will expire in ${expiryMinutes} minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
          `,
          textContent: `Your OTP verification code is: ${otpCode}. This code will expire in ${expiryMinutes} minutes.`
        });
        console.log(`OTP email sent to ${email}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      return false;
    }
  }

  // Send password reset notification
  async sendPasswordResetNotification(email: string, userName: string, resetLink: string) {
    try {
      if (this.smtpService && this.validateEmail(email) && this.validateUrl(resetLink)) {
        await this.smtpService.sendEmail({
          recipientEmail: email,
          subject: 'Password Reset Request',
          htmlContent: `
            <h2>Password Reset</h2>
            <p>Hello ${userName},</p>
            <p>Click the link below to reset your password:</p>
            <p><a href="${resetLink}">Reset Password</a></p>
            <p>This link will expire in 30 minutes.</p>
            <p>If you didn't request this reset, please ignore this email.</p>
          `,
          textContent: `Hello ${userName}, click this link to reset your password: ${resetLink}. This link will expire in 30 minutes.`
        });
        console.log(`Password reset email sent to ${email}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return false;
    }
  }

  // Send bulk emails
  async sendBulkEmails(emails: Array<{
    email: string;
    userName: string;
    subject: string;
    htmlContent: string;
    textContent?: string;
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
              subject: emailData.subject,
              htmlContent: emailData.htmlContent,
              textContent: emailData.textContent
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
}

export const smtpIntegrationService = new SMTPIntegrationService();

// React hook for using SMTP integration in components
export const useSMTPIntegration = () => {
  const smtpService = useGenericSMTPService();
  
  // Set email service instance
  React.useEffect(() => {
    smtpIntegrationService.setSMTPService(smtpService);
  }, [smtpService]);

  return {
    // Enhanced service methods
    sendWelcomeEmail: smtpIntegrationService.sendWelcomeEmail.bind(smtpIntegrationService),
    sendVehicleActivationEmail: smtpIntegrationService.sendVehicleActivationEmail.bind(smtpIntegrationService),
    sendOTPNotification: smtpIntegrationService.sendOTPNotification.bind(smtpIntegrationService),
    sendPasswordResetNotification: smtpIntegrationService.sendPasswordResetNotification.bind(smtpIntegrationService),
    sendBulkEmails: smtpIntegrationService.sendBulkEmails.bind(smtpIntegrationService),
    isSMTPConfigured: smtpIntegrationService.isSMTPConfigured.bind(smtpIntegrationService),
    
    // Original service methods and data
    ...smtpService
  };
};
