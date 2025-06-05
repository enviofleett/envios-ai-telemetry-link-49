
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to check if user has admin role
async function isUserAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data } = await supabase
    .rpc('has_role', { _user_id: userId, _role: 'admin' });
  return data === true;
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

    const url = new URL(req.url);
    const method = req.method;
    const pathSegments = url.pathname.split('/').filter(Boolean);

    // Get current user from auth header
    const authHeader = req.headers.get('authorization');
    let currentUserId = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      currentUserId = user?.id;
    }

    if (method === 'GET') {
      // Handle role-specific endpoints
      if (pathSegments.includes('roles')) {
        if (!currentUserId) {
          return new Response(
            JSON.stringify({ error: 'Authentication required' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const userId = pathSegments[pathSegments.length - 1];
        
        if (userId === 'current') {
          // Get current user's role using auth user ID
          const { data: userRole, error } = await supabase
            .rpc('get_user_role', { _user_id: currentUserId });

          if (error) {
            console.error('Error fetching user role:', error);
            return new Response(
              JSON.stringify({ error: 'Failed to fetch user role' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ role: userRole || 'user' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Get all users or specific user
      const userId = pathSegments[pathSegments.length - 1];
      
      if (userId && userId !== 'user-management') {
        // Get specific user with enhanced details
        const { data: user, error: userError } = await supabase
          .from('envio_users')
          .select(`
            *,
            gp51_sessions (
              id,
              username,
              created_at,
              token_expires_at
            ),
            user_roles!user_roles_user_id_fkey (
              role
            )
          `)
          .eq('id', userId)
          .single();

        if (userError) {
          return new Response(
            JSON.stringify({ error: 'User not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get assigned vehicles count
        const { data: vehicleCount } = await supabase
          .from('vehicles')
          .select('device_id')
          .eq('envio_user_id', userId);

        user.assigned_vehicles = vehicleCount?.map(v => v.device_id) || [];

        return new Response(
          JSON.stringify({ user }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // Get all users with enhanced details
        const { data: users, error } = await supabase
          .from('envio_users')
          .select(`
            *,
            gp51_sessions (
              id,
              username,
              created_at,
              token_expires_at
            ),
            user_roles!user_roles_user_id_fkey (
              role
            )
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching users:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch users' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Enhance users with vehicle assignment counts
        const enhancedUsers = await Promise.all(
          users.map(async (user) => {
            const { data: vehicleCount } = await supabase
              .from('vehicles')
              .select('device_id')
              .eq('envio_user_id', user.id);

            return {
              ...user,
              assigned_vehicles: vehicleCount?.map(v => v.device_id) || []
            };
          })
        );

        return new Response(
          JSON.stringify({ users: enhancedUsers }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (method === 'POST') {
      const requestBody = await req.text();
      
      if (!requestBody) {
        return new Response(
          JSON.stringify({ error: 'Request body is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { name, email, phone_number } = JSON.parse(requestBody);

      if (!name || !email) {
        return new Response(
          JSON.stringify({ error: 'Name and email are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if current user is admin
      if (!currentUserId || !(await isUserAdmin(supabase, currentUserId))) {
        return new Response(
          JSON.stringify({ error: 'Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('envio_users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        return new Response(
          JSON.stringify({ error: 'Email already exists' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // For new user creation, generate a new UUID
      const newUserId = crypto.randomUUID();
      
      const userData: any = { 
        id: newUserId,
        name, 
        email,
        registration_type: 'admin',
        registration_status: 'completed'
      };

      if (phone_number) {
        userData.phone_number = phone_number;
      }

      const { data: user, error } = await supabase
        .from('envio_users')
        .insert(userData)
        .select()
        .single();

      if (error) {
        console.error('Error creating user:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create default user role
      await supabase
        .from('user_roles')
        .insert({
          user_id: newUserId,
          role: 'user'
        });

      return new Response(
        JSON.stringify({ user }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (method === 'PUT') {
      const userId = pathSegments[pathSegments.length - 1];
      const requestBody = await req.text();
      
      if (!requestBody) {
        return new Response(
          JSON.stringify({ error: 'Request body is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const bodyData = JSON.parse(requestBody);

      // Handle role updates
      if (pathSegments.includes('role')) {
        const { role } = bodyData;

        if (!currentUserId) {
          return new Response(
            JSON.stringify({ error: 'Authentication required' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if current user is admin
        if (!(await isUserAdmin(supabase, currentUserId))) {
          return new Response(
            JSON.stringify({ error: 'Admin access required' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Update user role - userId should be the envio user ID for role operations
        const { error } = await supabase
          .from('user_roles')
          .upsert({ 
            user_id: userId,
            role: role,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (error) {
          console.error('Error updating user role:', error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ message: 'User role updated successfully' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Handle regular user updates
      const updateData: any = {};
      if (bodyData.name) updateData.name = bodyData.name;
      if (bodyData.email) updateData.email = bodyData.email;
      if (bodyData.phone_number !== undefined) updateData.phone_number = bodyData.phone_number;
      if (bodyData.gp51_username !== undefined) updateData.gp51_username = bodyData.gp51_username;
      if (bodyData.gp51_user_type !== undefined) updateData.gp51_user_type = bodyData.gp51_user_type;

      // Check if current user is admin for updating other users
      if (currentUserId !== userId && !(await isUserAdmin(supabase, currentUserId))) {
        return new Response(
          JSON.stringify({ error: 'Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      updateData.updated_at = new Date().toISOString();

      const { data: user, error } = await supabase
        .from('envio_users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ user }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (method === 'DELETE') {
      const userId = pathSegments[pathSegments.length - 1];

      // Check if current user is admin
      if (!currentUserId || !(await isUserAdmin(supabase, currentUserId))) {
        return new Response(
          JSON.stringify({ error: 'Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Prevent self-deletion
      if (currentUserId === userId) {
        return new Response(
          JSON.stringify({ error: 'Cannot delete your own account' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Unassign vehicles before deleting user
      await supabase
        .from('vehicles')
        .update({ envio_user_id: null })
        .eq('envio_user_id', userId);

      const { error } = await supabase
        .from('envio_users')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Error deleting user:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ message: 'User deleted successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('User management error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
