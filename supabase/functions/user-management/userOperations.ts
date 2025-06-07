
import { autoLinkUserVehicles } from './autoLinking.ts';
import { isUserAdmin } from './auth.ts';

async function createUserInGP51(userData: any): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Call GP51 user management API to create user
    const { data, error } = await supabase.functions.invoke('gp51-user-management', {
      body: {
        action: 'adduser',
        username: userData.gp51_username || userData.email,
        password: userData.password || 'TempPass123!', // Temporary password if not provided
        showname: userData.name,
        email: userData.email,
        usertype: userData.gp51_user_type || 3, // Default to End User
        multilogin: 1,
        creater: 'admin'
      }
    });

    if (error) {
      console.error('GP51 user creation failed:', error);
      return { success: false, error: error.message };
    }

    if (data && data.status === 0) {
      console.log('User created successfully in GP51:', userData.gp51_username || userData.email);
      return { success: true };
    } else {
      console.error('GP51 user creation returned error status:', data);
      return { success: false, error: data?.cause || 'Unknown GP51 error' };
    }
  } catch (error) {
    console.error('Exception during GP51 user creation:', error);
    return { success: false, error: error.message };
  }
}

async function deleteUserFromGP51(gp51Username: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Call GP51 user management API to delete user
    const { data, error } = await supabase.functions.invoke('gp51-user-management', {
      body: {
        action: 'deleteuser',
        usernames: gp51Username
      }
    });

    if (error) {
      console.error('GP51 user deletion failed:', error);
      return { success: false, error: error.message };
    }

    if (data && data.status === 0) {
      console.log('User deleted successfully from GP51:', gp51Username);
      return { success: true };
    } else {
      console.error('GP51 user deletion returned error status:', data);
      return { success: false, error: data?.cause || 'Unknown GP51 error' };
    }
  } catch (error) {
    console.error('Exception during GP51 user deletion:', error);
    return { success: false, error: error.message };
  }
}

export async function createUser(supabase: any, userData: any, currentUserId: string) {
  const { name, email, phone_number, gp51_username, password } = userData;

  if (!name || !email) {
    throw new Error('Name and email are required');
  }

  // Check if current user is admin
  if (!currentUserId || !(await isUserAdmin(supabase, currentUserId))) {
    throw new Error('Admin access required');
  }

  // Check if email already exists
  const { data: existingUser } = await supabase
    .from('envio_users')
    .select('id')
    .eq('email', email)
    .single();

  if (existingUser) {
    throw new Error('Email already exists');
  }

  // For new user creation, generate a new UUID
  const newUserId = crypto.randomUUID();
  
  const userCreateData: any = { 
    id: newUserId,
    name, 
    email,
    registration_type: 'admin',
    registration_status: 'completed'
  };

  if (phone_number) {
    userCreateData.phone_number = phone_number;
  }

  if (gp51_username) {
    userCreateData.gp51_username = gp51_username;
  }

  // Step 1: Create user in GP51 first if GP51 username is provided
  if (gp51_username) {
    console.log(`Creating user in GP51 first: ${gp51_username}`);
    const gp51Result = await createUserInGP51({
      ...userData,
      gp51_username,
      password: password || 'TempPass123!' // Use provided password or temporary one
    });

    if (!gp51Result.success) {
      console.error('Failed to create user in GP51:', gp51Result.error);
      throw new Error(`GP51 user creation failed: ${gp51Result.error}`);
    }

    console.log('User created successfully in GP51, proceeding with local creation');
  }

  // Step 2: Create user locally
  const { data: user, error } = await supabase
    .from('envio_users')
    .insert(userCreateData)
    .select()
    .single();

  if (error) {
    console.error('Error creating user locally:', error);
    
    // Rollback: If local creation fails, try to delete from GP51
    if (gp51_username) {
      console.log('Rolling back GP51 user creation due to local creation failure');
      await deleteUserFromGP51(gp51_username);
    }
    
    throw new Error(error.message);
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

  return {
    user,
    autoLinkedVehicles: linkedVehicles,
    gp51Created: !!gp51_username
  };
}

export async function updateUser(supabase: any, userId: string, updateData: any, currentUserId: string) {
  const userData: any = {};
  if (updateData.name) userData.name = updateData.name;
  if (updateData.email) userData.email = updateData.email;
  if (updateData.phone_number !== undefined) userData.phone_number = updateData.phone_number;
  if (updateData.gp51_username !== undefined) userData.gp51_username = updateData.gp51_username;
  if (updateData.gp51_user_type !== undefined) userData.gp51_user_type = updateData.gp51_user_type;

  if (currentUserId !== userId && !(await isUserAdmin(supabase, currentUserId))) {
    throw new Error('Admin access required');
  }

  // Get current user data to check for GP51 username
  const { data: currentUser } = await supabase
    .from('envio_users')
    .select('gp51_username')
    .eq('id', userId)
    .single();

  // If user has GP51 username, update in GP51 first
  if (currentUser?.gp51_username && (updateData.name || updateData.email)) {
    console.log(`Updating user in GP51: ${currentUser.gp51_username}`);
    
    try {
      const { data, error } = await supabase.functions.invoke('gp51-user-management', {
        body: {
          action: 'edituser',
          username: currentUser.gp51_username,
          showname: updateData.name || currentUser.name,
          email: updateData.email || currentUser.email
        }
      });

      if (error || (data && data.status !== 0)) {
        console.error('GP51 user update failed:', error || data);
        throw new Error(`GP51 user update failed: ${error?.message || data?.cause || 'Unknown error'}`);
      }

      console.log('User updated successfully in GP51');
    } catch (error) {
      console.error('Exception during GP51 user update:', error);
      throw new Error(`GP51 user update failed: ${error.message}`);
    }
  }

  userData.updated_at = new Date().toISOString();

  const { data: user, error } = await supabase
    .from('envio_users')
    .update(userData)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user:', error);
    throw new Error(error.message);
  }

  return user;
}

export async function deleteUser(supabase: any, userId: string, currentUserId: string) {
  // Check if current user is admin
  if (!currentUserId || !(await isUserAdmin(supabase, currentUserId))) {
    throw new Error('Admin access required');
  }

  // Prevent self-deletion
  if (currentUserId === userId) {
    throw new Error('Cannot delete your own account');
  }

  // Get user data to check for GP51 username
  const { data: user } = await supabase
    .from('envio_users')
    .select('gp51_username')
    .eq('id', userId)
    .single();

  // Step 1: Delete/deactivate user from GP51 first if they have a GP51 username
  if (user?.gp51_username) {
    console.log(`Deleting user from GP51: ${user.gp51_username}`);
    const gp51Result = await deleteUserFromGP51(user.gp51_username);

    if (!gp51Result.success) {
      console.error('Failed to delete user from GP51:', gp51Result.error);
      throw new Error(`GP51 user deletion failed: ${gp51Result.error}`);
    }

    console.log('User deleted successfully from GP51, proceeding with local deletion');
  }

  // Step 2: Unassign vehicles before deleting user locally
  await supabase
    .from('vehicles')
    .update({ envio_user_id: null })
    .eq('envio_user_id', userId);

  // Step 3: Delete user locally
  const { error } = await supabase
    .from('envio_users')
    .delete()
    .eq('id', userId);

  if (error) {
    console.error('Error deleting user locally:', error);
    throw new Error(error.message);
  }

  console.log(`User ${userId} deleted successfully from both GP51 and local database`);
}
