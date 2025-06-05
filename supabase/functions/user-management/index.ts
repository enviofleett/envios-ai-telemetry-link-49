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

// Auto-linking function for new users with enhanced validation
async function autoLinkUserVehicles(supabase: any, userId: string, gp51Username?: string): Promise<number> {
  // Validate GP51 username before processing
  if (!gp51Username || 
      gp51Username.trim() === '' || 
      gp51Username === 'User') {
    console.log(`Invalid GP51 username provided for user ${userId}: "${gp51Username}". Skipping auto-link.`);
    return 0;
  }

  try {
    // Find unassigned vehicles for this GP51 username
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('id, device_id')
      .eq('gp51_username', gp51Username)
      .is('envio_user_id', null)
      .eq('is_active', true);

    if (vehiclesError) {
      console.error('Error fetching vehicles for auto-link:', vehiclesError);
      return 0;
    }

    if (!vehicles || vehicles.length === 0) {
      console.log(`No unassigned vehicles found for GP51 username ${gp51Username}`);
      return 0;
    }

    // Link all matching vehicles to the user
    const { error: linkError } = await supabase
      .from('vehicles')
      .update({ 
        envio_user_id: userId,
        updated_at: new Date().toISOString()
      })
      .eq('gp51_username', gp51Username)
      .is('envio_user_id', null);

    if (linkError) {
      console.error(`Failed to auto-link vehicles for user ${userId}:`, linkError);
      return 0;
    }

    console.log(`Auto-linked ${vehicles.length} vehicles to user ${userId} (GP51: ${gp51Username})`);
    return vehicles.length;

  } catch (error) {
    console.error(`Auto-link failed for user ${userId}:`, error);
    return 0;
  }
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

    // Get pagination parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const search = url.searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    console.log('Request params:', { page, limit, search, offset });

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
          console.error('Error fetching user:', userError);
          return new Response(
            JSON.stringify({ error: 'User not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get assigned vehicles for this user
        const { data: vehicles, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('device_id, device_name')
          .eq('envio_user_id', userId);

        if (vehiclesError) {
          console.error('Error fetching user vehicles:', vehiclesError);
        }

        user.assigned_vehicles = vehicles?.map(v => v.device_id) || [];

        console.log(`User ${userId} has ${user.assigned_vehicles.length} vehicles assigned`);

        return new Response(
          JSON.stringify({ user }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // Optimized query for all users with their vehicle assignments
        let userQuery = supabase
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
          `, { count: 'exact' })
          .order('created_at', { ascending: false });

        // Add search filter if provided (minimum 2 characters)
        if (search.length >= 2) {
          userQuery = userQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone_number.ilike.%${search}%`);
        }

        // Add pagination
        userQuery = userQuery.range(offset, offset + limit - 1);

        const { data: users, error: usersError, count } = await userQuery;

        if (usersError) {
          console.error('Error fetching users:', usersError);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch users' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`Fetched ${users?.length || 0} users out of ${count} total`);

        if (!users || users.length === 0) {
          return new Response(
            JSON.stringify({ 
              users: [],
              pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit)
              }
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get vehicle assignments for all users in a single query
        const userIds = users.map(user => user.id);
        console.log('Fetching vehicles for user IDs:', userIds);

        const { data: vehicleAssignments, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('envio_user_id, device_id, device_name')
          .in('envio_user_id', userIds)
          .not('envio_user_id', 'is', null);

        if (vehiclesError) {
          console.error('Error fetching vehicle assignments:', vehiclesError);
        }

        console.log(`Found ${vehicleAssignments?.length || 0} vehicle assignments`);

        // Create a map of user ID to their assigned vehicles
        const vehiclesByUser = (vehicleAssignments || []).reduce((acc, vehicle) => {
          if (!acc[vehicle.envio_user_id]) {
            acc[vehicle.envio_user_id] = [];
          }
          acc[vehicle.envio_user_id].push(vehicle.device_id);
          return acc;
        }, {} as Record<string, string[]>);

        console.log('Vehicle assignments by user:', vehiclesByUser);

        // Add vehicle assignments to users
        const enhancedUsers = users.map(user => ({
          ...user,
          assigned_vehicles: vehiclesByUser[user.id] || []
        }));

        console.log('Enhanced users with vehicle counts:', enhancedUsers.map(u => ({ 
          id: u.id, 
          name: u.name, 
          vehicleCount: u.assigned_vehicles.length 
        })));

        return new Response(
          JSON.stringify({ 
            users: enhancedUsers,
            pagination: {
              page,
              limit,
              total: count || 0,
              totalPages: Math.ceil((count || 0) / limit)
            }
          }),
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

      const { name, email, phone_number, gp51_username } = JSON.parse(requestBody);

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

      if (gp51_username) {
        userData.gp51_username = gp51_username;
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

      // Auto-link vehicles if GP51 username is provided
      let linkedVehicles = 0;
      if (gp51_username) {
        linkedVehicles = await autoLinkUserVehicles(supabase, newUserId, gp51_username);
      }

      console.log(`Created user ${newUserId} and auto-linked ${linkedVehicles} vehicles`);

      return new Response(
        JSON.stringify({ 
          user,
          autoLinkedVehicles: linkedVehicles
        }),
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

        if (!(await isUserAdmin(supabase, currentUserId))) {
          return new Response(
            JSON.stringify({ error: 'Admin access required' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

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
