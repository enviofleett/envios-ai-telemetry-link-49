
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { EmailRequest, RequestValidator } from './request-validator.ts';
import { EmailContentBuilder } from './email-content-builder.ts';
import { TemplateManager } from './template-manager.ts';
import { DeliveryLogger } from './delivery-logger.ts';
import { EmailSender } from './smtp-client.ts';
import { createResponse } from './cors.ts';

export class EmailServiceOrchestrator {
  private supabase;
  private templateManager: TemplateManager;
  private deliveryLogger: DeliveryLogger;
  private emailContentBuilder: EmailContentBuilder;

  constructor(supabaseUrl: string, supabaseServiceRoleKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    this.templateManager = new TemplateManager(supabaseUrl, supabaseServiceRoleKey);
    this.deliveryLogger = new DeliveryLogger(supabaseUrl, supabaseServiceRoleKey);
    this.emailContentBuilder = new EmailContentBuilder(this.templateManager);
  }

  async processEmailRequest(requestData: EmailRequest): Promise<Response> {
    const { to, trigger_type, template_variables = {}, related_entity_id, subject, message } = requestData;

    console.log(`📧 SMTP Email Service Request:`, {
      to,
      trigger_type,
      has_variables: Object.keys(template_variables).length > 0,
      related_entity_id,
      fallback_subject: subject,
      fallback_message: !!message
    });

    // Validate request
    const validation = RequestValidator.validateEmailRequest(requestData);
    if (!validation.isValid) {
      return createResponse({
        success: false,
        error: validation.error,
        details: validation.details
      }, 400);
    }

    // Load SMTP configuration
    console.log('📧 Loading SMTP configuration using Service Role Key...');
    const smtpConfig = await EmailSender.loadConfig(this.supabase);
    if (!smtpConfig) {
      return createResponse({
        success: false,
        error: 'SMTP configuration not found or incomplete. Please configure your SMTP settings first.',
        details: 'Check that you have set up SMTP host, port, username, password, and encryption type in your SMTP settings.'
      }, 500);
    }

    const emailSender = new EmailSender(smtpConfig);

    // Build email content
    const emailContent = await this.emailContentBuilder.buildEmailContent(
      trigger_type,
      template_variables,
      subject,
      message
    );

    // Create delivery log
    const logId = await this.deliveryLogger.createDeliveryLog({
      recipient_email: to,
      subject: emailContent.subject,
      status: 'QUEUED',
      trigger_type,
      related_entity_id,
      template_variables
    });

    try {
      // Update log to sending status
      if (logId) {
        await this.deliveryLogger.updateDeliveryLog(logId, { status: 'SENDING' });
      }

      console.log('📧 Attempting to send email with validated configuration...');
      
      // Send email
      await emailSender.sendEmail({
        to,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text
      });

      // Log success
      if (logId) {
        await this.deliveryLogger.logSuccess(logId);
      }

      console.log(`✅ Email sent successfully to: ${to}`);

      return createResponse({
        success: true,
        message: 'Email sent successfully',
        delivery_log_id: logId
      });

    } catch (emailError) {
      console.error(`❌ Email sending failed:`, emailError);
      
      // Log failure with detailed error information
      if (logId) {
        await this.deliveryLogger.logFailure(
          logId, 
          emailError instanceof Error ? emailError.message : 'Unknown error'
        );
      }

      // Return detailed error information for debugging
      const errorMessage = emailError instanceof Error ? emailError.message : 'Unknown error occurred';
      
      return createResponse({
        success: false,
        error: 'Failed to send email',
        details: errorMessage,
        troubleshooting: {
          smtp_host: smtpConfig.hostname,
          smtp_port: smtpConfig.port,
          smtp_username: smtpConfig.username,
          smtp_encryption: smtpConfig.encryption,
          suggestions: [
            'Verify SMTP hostname is correct (should be like smtp.gmail.com, not gmail.com)',
            'Check that SMTP username is a valid email address',
            'Confirm SMTP password is correct',
            'Ensure encryption type matches your email provider requirements',
            'For Gmail: Use App Password instead of regular password',
            'For Office365: Use smtp.office365.com with port 587 and TLS'
          ]
        }
      }, 500);
    }
  }
}
