
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RegistrationRequest {
  name: string;
  email: string;
  phone_number?: string;
  company_name?: string;
  selected_package_id: string;
  additional_data?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestBody: RegistrationRequest = await req.json();
    const { name, email, phone_number, company_name, selected_package_id, additional_data } = requestBody;

    // Validate required fields
    if (!name || !email || !selected_package_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, email, selected_package_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify package exists
    const { data: packageData, error: packageError } = await supabase
      .from('packages')
      .select('*')
      .eq('id', selected_package_id)
      .eq('is_active', true)
      .single();

    if (packageError || !packageData) {
      return new Response(
        JSON.stringify({ error: 'Invalid package selected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if email already exists
    const { data: existingUser, error: userCheckError } = await supabase
      .from('envio_users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'User with this email already exists' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if registration already pending
    const { data: pendingRegistration, error: pendingCheckError } = await supabase
      .from('pending_user_registrations')
      .select('id')
      .eq('email', email)
      .eq('status', 'pending')
      .single();

    if (pendingRegistration) {
      return new Response(
        JSON.stringify({ error: 'Registration already pending for this email' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create pending registration
    const registrationData = {
      email,
      name,
      phone_number,
      company_name,
      selected_package_id,
      registration_data: additional_data || {},
      status: 'pending'
    };

    const { data: newRegistration, error: registrationError } = await supabase
      .from('pending_user_registrations')
      .insert(registrationData)
      .select()
      .single();

    if (registrationError) {
      console.error('Registration creation error:', registrationError);
      return new Response(
        JSON.stringify({ error: 'Failed to create registration request' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // TODO: Send notification email to admins about new registration

    return new Response(
      JSON.stringify({ 
        success: true, 
        registration_id: newRegistration.id,
        message: 'Registration request submitted successfully. You will be notified once approved.' 
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Registration API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
