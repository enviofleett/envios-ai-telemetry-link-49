
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
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body: RegistrationRequest = await req.json();
    const { name, email, phone_number, company_name, selected_package_id, additional_data } = body;

    // Validate required fields
    if (!name || !email || !selected_package_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: name, email, and selected_package_id are required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify the package exists
    const { data: packageData, error: packageError } = await supabase
      .from('packages')
      .select('id, name')
      .eq('id', selected_package_id)
      .eq('is_active', true)
      .single();

    if (packageError || !packageData) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid package selected' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Insert pending registration
    const { data: registration, error: registrationError } = await supabase
      .from('pending_user_registrations')
      .insert({
        email,
        name,
        phone_number,
        company_name,
        selected_package_id,
        registration_data: additional_data || {},
        status: 'pending'
      })
      .select()
      .single();

    if (registrationError) {
      console.error('Registration error:', registrationError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to submit registration' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Registration submitted successfully:', registration.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        registration_id: registration.id,
        message: 'Registration submitted successfully and is pending admin review'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Register user error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
