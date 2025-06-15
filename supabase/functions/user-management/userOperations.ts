import { autoLinkUserVehicles } from './autoLinking.ts';
import { isUserAdmin } from './auth.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

async function createUserInGP51(userData: any): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔄 Creating GP51 user via gp51-user-management function');

    // Call GP51 user management API to create user
    const { data, error } = await supabase.functions.invoke('gp51-user-management', {
      body: {
        action: 'adduser',
        username: userData.gp51_username || userData.email,
        password: userData.password || 'TempPass123!', // Temporary password if not provided
        showname: userData.name,
        email: userData.email,
        usertype: userData.gp51_user_type || 3, // Default to End User
        multilogin: 1
      }
    });

    if (error) {
      console.error('GP51 user creation failed:', error);
      return { success: false, error: error.message };
    }

    if (data && data.success) {
      console.log('✅ User created successfully in GP51:', userData.gp51_username || userData.email);
      return { success: true };
    } else {
      console.error('GP51 user creation returned error:', data);
      return { success: false, error: data?.error || 'Unknown GP51 error' };
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

    console.log('🔄 Deleting GP51 user via gp51-user-management function');

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

    if (data && data.success) {
      console.log('✅ User deleted successfully from GP51:', gp51Username);
      return { success: true };
    } else {
      console.error('GP51 user deletion returned error:', data);
      return { success: false, error: data?.error || 'Unknown GP51 error' };
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

  let gp51Created = false;

  try {
    // Step 1: Create user in GP51 first if GP51 username is provided
    if (gp51_username) {
      console.log(`🔄 Creating user in GP51 first: ${gp51_username}`);
      const gp51Result = await createUserInGP51({
        ...userData,
        gp51_username,
        password: password || 'TempPass123!' // Use provided password or temporary one
      });

      if (!gp51Result.success) {
        console.error('Failed to create user in GP51:', gp51Result.error);
        throw new Error(`GP51 user creation failed: ${gp51Result.error}`);
      }

      gp51Created = true;
      console.log('✅ User created successfully in GP51, proceeding with local creation');

      // Track GP51 user management
      await supabase
        .from('gp51_user_management')
        .insert({
          envio_user_id: newUserId,
          gp51_username,
          gp51_user_type: userData.gp51_user_type || 3,
          activation_status: 'active',
          activation_date: new Date().toISOString(),
          last_sync_at: new Date().toISOString()
        });
    }

    // Step 2: Create user locally
    const { data: user, error } = await supabase
      .from('envio_users')
      .insert(userCreateData)
      .select()
      .single();

    if (error) {
      console.error('Error creating user locally:', error);
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

    console.log(`✅ Created user ${newUserId} with GP51 integration and auto-linked ${linkedVehicles} vehicles`);

    return {
      user,
      autoLinkedVehicles: linkedVehicles,
      gp51Created: !!gp51_username
    };

  } catch (error) {
    console.error('User creation failed, rolling back:', error);
    
    // Rollback: If local creation fails, try to delete from GP51
    if (gp51Created && gp51_username) {
      console.log('🔄 Rolling back GP51 user creation due to local creation failure');
      await deleteUserFromGP51(gp51_username);
    }
    
    throw error;
  }
}

export async function updateUser(supabase: any, userId: string, updateData: any, currentUserId: string) {
  const userData: any = {};
  if (updateData.name) userData.name = updateData.name;
  if (updateData.email) userData.email = updateData.email;
  if (updateData.phone_number !== undefined) userData.phone_number = updateData.phone_number;
  if (updateData.gp51_username !== undefined) userData.gp51_username = updateData.gp51_username;
  if (updateData.gp51_user_type !== undefined) userData.gp51_user_type = updateData.gp51_user_type;

  const isAdmin = await isUserAdmin(supabase, currentUserId);
  if (currentUserId !== userId && !isAdmin) {
    throw new Error('Admin access required');
  }

  // Password update logic
  if (updateData.password) {
    if (!isAdmin) {
      throw new Error('Admin access required to change passwords.');
    }
    if (String(updateData.password).length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    console.log(`🔄 Admin ${currentUserId} is updating password for user ${userId}`);

    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: updateData.password,
    });

    if (authError) {
      console.error('Error updating user password in Supabase Auth:', authError);
      throw new Error(`Failed to update password in Auth: ${authError.message}`);
    }

    console.log(`✅ Password updated successfully in Supabase Auth for user ${userId}`);
  }

  // Get current user data to check for GP51 username
  const { data: currentUser } = await supabase
    .from('envio_users')
    .select('gp51_username, name, email')
    .eq('id', userId)
    .single();

  // If user has GP51 username, update in GP51 first
  if (currentUser?.gp51_username && (updateData.name || updateData.email || updateData.password)) {
    console.log(`🔄 Updating user in GP51: ${currentUser.gp51_username}`);
    
    try {
      const gp51UpdatePayload: any = {
        action: 'edituser',
        username: currentUser.gp51_username,
        showname: updateData.name || currentUser.name,
        email: updateData.email || currentUser.email,
      };

      // Also update password in GP51 if provided
      if (updateData.password) {
        gp51UpdatePayload.password = updateData.password;
      }

      const { data, error } = await supabase.functions.invoke('gp51-user-management', {
        body: gp51UpdatePayload
      });

      if (error || (data && !data.success)) {
        console.error('GP51 user update failed:', error || data);
        // Do not throw an error, just log it, as Supabase password is already updated.
        // This prevents a state mismatch. The sync can be retried later.
        console.warn(`GP51 user update failed but continuing: ${error?.message || data?.error || 'Unknown error'}`);
      } else {
        console.log('✅ User updated successfully in GP51');
      }

      // Update tracking table
      await supabase
        .from('gp51_user_management')
        .update({
          last_sync_at: new Date().toISOString()
        })
        .eq('envio_user_id', userId);

    } catch (error) {
      console.error('Exception during GP51 user update:', error);
      console.warn(`GP51 user update failed but continuing: ${error.message}`);
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
    console.log(`🔄 Deleting user from GP51: ${user.gp51_username}`);
    const gp51Result = await deleteUserFromGP51(user.gp51_username);

    if (!gp51Result.success) {
      console.error('Failed to delete user from GP51:', gp51Result.error);
      throw new Error(`GP51 user deletion failed: ${gp51Result.error}`);
    }

    console.log('✅ User deleted successfully from GP51, proceeding with local deletion');
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

  console.log(`✅ User ${userId} deleted successfully from both GP51 and local database`);
}
