
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import SmtpClient from "https://deno.land/x/denomailer@1.6.0/mod.ts";

// Enhanced CORS headers with all required methods
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400', // 24 hours
};

interface EmailRequest {
  to: string;
  subject?: string;
  message?: string;
  from?: string;
  template_id?: string;
  trigger_type?: string;
  template_variables?: Record<string, string>;
  related_entity_id?: string;
}

interface SMTPConfig {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_pass_encrypted: string;
  use_tls: boolean;
  use_ssl: boolean;
}

interface EmailTemplate {
  id: string;
  subject: string;
  html_body_template: string;
  text_body_template: string;
  selected_theme_id: string;
  variables: string[];
}

interface EmailTheme {
  id: string;
  name: string;
  header_html: string;
  footer_html: string;
  styles_css: string;
}

// Request size limit (1MB)
const MAX_REQUEST_SIZE = 1024 * 1024;

// Timeout for SMTP operations (30 seconds)
const SMTP_TIMEOUT = 30000;

// Template variable substitution function
function substituteVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(placeholder, String(value));
  }
  return result;
}

// Apply theme to email content
function applyTheme(content: string, theme: EmailTheme): string {
  const styledContent = `
    <html>
      <head>
        <style>${theme.styles_css}</style>
      </head>
      <body>
        <div class="container">
          ${theme.header_html}
          ${content}
          ${theme.footer_html}
        </div>
      </body>
    </html>
  `;
  return styledContent;
}

