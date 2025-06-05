
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendEmailRequest {
  action: 'send-email' | 'test-smtp' | 'get-templates';
  recipientEmail?: string;
  templateType?: string;
  placeholderData?: Record<string, string>;
  smtpConfigId?: string;
  testConfig?: {
    host: string;
    port: number;
    username: string;
    password: string;
    from_email: string;
    from_name: string;
    use_ssl: boolean;
    use_tls: boolean;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestData: SendEmailRequest = await req.json();
    const { action } = requestData;

    if (action === 'send-email') {
      return await handleSendEmail(supabase, requestData);
    } else if (action === 'test-smtp') {
      return await handleTestSMTP(requestData);
    } else if (action === 'get-templates') {
      return await handleGetTemplates(supabase);
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('SMTP service error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleSendEmail(supabase: any, requestData: SendEmailRequest) {
  const { recipientEmail, templateType, placeholderData, smtpConfigId } = requestData;

  // Get SMTP configuration
  const { data: smtpConfig, error: smtpError } = await supabase
    .from('smtp_configurations')
    .select('*')
    .eq('id', smtpConfigId || '')
    .eq('is_active', true)
    .single();

  if (smtpError || !smtpConfig) {
    // Fallback to active SMTP config
    const { data: fallbackConfig } = await supabase
      .from('smtp_configurations')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single();
    
    if (!fallbackConfig) {
      throw new Error('No active SMTP configuration found');
    }
    smtpConfig = fallbackConfig;
  }

  // Get email template
  const { data: template, error: templateError } = await supabase
    .from('email_templates')
    .select('*')
    .eq('template_type', templateType)
    .eq('is_active', true)
    .single();

  if (templateError || !template) {
    throw new Error(`Email template not found for type: ${templateType}`);
  }

  // Process template with placeholders
  const processedSubject = replacePlaceholders(template.subject, placeholderData || {});
  const processedBody = replacePlaceholders(template.body_html, placeholderData || {});

  // Log email notification
  const { data: logEntry } = await supabase
    .from('email_notifications')
    .insert({
      recipient_email: recipientEmail,
      subject: processedSubject,
      template_type: templateType,
      smtp_config_id: smtpConfig.id,
      status: 'pending',
      metadata: { placeholderData }
    })
    .select()
    .single();

  try {
    // Send email using SMTP
    await sendSMTPEmail({
      host: smtpConfig.host,
      port: smtpConfig.port,
      username: smtpConfig.username,
      password: decrypt(smtpConfig.password_encrypted),
      from_email: smtpConfig.from_email,
      from_name: smtpConfig.from_name,
      use_ssl: smtpConfig.use_ssl,
      use_tls: smtpConfig.use_tls,
      to: recipientEmail!,
      subject: processedSubject,
      html: processedBody
    });

    // Update log as sent
    await supabase
      .from('email_notifications')
      .update({ 
        status: 'sent', 
        sent_at: new Date().toISOString() 
      })
      .eq('id', logEntry.id);

    return new Response(
      JSON.stringify({ success: true, messageId: logEntry.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    // Update log as failed
    await supabase
      .from('email_notifications')
      .update({ 
        status: 'failed',
        error_message: error.message,
        retry_count: 1
      })
      .eq('id', logEntry.id);

    throw error;
  }
}

async function handleTestSMTP(requestData: SendEmailRequest) {
  const { testConfig } = requestData;
  
  if (!testConfig) {
    throw new Error('Test configuration is required');
  }

  try {
    await sendSMTPEmail({
      ...testConfig,
      password: testConfig.password,
      to: testConfig.from_email, // Send test email to self
      subject: 'SMTP Test Email',
      html: '<p>This is a test email to verify SMTP configuration.</p>'
    });

    return new Response(
      JSON.stringify({ success: true, message: 'SMTP test successful' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleGetTemplates(supabase: any) {
  const { data: templates, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('is_active', true);

  if (error) {
    throw error;
  }

  return new Response(
    JSON.stringify({ templates }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function sendSMTPEmail(config: any) {
  // Using nodemailer-like implementation for Deno
  const { SMTPClient } = await import("https://deno.land/x/denomailer@1.6.0/mod.ts");
  
  const client = new SMTPClient({
    connection: {
      hostname: config.host,
      port: config.port,
      tls: config.use_ssl,
      auth: {
        username: config.username,
        password: config.password,
      },
    },
  });

  await client.send({
    from: `${config.from_name} <${config.from_email}>`,
    to: config.to,
    subject: config.subject,
    content: config.html,
    html: config.html,
  });

  await client.close();
}

function replacePlaceholders(template: string, data: Record<string, string>): string {
  let result = template;
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    result = result.replaceAll(placeholder, value);
  });
  return result;
}

function decrypt(encryptedPassword: string): string {
  // Simple base64 decoding for now - in production, use proper encryption
  try {
    return atob(encryptedPassword);
  } catch {
    return encryptedPassword; // Fallback if not encrypted
  }
}
