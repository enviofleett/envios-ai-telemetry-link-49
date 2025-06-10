
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useUserRole = (user: any) => {
  const [userRole, setUserRole] = useState<string | null>(null);

  const fetchUserRole = async (authUserId: string) => {
    try {
      const { data: roleData, error: roleError } = await supabase
        .rpc('get_user_role', { _user_id: authUserId });

      if (!roleError && roleData) {
        setUserRole(roleData);
        return;
      }

      // Create default user role if none exists
      if (authUserId) {
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authUserId)
          .single();

        if (!existingRole) {
          await supabase
            .from('user_roles')
            .insert({
              user_id: authUserId,
              role: 'user' as any
            });
        }

        setUserRole(existingRole?.role || 'user');
      }
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
      setUserRole('user');
    }
  };

  const refreshUserRole = async () => {
    if (user) {
      await fetchUserRole(user.id);
    }
  };

  useEffect(() => {
    if (user && !userRole) {
      fetchUserRole(user.id);
    }
  }, [user]);

  return {
    userRole,
    isAdmin: userRole === 'admin',
    refreshUserRole
  };
};