serve(async (req) => {
  const requestId = crypto.randomUUID();
  console.log(`📧 [${requestId}] Enhanced SMTP Email Service Request: ${req.method} ${req.url}`);
  
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      console.log(`✅ [${requestId}] Handling CORS preflight request`);
      return new Response(null, { 
        status: 200,
        headers: corsHeaders 
      });
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      console.log(`❌ [${requestId}] Method not allowed: ${req.method}`);
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Allow': 'POST, OPTIONS'
          } 
        }
      );
    }

    // Validate environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error(`❌ [${requestId}] Missing required environment variables`);
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error',
          message: 'Required environment variables are not configured'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check request size
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
      console.error(`❌ [${requestId}] Request too large: ${contentLength} bytes`);
      return new Response(
        JSON.stringify({ 
          error: 'Request too large',
          message: 'Email request exceeds maximum size limit'
        }),
        { 
          status: 413, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extract and validate JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error(`❌ [${requestId}] Missing or invalid Authorization header`);
      return new Response(
        JSON.stringify({ 
          error: 'Authentication required',
          message: 'Valid Bearer token is required'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Validate the JWT token and get user
    let user;
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !authUser) {
        console.error(`❌ [${requestId}] JWT validation failed:`, authError?.message || 'No user found');
        return new Response(
          JSON.stringify({ 
            error: 'Invalid authentication token',
            message: 'The provided token is invalid or expired'
          }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      user = authUser;
      console.log(`✅ [${requestId}] User authenticated: ${user.id}`);
    } catch (error) {
      console.error(`❌ [${requestId}] Authentication error:`, error);
      return new Response(
        JSON.stringify({ 
          error: 'Authentication failed',
          message: 'Unable to verify authentication token'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body with timeout
    let emailRequest: EmailRequest;
    try {
      const body = await Promise.race([
        req.text(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        )
      ]);
      
      emailRequest = JSON.parse(body);
      console.log(`📝 [${requestId}] Request parsed successfully - to: ${emailRequest.to}, trigger: ${emailRequest.trigger_type || 'direct'}`);
    } catch (error) {
      console.error(`❌ [${requestId}] Failed to parse request body:`, error);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request body',
          message: error instanceof Error ? error.message : 'Invalid JSON payload'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate required fields
    if (!emailRequest.to) {
      console.error(`❌ [${requestId}] Missing recipient email`);
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          message: 'Field "to" is required'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailRequest.to)) {
      console.error(`❌ [${requestId}] Invalid email format: ${emailRequest.to}`);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid email format',
          message: 'The recipient email address is not valid'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get user's SMTP configuration
    let smtpConfig: SMTPConfig;
    try {
      console.log(`🔍 [${requestId}] Fetching SMTP configuration for user: ${user.id}`);
      
      const { data: config, error: configError } = await supabase
        .from('smtp_configurations')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('is_default', true)
        .single();

      if (configError || !config) {
        console.error(`❌ [${requestId}] No SMTP configuration found:`, configError?.message);
        return new Response(
          JSON.stringify({ 
            error: 'SMTP configuration not found',
            message: 'No active SMTP configuration found. Please configure SMTP settings first.'
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      smtpConfig = config;
      console.log(`📧 [${requestId}] SMTP config loaded for host: ${smtpConfig.smtp_host}`);
    } catch (error) {
      console.error(`❌ [${requestId}] Database error fetching SMTP config:`, error);
      return new Response(
        JSON.stringify({ 
          error: 'Configuration error',
          message: 'Unable to retrieve SMTP configuration'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Process email template and theme if provided
    let finalMessage = emailRequest.message || '';
    let finalSubject = emailRequest.subject || 'FleetIQ Notification';
    let htmlMessage = '';
    let templateId: string | null = null;

    // Check if we need to fetch a template
    if (emailRequest.template_id || emailRequest.trigger_type) {
      try {
        console.log(`📄 [${requestId}] Fetching email template for ${emailRequest.template_id || emailRequest.trigger_type}`);
        
        let templateQuery = supabase
          .from('email_templates')
          .select('id, subject, html_body_template, text_body_template, selected_theme_id, variables')
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (emailRequest.template_id) {
          templateQuery = templateQuery.eq('id', emailRequest.template_id);
        } else if (emailRequest.trigger_type) {
          templateQuery = templateQuery.eq('trigger_type', emailRequest.trigger_type);
        }

        const { data: template, error: templateError } = await templateQuery.single();

        if (template && !templateError) {
          console.log(`📄 [${requestId}] Template found: ${template.id}`);
          templateId = template.id;

          // Apply variable substitution
          const variables = emailRequest.template_variables || {};
          finalSubject = substituteVariables(template.subject, variables);
          finalMessage = substituteVariables(template.text_body_template || '', variables);
          htmlMessage = substituteVariables(template.html_body_template || '', variables);

          // Fetch and apply theme if specified
          if (template.selected_theme_id) {
            console.log(`🎨 [${requestId}] Fetching theme: ${template.selected_theme_id}`);
            
            const { data: theme, error: themeError } = await supabase
              .from('email_themes')
              .select('*')
              .eq('id', template.selected_theme_id)
              .eq('is_active', true)
              .single();

            if (theme && !themeError) {
              console.log(`🎨 [${requestId}] Applying theme: ${theme.name}`);
              htmlMessage = applyTheme(htmlMessage, theme);
            } else {
              console.warn(`⚠️ [${requestId}] Theme not found: ${template.selected_theme_id}`);
            }
          }

          console.log(`📄 [${requestId}] Template and theme processed successfully`);
        } else {
          console.warn(`⚠️ [${requestId}] Template not found, using direct message`);
          if (!emailRequest.message || !emailRequest.subject) {
            return new Response(
              JSON.stringify({ 
                error: 'Template not found',
                message: 'Template not found and no direct message provided'
              }),
              { 
                status: 400, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          }
        }
      } catch (error) {
        console.error(`❌ [${requestId}] Template processing error:`, error);
        // Continue with direct message if template fails
        if (!emailRequest.message || !emailRequest.subject) {
          return new Response(
            JSON.stringify({ 
              error: 'Template processing failed',
              message: 'Unable to process template and no fallback message provided'
            }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      }
    }

    // Sanitize final content
    finalSubject = finalSubject.trim().substring(0, 998);
    finalMessage = finalMessage.trim().substring(0, 50000);
    htmlMessage = htmlMessage.trim().substring(0, 100000);

    // Create delivery log entry
    let deliveryLogId: string | null = null;
    try {
      console.log(`📊 [${requestId}] Creating delivery log entry`);
      
      const { data: logEntry, error: logError } = await supabase
        .from('email_delivery_logs')
        .insert({
          email_template_id: templateId,
          recipient_email: emailRequest.to,
          subject: finalSubject,
          status: 'QUEUED',
          trigger_type: emailRequest.trigger_type || 'direct',
          related_entity_id: emailRequest.related_entity_id,
          template_variables: emailRequest.template_variables || {}
        })
        .select('id')
        .single();

      if (logEntry && !logError) {
        deliveryLogId = logEntry.id;
        console.log(`📊 [${requestId}] Delivery log created: ${deliveryLogId}`);
      } else {
        console.warn(`⚠️ [${requestId}] Failed to create delivery log:`, logError);
      }
    } catch (error) {
      console.warn(`⚠️ [${requestId}] Delivery log creation error:`, error);
    }

    // Enhanced SMTP connection and sending
    const client = new SmtpClient();
    let emailSent = false;

    try {
      console.log(`🔌 [${requestId}] Attempting SMTP connection to ${smtpConfig.smtp_host}:${smtpConfig.smtp_port}`);

      // Connect to SMTP server
      const connectConfig = {
        hostname: smtpConfig.smtp_host,
        port: smtpConfig.smtp_port,
        username: smtpConfig.smtp_user,
        password: smtpConfig.smtp_pass_encrypted,
        ...(smtpConfig.use_tls && { tls: true }),
        ...(smtpConfig.use_ssl && { ssl: true }),
      };

      const connectPromise = client.connect(connectConfig);
      await Promise.race([
        connectPromise,
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('SMTP connection timeout')), SMTP_TIMEOUT)
        )
      ]);

      console.log(`✅ [${requestId}] SMTP connection established`);

      // Send email
      const emailData = {
        from: emailRequest.from || smtpConfig.smtp_user,
        to: emailRequest.to,
        subject: finalSubject,
        content: finalMessage,
        ...(htmlMessage && { html: htmlMessage })
      };

      console.log(`📤 [${requestId}] Sending email with ${htmlMessage ? 'HTML' : 'text'} content`);
      
      const sendPromise = client.send(emailData);
      await Promise.race([
        sendPromise,
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Email send timeout')), SMTP_TIMEOUT)
        )
      ]);

      emailSent = true;
      console.log(`✅ [${requestId}] Email sent successfully`);

      // Update delivery log with success
      if (deliveryLogId) {
        try {
          await supabase
            .from('email_delivery_logs')
            .update({
              status: 'SENT',
              sent_at: new Date().toISOString()
            })
            .eq('id', deliveryLogId);
          
          console.log(`📊 [${requestId}] Delivery log updated: SENT`);
        } catch (logError) {
          console.warn(`⚠️ [${requestId}] Failed to update delivery log:`, logError);
        }
      }

    } catch (smtpError) {
      console.error(`❌ [${requestId}] SMTP operation failed:`, smtpError);
      
      // Update delivery log with failure
      if (deliveryLogId) {
        try {
          await supabase
            .from('email_delivery_logs')
            .update({
              status: 'FAILED',
              error_message: smtpError instanceof Error ? smtpError.message : 'Unknown SMTP error'
            })
            .eq('id', deliveryLogId);
          
          console.log(`📊 [${requestId}] Delivery log updated: FAILED`);
        } catch (logError) {
          console.warn(`⚠️ [${requestId}] Failed to update delivery log:`, logError);
        }
      }

      // Determine error type and status code
      const errorMessage = smtpError instanceof Error ? smtpError.message : 'Unknown SMTP error';
      let statusCode = 500;
      let userMessage = 'Failed to send email';

      if (errorMessage.includes('timeout')) {
        statusCode = 408;
        userMessage = 'Email sending timed out. Please try again.';
      } else if (errorMessage.includes('authentication') || errorMessage.includes('login') || errorMessage.includes('535')) {
        statusCode = 401;
        userMessage = 'SMTP authentication failed. Please check your credentials.';
      } else if (errorMessage.includes('connection') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND')) {
        statusCode = 503;
        userMessage = 'Unable to connect to SMTP server. Please check your settings.';
      } else if (errorMessage.includes('SSL') || errorMessage.includes('TLS')) {
        statusCode = 502;
        userMessage = 'SSL/TLS connection failed. Please check your security settings.';
      }

      return new Response(
        JSON.stringify({ 
          error: 'SMTP error',
          message: userMessage,
          details: errorMessage,
          requestId: requestId
        }),
        { 
          status: statusCode, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } finally {
      // Ensure SMTP connection is closed
      try {
        await client.close();
        console.log(`🔌 [${requestId}] SMTP connection closed`);
      } catch (closeError) {
        console.warn(`⚠️ [${requestId}] Error closing SMTP connection:`, closeError);
      }
    }

    // Return success response
    const response = {
      success: true,
      status: 'sent',
      to: emailRequest.to,
      subject: finalSubject,
      message: 'Email sent successfully',
      template_used: templateId !== null,
      template_id: templateId,
      delivery_log_id: deliveryLogId,
      timestamp: new Date().toISOString(),
      requestId: requestId
    };

    console.log(`✅ [${requestId}] Enhanced email service request completed successfully`);

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error(`❌ [${requestId}] Unexpected error:`, {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'An unexpected error occurred while processing your request',
        requestId: requestId
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
