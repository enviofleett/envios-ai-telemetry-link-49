
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { handleCorsPreflightRequest, createResponse } from './cors.ts';
import { EmailRequest } from './request-validator.ts';
import { EmailServiceOrchestrator } from './email-service-orchestrator.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  try {
    // Environment validation - Use Service Role Key for database access
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('❌ Missing Supabase environment variables');
      return createResponse({
        success: false,
        error: 'Server configuration error'
      }, 500);
    }

    // Parse request
    const requestData: EmailRequest = await req.json();

    // Initialize and process email request
    const emailService = new EmailServiceOrchestrator(supabaseUrl, supabaseServiceRoleKey);
    return await emailService.processEmailRequest(requestData);

  } catch (error) {
    console.error('❌ SMTP Email Service error:', error);
    return createResponse({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});
