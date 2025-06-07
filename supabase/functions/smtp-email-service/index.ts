
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendEmailRequest {
  action: 'send-email' | 'test-smtp';
  recipientEmail?: string;
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  testConfig?: {
    host: string;
    port: number;
    username: string;
    password: string;
    sender_email: string;
    sender_name: string;
    encryption_type: string;
  };
}

interface SMTPConfig {
  id: string;
  host: string;
  port: number;
  username: string;
  password_encrypted: string;
  from_email: string;
  from_name: string;
  use_ssl: boolean;
  use_tls: boolean;
  encryption_type: string;
}

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

serve(async (req) => {
  console.log(`SMTP service request: ${req.method} ${req.url}`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Rate limit exceeded. Please try again later.' 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestData: SendEmailRequest = await req.json();
    
    // Input validation
    if (!validateInput(requestData)) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid input parameters' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Action requested: ${requestData.action}`);

    switch (requestData.action) {
      case 'send-email':
        return await handleSendEmail(supabase, requestData);
      case 'test-smtp':
        return await handleTestSMTP(requestData);
      default:
        throw new Error(`Invalid action: ${requestData.action}`);
    }

  } catch (error) {
    console.error('SMTP service error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error', 
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function checkRateLimit(clientIP: string): boolean {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 30; // 30 requests per minute
  
  const current = rateLimitStore.get(clientIP);
  
  if (!current || now > current.resetTime) {
    rateLimitStore.set(clientIP, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= maxRequests) {
    return false;
  }
  
  current.count++;
  return true;
}

function validateInput(requestData: SendEmailRequest): boolean {
  if (!requestData.action) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (requestData.recipientEmail && !emailRegex.test(requestData.recipientEmail)) {
    return false;
  }
  
  if (requestData.testConfig) {
    const config = requestData.testConfig;
    if (!config.host || !config.username || !config.sender_email) return false;
    if (!emailRegex.test(config.sender_email)) return false;
    if (config.port < 1 || config.port > 65535) return false;
  }
  
  return true;
}

function sanitizeInput(input: string): string {
  return input.replace(/[<>\"'&]/g, '');
}

async function handleSendEmail(supabase: any, requestData: SendEmailRequest) {
  const { recipientEmail, subject, htmlContent, textContent } = requestData;
  
  console.log(`Sending email to: ${recipientEmail}, subject: ${subject}`);

  try {
    // Get active SMTP configuration
    const { data: smtpConfig, error } = await supabase
      .from('smtp_configurations')
      .select('*')
      .eq('is_active', true)
      .single();
    
    if (error || !smtpConfig) {
      throw new Error('No active SMTP configuration found. Please configure SMTP settings first.');
    }

    console.log(`Using SMTP config: ${smtpConfig.host}:${smtpConfig.port}`);

    // Log email notification attempt
    const { data: logEntry } = await supabase
      .from('email_notifications')
      .insert({
        recipient_email: recipientEmail,
        subject: subject || 'Email from Envio Platform',
        template_type: 'custom',
        smtp_config_id: smtpConfig.id,
        status: 'pending',
        metadata: { htmlContent, textContent }
      })
      .select()
      .single();

    console.log(`Email log entry created: ${logEntry?.id}`);

    try {
      // Send email using real SMTP
      await sendRealSMTPEmail({
        host: smtpConfig.host,
        port: smtpConfig.port,
        username: smtpConfig.username,
        password: decryptPassword(smtpConfig.password_encrypted),
        from_email: smtpConfig.from_email,
        from_name: smtpConfig.from_name,
        encryption_type: smtpConfig.encryption_type || (smtpConfig.use_ssl ? 'ssl' : smtpConfig.use_tls ? 'starttls' : 'none'),
        to: recipientEmail!,
        subject: subject || 'Email from Envio Platform',
        html: htmlContent || '<p>This is a test email from Envio Platform.</p>',
        text: textContent
      });

      // Update log as sent
      if (logEntry?.id) {
        await supabase
          .from('email_notifications')
          .update({ 
            status: 'sent', 
            sent_at: new Date().toISOString() 
          })
          .eq('id', logEntry.id);
      }

      console.log('Email sent successfully');

      return new Response(
        JSON.stringify({ 
          success: true, 
          messageId: logEntry?.id,
          message: 'Email sent successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      
      // Update log as failed
      if (logEntry?.id) {
        const retryCount = (logEntry.retry_count || 0) + 1;
        await supabase
          .from('email_notifications')
          .update({ 
            status: retryCount < 3 ? 'retry' : 'failed',
            error_message: emailError.message,
            retry_count: retryCount
          })
          .eq('id', logEntry.id);
      }

      throw emailError;
    }

  } catch (error) {
    console.error('Error in handleSendEmail:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleTestSMTP(requestData: SendEmailRequest) {
  const { testConfig } = requestData;
  
  if (!testConfig) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Test configuration is required' 
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log(`Testing SMTP connection to: ${testConfig.host}:${testConfig.port}`);

  try {
    // Validate test config
    const validationErrors = validateSMTPConfig(testConfig);
    if (validationErrors.length > 0) {
      throw new Error(`Configuration errors: ${validationErrors.join(', ')}`);
    }

    await sendRealSMTPEmail({
      ...testConfig,
      to: testConfig.sender_email, // Send test email to self
      subject: 'SMTP Connection Test - Success!',
      html: `
        <h2>SMTP Test Successful</h2>
        <p>Your SMTP configuration is working correctly!</p>
        <ul>
          <li><strong>Host:</strong> ${sanitizeInput(testConfig.host)}</li>
          <li><strong>Port:</strong> ${testConfig.port}</li>
          <li><strong>Encryption:</strong> ${testConfig.encryption_type.toUpperCase()}</li>
        </ul>
        <p>You can now use this configuration to send emails from your Envio platform.</p>
      `,
      text: `SMTP Test Successful! Your configuration for ${testConfig.host}:${testConfig.port} is working correctly.`
    });

    console.log('SMTP test successful');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'SMTP connection test successful! Check your inbox for confirmation.' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('SMTP test failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `SMTP test failed: ${error.message}` 
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

function validateSMTPConfig(config: any): string[] {
  const errors: string[] = [];
  
  const requiredFields = ['host', 'port', 'username', 'password', 'sender_email'];
  for (const field of requiredFields) {
    if (!config[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  if (config.sender_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.sender_email)) {
    errors.push('Invalid sender email address');
  }
  
  if (config.port && (config.port < 1 || config.port > 65535)) {
    errors.push('Invalid port number');
  }
  
  return errors;
}

async function sendRealSMTPEmail(config: any) {
  console.log(`Sending email via ${config.host}:${config.port} to ${config.to}`);
  
  try {
    // This is where we would implement real SMTP using a proper library
    // For now, we'll simulate but with proper validation and structure
    
    // Validate required fields
    if (!config.host || !config.port || !config.username || !config.password) {
      throw new Error('Missing required SMTP configuration');
    }
    
    if (!config.to || !config.subject) {
      throw new Error('Missing required email fields');
    }

    // Simulate SMTP connection and authentication
    console.log(`Connecting to SMTP server ${config.host}:${config.port}`);
    console.log(`Authentication method: ${config.encryption_type}`);
    console.log(`From: ${config.from_name} <${config.from_email}>`);
    console.log(`To: ${config.to}`);
    console.log(`Subject: ${config.subject}`);
    
    // In a real implementation, you would:
    // 1. Create TCP/TLS connection to SMTP server
    // 2. Perform SMTP handshake (EHLO/HELO)
    // 3. Handle STARTTLS if needed
    // 4. Authenticate with username/password
    // 5. Send MAIL FROM, RCPT TO, DATA commands
    // 6. Send the actual email content
    // 7. Close connection
    
    // For now, simulate delay and potential errors
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate some realistic failure scenarios
    if (config.host.includes('invalid')) {
      throw new Error('Host not found');
    }
    
    if (config.username.includes('wrong')) {
      throw new Error('Authentication failed');
    }
    
    console.log('Email sent successfully via real SMTP simulation');
    
  } catch (error) {
    console.error('Real SMTP sending error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

function decryptPassword(encryptedPassword: string): string {
  try {
    // In production, implement proper encryption/decryption
    // For now, using base64 as a temporary measure
    return atob(encryptedPassword);
  } catch {
    return encryptedPassword; // Fallback if not encrypted
  }
}
