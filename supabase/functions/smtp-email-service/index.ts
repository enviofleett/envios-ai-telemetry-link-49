
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { SmtpClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

serve(async (req) => {
  console.log(`📧 SMTP Email Service Request: ${req.method} ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Initialize Supabase client for auth validation
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract and validate JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid Authorization header');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Validate the JWT token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('❌ JWT validation failed:', authError?.message || 'No user found');
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ User authenticated:', user.id);

    // Parse request body
    let emailRequest: EmailRequest;
    try {
      const body = await req.text();
      emailRequest = JSON.parse(body);
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate required fields
    if (!emailRequest.to || !emailRequest.subject || !emailRequest.message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailRequest.to)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's SMTP configuration
    const { data: smtpConfig, error: configError } = await supabase
      .from('smtp_configurations')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('is_default', true)
      .single();

    if (configError || !smtpConfig) {
      console.error('❌ No SMTP configuration found:', configError?.message);
      return new Response(
        JSON.stringify({ error: 'No active SMTP configuration found. Please configure SMTP settings first.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📧 Using SMTP config:', {
      host: smtpConfig.smtp_host,
      port: smtpConfig.smtp_port,
      user: smtpConfig.smtp_user
    });

    // Process email template if provided
    let finalMessage = emailRequest.message;
    let finalSubject = emailRequest.subject;

    if (emailRequest.template_id) {
      const { data: template, error: templateError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', emailRequest.template_id)
        .eq('user_id', user.id)
        .single();

      if (template && !templateError) {
        finalMessage = template.body_text;
        finalSubject = template.subject;

        // Replace template variables
        if (emailRequest.template_variables) {
          for (const [key, value] of Object.entries(emailRequest.template_variables)) {
            const placeholder = `{{${key}}}`;
            finalMessage = finalMessage.replace(new RegExp(placeholder, 'g'), value);
            finalSubject = finalSubject.replace(new RegExp(placeholder, 'g'), value);
          }
        }
      }
    }

    // Initialize SMTP client
    const client = new SmtpClient();

    try {
      // Connect to SMTP server
      await client.connect({
        hostname: smtpConfig.smtp_host,
        port: smtpConfig.smtp_port,
        username: smtpConfig.smtp_user,
        password: smtpConfig.smtp_pass_encrypted, // Note: In production, this should be properly decrypted
        ...(smtpConfig.use_tls && { tls: true }),
        ...(smtpConfig.use_ssl && { ssl: true }),
      });

      console.log('✅ SMTP connection established');

      // Send email
      await client.send({
        from: emailRequest.from || smtpConfig.smtp_user,
        to: emailRequest.to,
        subject: finalSubject,
        content: finalMessage,
      });

      console.log('✅ Email sent successfully');

      // Log to email queue for tracking
      await supabase
        .from('email_notification_queue')
        .insert({
          user_id: user.id,
          recipient_email: emailRequest.to,
          sender_email: emailRequest.from || smtpConfig.smtp_user,
          subject: finalSubject,
          body_text: finalMessage,
          template_id: emailRequest.template_id || null,
          template_variables: emailRequest.template_variables || {},
          status: 'sent',
          sent_at: new Date().toISOString(),
        });

      // Close SMTP connection
      await client.close();

      return new Response(
        JSON.stringify({
          status: 'sent',
          to: emailRequest.to,
          subject: finalSubject
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (smtpError) {
      console.error('❌ SMTP Error:', smtpError);
      
      // Log failed email attempt
      await supabase
        .from('email_notification_queue')
        .insert({
          user_id: user.id,
          recipient_email: emailRequest.to,
          sender_email: emailRequest.from || smtpConfig.smtp_user,
          subject: finalSubject,
          body_text: finalMessage,
          template_id: emailRequest.template_id || null,
          template_variables: emailRequest.template_variables || {},
          status: 'failed',
          error_message: smtpError.message,
        });

      // Close connection if it was opened
      try {
        await client.close();
      } catch (closeError) {
        console.error('Error closing SMTP connection:', closeError);
      }

      return new Response(
        JSON.stringify({ error: `SMTP Error: ${smtpError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('❌ Email service error:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
