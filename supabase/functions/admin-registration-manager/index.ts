
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

    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authorization' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if user is admin (basic check - you might want to enhance this)
    const { data: envioUser } = await supabase
      .from('envio_users')
      .select('id, user_type')
      .eq('email', user.email)
      .single();

    if (!envioUser || envioUser.user_type !== 'admin') {
      return new Response(
        JSON.stringify({ success: false, error: 'Admin access required' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (req.method === 'GET') {
      // Fetch pending registrations
      const { data: registrations, error } = await supabase
        .from('pending_user_registrations')
        .select(`
          *,
          packages (id, name, description, price)
        `)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Error fetching registrations:', error);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to fetch registrations' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, registrations }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (req.method === 'POST') {
      // Process registration (approve/reject)
      const body = await req.json();
      const { registration_id, action, admin_notes } = body;

      if (!registration_id || !action || !['approve', 'reject'].includes(action)) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid request parameters' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Update registration status
      const { data: updatedRegistration, error: updateError } = await supabase
        .from('pending_user_registrations')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: envioUser.id,
          admin_notes
        })
        .eq('id', registration_id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating registration:', updateError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to process registration' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // If approved, create the user account
      if (action === 'approve') {
        // Here you would typically create the user account in auth.users
        // and insert into envio_users table
        console.log('Registration approved - would create user account for:', updatedRegistration.email);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Registration ${action}d successfully` 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Admin registration manager error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
