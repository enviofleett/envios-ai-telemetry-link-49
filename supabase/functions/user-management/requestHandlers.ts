
import { corsHeaders } from './cors.ts';

export async function handleGetRequest(supabase: any, url: URL, currentUserId: string) {
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const search = url.searchParams.get('search') || '';
  
  console.log(`Getting users - page: ${page}, limit: ${limit}, search: ${search}`);
  
  try {
    // Build the base query
    let query = supabase
      .from('envio_users')
      .select(`
        id,
        name,
        email,
        phone_number,
        created_at,
        gp51_username,
        gp51_user_type,
        registration_status,
        user_roles!inner(role),
        gp51_sessions(
          id,
          username,
          token_expires_at
        )
      `)
      .order('created_at', { ascending: false });

    // Add search filter if provided
    if (search && search.length >= 2) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,gp51_username.ilike.%${search}%`);
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('envio_users')
      .select('*', { count: 'exact', head: true });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: users, error } = await query;

    if (error) {
      console.error('Database error:', error);
      throw new Error(`Database query failed: ${error.message}`);
    }

    console.log(`Retrieved ${users?.length || 0} users from database`);

    // Transform the data to match the expected frontend format
    const transformedUsers = (users || []).map((user: any) => ({
      id: user.id,
      name: user.name || 'Unknown',
      email: user.email || '',
      phone_number: user.phone_number || '',
      created_at: user.created_at,
      gp51_username: user.gp51_username || '',
      gp51_user_type: user.gp51_user_type || 3,
      registration_status: user.registration_status || 'pending',
      assigned_vehicles: [], // Will be populated later if needed
      user_roles: user.user_roles ? [{ role: user.user_roles.role }] : [{ role: 'user' }],
      gp51_sessions: user.gp51_sessions || []
    }));

    const totalPages = Math.ceil((count || 0) / limit);

    return {
      users: transformedUsers,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    };
  } catch (error: any) {
    console.error('Error in handleGetRequest:', error);
    throw new Error(`Failed to fetch users: ${error.message}`);
  }
}

export async function handlePostRequest(supabase: any, req: Request, currentUserId: string) {
  const body = await req.json();
  const { name, email, phone_number, gp51_user_type, role } = body;

  console.log('Creating new user:', { name, email, phone_number, gp51_user_type, role });

  try {
    // Create user in envio_users
    const { data: newUser, error: userError } = await supabase
      .from('envio_users')
      .insert({
        name,
        email,
        phone_number,
        gp51_user_type: gp51_user_type || 3,
        registration_status: 'approved',
        registration_type: 'admin_created'
      })
      .select()
      .single();

    if (userError) throw userError;

    // Create user role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: newUser.id,
        role: role || 'user'
      });

    if (roleError) throw roleError;

    return new Response(
      JSON.stringify({ success: true, user: newUser }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error creating user:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

export async function handlePutRequest(supabase: any, req: Request, url: URL, currentUserId: string) {
  const pathParts = url.pathname.split('/');
  const userId = pathParts[pathParts.length - 1];
  const body = await req.json();

  console.log('Updating user:', userId, body);

  try {
    const { data: updatedUser, error } = await supabase
      .from('envio_users')
      .update(body)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, user: updatedUser }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error updating user:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

export async function handleDeleteRequest(supabase: any, url: URL, currentUserId: string) {
  const pathParts = url.pathname.split('/');
  const userId = pathParts[pathParts.length - 1];

  console.log('Deleting user:', userId);

  try {
    // Delete user roles first
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    // Delete user
    const { error } = await supabase
      .from('envio_users')
      .delete()
      .eq('id', userId);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
