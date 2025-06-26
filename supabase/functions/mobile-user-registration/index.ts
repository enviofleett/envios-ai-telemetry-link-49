
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { ProductionGP51Service } from '../_shared/ProductionGP51Service.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

    const { 
      username, 
      password, 
      email, 
      companyName, 
      contactName, 
      phone,
      adminUsername = 'octopus'
    } = await req.json();

    // Validate required fields
    if (!username || !password || !email) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Username, password, and email are required' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize GP51 service
    const gp51Service = new ProductionGP51Service();
    
    // Authenticate as admin (octopus) to create user
    console.log('🔐 Authenticating as admin for user creation...');
    const adminAuth = await gp51Service.authenticate(
      adminUsername, 
      Deno.env.get('GP51_ADMIN_PASSWORD') ?? ''
    );

    if (adminAuth.status !== 0) {
      console.error('❌ Admin authentication failed:', adminAuth.cause);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Admin authentication failed' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Register user in GP51
    console.log('📝 Registering user in GP51...');
    const userRegistration = await gp51Service.registerUser({
      username,
      password,
      email,
      companyname: companyName,
      cardname: contactName,
      phone
    });

    if (userRegistration.status !== 0) {
      console.error('❌ GP51 user registration failed:', userRegistration.cause);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: userRegistration.cause || 'User registration failed' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store user in local Envio database
    console.log('💾 Storing user in local database...');
    const { data: envioUser, error: envioError } = await supabase
      .from('envio_users')
      .insert({
        name: contactName || username,
        email,
        phone_number: phone,
        gp51_username: username,
        registration_status: 'active',
        registration_type: 'mobile',
        import_source: 'flutter_app',
        is_gp51_imported: true,
        gp51_user_type: 11 // End user
      })
      .select()
      .single();

    if (envioError) {
      console.error('❌ Local user storage failed:', envioError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to store user locally' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ User registration completed successfully');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: envioUser.id,
          username,
          email,
          gp51_registered: true,
          local_registered: true
        }
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Mobile user registration error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
