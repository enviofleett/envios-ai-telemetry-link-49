
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { SmtpClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

// Enhanced CORS headers with all required methods
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400', // 24 hours
};

interface EmailRequest {
  to: string;
  subject: string;
  message: string;
  from?: string;
  template_id?: string;
  template_variables?: Record<string, string>;
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
  subject: string;
  body_text: string;
  variables: string[];
}

// Request size limit (1MB)
const MAX_REQUEST_SIZE = 1024 * 1024;

// Timeout for SMTP operations (30 seconds)
const SMTP_TIMEOUT = 30000;

serve(async (req) => {
  const requestId = crypto.randomUUID();
  console.log(`📧 [${requestId}] SMTP Email Service Request: ${req.method} ${req.url}`);
  
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
      console.log(`📝 [${requestId}] Request parsed successfully`);
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
    if (!emailRequest.to || !emailRequest.subject || !emailRequest.message) {
      console.error(`❌ [${requestId}] Missing required fields`);
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          message: 'Fields "to", "subject", and "message" are required'
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

    // Sanitize input data
    const sanitizedRequest = {
      ...emailRequest,
      to: emailRequest.to.trim().toLowerCase(),
      subject: emailRequest.subject.trim().substring(0, 998), // Limit subject length
      message: emailRequest.message.trim().substring(0, 50000), // Limit message length
    };

    // Get user's SMTP configuration
    let smtpConfig: SMTPConfig;
    try {
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
      console.log(`📧 [${requestId}] Using SMTP config:`, {
        host: smtpConfig.smtp_host,
        port: smtpConfig.smtp_port,
        user: smtpConfig.smtp_user
      });
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

    // Process email template if provided
    let finalMessage = sanitizedRequest.message;
    let finalSubject = sanitizedRequest.subject;

    if (sanitizedRequest.template_id) {
      try {
        const { data: template, error: templateError } = await supabase
          .from('email_templates')
          .select('*')
          .eq('id', sanitizedRequest.template_id)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        if (template && !templateError) {
          finalMessage = template.body_text;
          finalSubject = template.subject;

          // Replace template variables with validation
          if (sanitizedRequest.template_variables) {
            for (const [key, value] of Object.entries(sanitizedRequest.template_variables)) {
              // Validate variable names (alphanumeric and underscore only)
              if (!/^[a-zA-Z0-9_]+$/.test(key)) {
                console.warn(`⚠️ [${requestId}] Invalid variable name: ${key}`);
                continue;
              }
              
              const placeholder = `{{${key}}}`;
              const sanitizedValue = String(value).substring(0, 1000); // Limit variable length
              finalMessage = finalMessage.replace(new RegExp(placeholder, 'g'), sanitizedValue);
              finalSubject = finalSubject.replace(new RegExp(placeholder, 'g'), sanitizedValue);
            }
          }
          
          console.log(`📄 [${requestId}] Template processed successfully`);
        } else {
          console.warn(`⚠️ [${requestId}] Template not found or inactive: ${sanitizedRequest.template_id}`);
        }
      } catch (error) {
        console.error(`❌ [${requestId}] Template processing error:`, error);
        // Continue with original message if template fails
      }
    }

    // Initialize SMTP client with timeout
    const client = new SmtpClient();
    let emailSent = false;

    try {
      // Connect to SMTP server with timeout
      console.log(`🔌 [${requestId}] Connecting to SMTP server...`);
      
      const connectPromise = client.connect({
        hostname: smtpConfig.smtp_host,
        port: smtpConfig.smtp_port,
        username: smtpConfig.smtp_user,
        password: smtpConfig.smtp_pass_encrypted,
        ...(smtpConfig.use_tls && { tls: true }),
        ...(smtpConfig.use_ssl && { ssl: true }),
      });

      await Promise.race([
        connectPromise,
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('SMTP connection timeout')), SMTP_TIMEOUT)
        )
      ]);

      console.log(`✅ [${requestId}] SMTP connection established`);

      // Send email with timeout
      console.log(`📤 [${requestId}] Sending email...`);
      
      const sendPromise = client.send({
        from: sanitizedRequest.from || smtpConfig.smtp_user,
        to: sanitizedRequest.to,
        subject: finalSubject,
        content: finalMessage,
      });

      await Promise.race([
        sendPromise,
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Email send timeout')), SMTP_TIMEOUT)
        )
      ]);

      emailSent = true;
      console.log(`✅ [${requestId}] Email sent successfully`);

      // Log to email queue for tracking
      try {
        await supabase
          .from('email_notification_queue')
          .insert({
            user_id: user.id,
            recipient_email: sanitizedRequest.to,
            sender_email: sanitizedRequest.from || smtpConfig.smtp_user,
            subject: finalSubject,
            body_text: finalMessage,
            template_id: sanitizedRequest.template_id || null,
            template_variables: sanitizedRequest.template_variables || {},
            status: 'sent',
            sent_at: new Date().toISOString(),
          });
        
        console.log(`📊 [${requestId}] Email logged to queue`);
      } catch (logError) {
        console.error(`⚠️ [${requestId}] Failed to log email to queue:`, logError);
        // Don't fail the request if logging fails
      }

    } catch (smtpError) {
      console.error(`❌ [${requestId}] SMTP Error:`, smtpError);
      
      // Log failed email attempt
      try {
        await supabase
          .from('email_notification_queue')
          .insert({
            user_id: user.id,
            recipient_email: sanitizedRequest.to,
            sender_email: sanitizedRequest.from || smtpConfig.smtp_user,
            subject: finalSubject,
            body_text: finalMessage,
            template_id: sanitizedRequest.template_id || null,
            template_variables: sanitizedRequest.template_variables || {},
            status: 'failed',
            error_message: smtpError instanceof Error ? smtpError.message : 'Unknown SMTP error',
          });
      } catch (logError) {
        console.error(`⚠️ [${requestId}] Failed to log error to queue:`, logError);
      }

      // Determine error type and status code
      const errorMessage = smtpError instanceof Error ? smtpError.message : 'Unknown SMTP error';
      let statusCode = 500;
      let userMessage = 'Failed to send email';

      if (errorMessage.includes('timeout')) {
        statusCode = 408;
        userMessage = 'Email sending timed out. Please try again.';
      } else if (errorMessage.includes('authentication') || errorMessage.includes('login')) {
        statusCode = 401;
        userMessage = 'SMTP authentication failed. Please check your credentials.';
      } else if (errorMessage.includes('connection')) {
        statusCode = 503;
        userMessage = 'Unable to connect to SMTP server. Please check your settings.';
      }

      return new Response(
        JSON.stringify({ 
          error: 'SMTP error',
          message: userMessage,
          details: errorMessage
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
        console.error(`⚠️ [${requestId}] Error closing SMTP connection:`, closeError);
      }
    }

    // Return success response
    const response = {
      success: true,
      status: 'sent',
      to: sanitizedRequest.to,
      subject: finalSubject,
      message: 'Email sent successfully',
      timestamp: new Date().toISOString(),
      requestId: requestId
    };

    console.log(`✅ [${requestId}] Request completed successfully`);

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error(`❌ [${requestId}] Unexpected error:`, error);
    
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
