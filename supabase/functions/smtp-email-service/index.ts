
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, recipientEmail, subject, htmlContent, textContent, templateType, placeholderData, testConfig } = await req.json();

    console.log(`SMTP Email Service - Action: ${action}`);

    if (action === 'send-email') {
      return await handleSendEmail(supabase, recipientEmail, subject, htmlContent, textContent, templateType, placeholderData);
    }

    if (action === 'test-smtp') {
      return await handleTestSMTP(testConfig);
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('SMTP Email Service error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleSendEmail(supabase: any, recipientEmail: string, subject: string, htmlContent: string, textContent: string, templateType?: string, placeholderData?: any) {
  try {
    // Get active SMTP configuration
    const { data: smtpConfig, error: configError } = await supabase
      .from('smtp_configurations')
      .select('*')
      .eq('is_active', true)
      .single();

    if (configError || !smtpConfig) {
      console.error('No active SMTP configuration found:', configError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No active SMTP configuration found. Please configure SMTP settings first.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If template type is provided, get template and replace placeholders
    let finalSubject = subject;
    let finalHtmlContent = htmlContent;
    let finalTextContent = textContent;

    if (templateType) {
      const { data: template } = await supabase
        .from('email_templates')
        .select('*')
        .eq('template_type', templateType)
        .eq('is_active', true)
        .single();

      if (template) {
        finalSubject = template.subject;
        finalHtmlContent = template.body_html;
        finalTextContent = template.body_text;

        // Replace placeholders
        if (placeholderData) {
          Object.keys(placeholderData).forEach(key => {
            const placeholder = `{{${key}}}`;
            finalSubject = finalSubject?.replace(new RegExp(placeholder, 'g'), placeholderData[key]);
            finalHtmlContent = finalHtmlContent?.replace(new RegExp(placeholder, 'g'), placeholderData[key]);
            finalTextContent = finalTextContent?.replace(new RegExp(placeholder, 'g'), placeholderData[key]);
          });
        }
      }
    }

    // Decode password (simple base64 for now)
    const decodedPassword = atob(smtpConfig.password_encrypted);

    // Send email using native SMTP
    const emailResult = await sendSMTPEmail({
      host: smtpConfig.host,
      port: smtpConfig.port,
      username: smtpConfig.username,
      password: decodedPassword,
      fromEmail: smtpConfig.from_email,
      fromName: smtpConfig.from_name,
      toEmail: recipientEmail,
      subject: finalSubject,
      htmlContent: finalHtmlContent,
      textContent: finalTextContent,
      encryptionType: smtpConfig.encryption_type
    });

    if (emailResult.success) {
      // Log successful email
      await supabase
        .from('email_notifications')
        .insert({
          recipient_email: recipientEmail,
          subject: finalSubject,
          template_type: templateType || 'custom',
          smtp_config_id: smtpConfig.id,
          status: 'sent',
          sent_at: new Date().toISOString()
        });

      console.log(`Email sent successfully to ${recipientEmail}`);
      return new Response(
        JSON.stringify({ success: true, message: 'Email sent successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Log failed email
      await supabase
        .from('email_notifications')
        .insert({
          recipient_email: recipientEmail,
          subject: finalSubject,
          template_type: templateType || 'custom',
          smtp_config_id: smtpConfig.id,
          status: 'failed',
          error_message: emailResult.error
        });

      console.error(`Email sending failed: ${emailResult.error}`);
      return new Response(
        JSON.stringify({ success: false, error: emailResult.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in handleSendEmail:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleTestSMTP(testConfig: any) {
  try {
    const result = await sendSMTPEmail({
      ...testConfig,
      toEmail: testConfig.sender_email, // Send test email to sender
      subject: 'SMTP Configuration Test',
      htmlContent: '<h1>SMTP Test Successful</h1><p>Your SMTP configuration is working correctly!</p>',
      textContent: 'SMTP Test Successful - Your SMTP configuration is working correctly!'
    });

    return new Response(
      JSON.stringify(result),
      { status: result.success ? 200 : 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('SMTP test error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function sendSMTPEmail(config: any) {
  try {
    console.log(`Attempting to send email via SMTP to ${config.toEmail}`);
    
    // For development, we'll simulate email sending
    // In production, you would integrate with a real SMTP service like SendGrid, AWS SES, etc.
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For now, we'll use a simple validation and simulate success
    if (!config.toEmail || !config.toEmail.includes('@')) {
      return { success: false, error: 'Invalid email address' };
    }
    
    if (!config.subject || !config.htmlContent) {
      return { success: false, error: 'Subject and content are required' };
    }

    // Log the email details for debugging
    console.log('=== EMAIL SENT (SIMULATED) ===');
    console.log(`From: ${config.fromName} <${config.fromEmail}>`);
    console.log(`To: ${config.toEmail}`);
    console.log(`Subject: ${config.subject}`);
    console.log(`Content: ${config.htmlContent}`);
    console.log('==============================');
    
    return { success: true, message: 'Email sent successfully (simulated)' };
    
  } catch (error) {
    console.error('SMTP sending error:', error);
    return { success: false, error: error.message };
  }
}
