
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { handleCorsPreflightRequest, createResponse } from './cors.ts';
import { EmailRenderer } from './email-renderer.ts';
import { TemplateManager } from './template-manager.ts';
import { DeliveryLogger } from './delivery-logger.ts';
import { EmailSender } from './smtp-client.ts';

interface EmailRequest {
  to: string;
  trigger_type?: string;
  template_variables?: Record<string, string>;
  related_entity_id?: string;
  subject?: string;
  message?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  try {
    // Environment validation
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Missing Supabase environment variables');
      return createResponse({
        success: false,
        error: 'Server configuration error'
      }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Parse request
    const requestData: EmailRequest = await req.json();
    const { to, trigger_type, template_variables = {}, related_entity_id, subject, message } = requestData;

    console.log(`📧 SMTP Email Service Request:`, {
      to,
      trigger_type,
      has_variables: Object.keys(template_variables).length > 0,
      related_entity_id,
      fallback_subject: subject,
      fallback_message: !!message
    });

    if (!to) {
      return createResponse({
        success: false,
        error: 'Recipient email is required'
      }, 400);
    }

    // Initialize services
    const templateManager = new TemplateManager(supabaseUrl, supabaseAnonKey);
    const deliveryLogger = new DeliveryLogger(supabaseUrl, supabaseAnonKey);

    // Load SMTP configuration
    const smtpConfig = await EmailSender.loadConfig(supabase);
    if (!smtpConfig) {
      return createResponse({
        success: false,
        error: 'SMTP configuration not found or incomplete'
      }, 500);
    }

    const emailSender = new EmailSender(smtpConfig);

    // Get template by trigger type
    let template = null;
    let theme = null;
    
    if (trigger_type) {
      template = await templateManager.getTemplateByTrigger(trigger_type);
      
      if (template && template.selected_theme_id) {
        theme = await templateManager.getThemeById(template.selected_theme_id);
      }
      
      if (!theme) {
        theme = await templateManager.getDefaultTheme();
      }
    }

    // Prepare email content
    let emailSubject: string;
    let emailHtml: string;
    let emailText: string;

    if (template) {
      console.log(`✅ Using template: ${template.template_name}`);
      const rendered = await EmailRenderer.renderEmailWithTheme(template, theme, template_variables);
      emailSubject = rendered.subject;
      emailHtml = rendered.html;
      emailText = rendered.text;
    } else {
      console.log(`📝 Using fallback content for trigger: ${trigger_type}`);
      emailSubject = subject || `Notification from FleetIQ`;
      emailText = message || `You have received a notification from FleetIQ.`;
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">${emailSubject}</h2>
          <p>${emailText.replace(/\n/g, '<br>')}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="font-size: 12px; color: #6b7280;">
            This is an automated message from FleetIQ.
          </p>
        </div>
      `;
    }

    // Create delivery log
    const logId = await deliveryLogger.createDeliveryLog({
      email_template_id: template?.id,
      recipient_email: to,
      subject: emailSubject,
      status: 'QUEUED',
      trigger_type,
      related_entity_id,
      template_variables
    });

    try {
      // Update log to sending status
      if (logId) {
        await deliveryLogger.updateDeliveryLog(logId, { status: 'SENDING' });
      }

      // Send email
      await emailSender.sendEmail({
        to,
        subject: emailSubject,
        html: emailHtml,
        text: emailText
      });

      // Log success
      if (logId) {
        await deliveryLogger.logSuccess(logId);
      }

      console.log(`✅ Email sent successfully to: ${to}`);

      return createResponse({
        success: true,
        message: 'Email sent successfully',
        delivery_log_id: logId
      });

    } catch (emailError) {
      console.error(`❌ Email sending failed:`, emailError);
      
      // Log failure
      if (logId) {
        await deliveryLogger.logFailure(
          logId, 
          emailError instanceof Error ? emailError.message : 'Unknown error'
        );
      }

      return createResponse({
        success: false,
        error: 'Failed to send email',
        details: emailError instanceof Error ? emailError.message : 'Unknown error'
      }, 500);
    }

  } catch (error) {
    console.error('❌ SMTP Email Service error:', error);
    return createResponse({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});
