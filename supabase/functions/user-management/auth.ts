
export async function getCurrentUser(supabase: any, authHeader: string | null) {
  if (!authHeader) {
    throw new Error('Authorization header required');
  }

  const token = authHeader.replace('Bearer ', '');
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      throw new Error('Invalid authentication token');
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || roleData.role !== 'admin') {
      throw new Error('Admin access required');
    }

    return user.id;
  } catch (error: any) {
    console.error('Auth error:', error);
    throw new Error(`Authentication failed: ${error.message}`);
  }
}
