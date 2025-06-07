
import { isUserAdmin } from './auth.ts';

export async function getCurrentUserRole(supabase: any, currentUserId: string) {
  const { data: userRole, error } = await supabase
    .rpc('get_user_role', { _user_id: currentUserId });

  if (error) {
    console.error('Error fetching user role:', error);
    throw new Error('Failed to fetch user role');
  }

  return { role: userRole || 'user' };
}

export async function updateUserRole(supabase: any, userId: string, role: string, currentUserId: string) {
  if (!currentUserId) {
    throw new Error('Authentication required');
  }

  if (!(await isUserAdmin(supabase, currentUserId))) {
    throw new Error('Admin access required');
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
    throw new Error(error.message);
  }
}
