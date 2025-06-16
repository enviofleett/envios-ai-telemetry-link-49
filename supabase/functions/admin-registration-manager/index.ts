
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApprovalRequest {
  registration_id: string;
  action: 'approve' | 'reject';
  admin_notes?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify admin access
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !userRole) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'GET') {
      // Get pending registrations
      const { data: pendingRegistrations, error } = await supabase
        .from('pending_user_registrations')
        .select(`
          *,
          packages (
            name,
            description,
            associated_user_type,
            price
          )
        `)
        .eq('status', 'pending')
        .order('submitted_at', { ascending: false });

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch pending registrations' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ registrations: pendingRegistrations }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      const requestBody: ApprovalRequest = await req.json();
      const { registration_id, action, admin_notes } = requestBody;

      if (!registration_id || !action) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get the registration
      const { data: registration, error: fetchError } = await supabase
        .from('pending_user_registrations')
        .select(`
          *,
          packages (
            associated_user_type
          )
        `)
        .eq('id', registration_id)
        .eq('status', 'pending')
        .single();

      if (fetchError || !registration) {
        return new Response(
          JSON.stringify({ error: 'Registration not found or already processed' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'approve') {
        // Create the user in envio_users
        const { data: newUser, error: userError } = await supabase
          .from('envio_users')
          .insert({
            name: registration.name,
            email: registration.email,
            phone_number: registration.phone_number,
            user_type: registration.packages.associated_user_type,
            package_id: registration.selected_package_id,
            registration_status: 'completed',
            registration_type: 'package_selection',
            approved_at: new Date().toISOString(),
            approved_by: user.id
          })
          .select()
          .single();

        if (userError) {
          console.error('User creation error:', userError);
          return new Response(
            JSON.stringify({ error: 'Failed to create user account' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Create user role based on package
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: newUser.id,
            role: registration.packages.associated_user_type === 'sub_admin' ? 'fleet_manager' : 'user'
          });

        if (roleError) {
          console.error('Role creation error:', roleError);
        }
      }

      // Update registration status
      const { error: updateError } = await supabase
        .from('pending_user_registrations')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          admin_notes
        })
        .eq('id', registration_id);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: 'Failed to update registration status' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Registration ${action}d successfully` 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Admin registration manager error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
