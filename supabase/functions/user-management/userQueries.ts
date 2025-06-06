
export async function getUserWithDetails(supabase: any, userId: string) {
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
    throw new Error('User not found');
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

  return user;
}

export async function getUsersWithPagination(supabase: any, page: number, limit: number, search: string) {
  const offset = (page - 1) * limit;

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
    throw new Error('Failed to fetch users');
  }

  console.log(`Fetched ${users?.length || 0} users out of ${count} total`);

  if (!users || users.length === 0) {
    return {
      users: [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };
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

  return {
    users: enhancedUsers,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  };
}

export async function getSystemImportJobs(supabase: any, page: number = 1, limit: number = 10) {
  const offset = (page - 1) * limit;

  const { data: jobs, error, count } = await supabase
    .from('gp51_system_imports')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching system import jobs:', error);
    throw new Error('Failed to fetch system import jobs');
  }

  return {
    jobs: jobs || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  };
}

export async function createSystemImportJob(supabase: any, jobData: any, currentUserId: string) {
  if (!currentUserId) {
    throw new Error('Authentication required');
  }

  const { data: job, error } = await supabase
    .from('gp51_system_imports')
    .insert({
      ...jobData,
      created_by: currentUserId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating system import job:', error);
    throw new Error(error.message);
  }

  return job;
}
