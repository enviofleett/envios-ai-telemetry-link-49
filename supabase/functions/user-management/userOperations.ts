
import { autoLinkUserVehicles } from './autoLinking.ts';
import { isUserAdmin } from './auth.ts';

export async function createUser(supabase: any, userData: any, currentUserId: string) {
  const { name, email, phone_number, gp51_username } = userData;

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

  const { data: user, error } = await supabase
    .from('envio_users')
    .insert(userCreateData)
    .select()
    .single();

  if (error) {
    console.error('Error creating user:', error);
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
    autoLinkedVehicles: linkedVehicles
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
    throw new Error(error.message);
  }
}
