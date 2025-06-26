
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserData {
  id: string;
  name: string;
  email: string;
  created_at: string;
  registration_status?: string;
  phone_number?: string;
}

interface UserGroup {
  id: string;
  name: string;
  description?: string;
  user_count: number;
}

export const useUserManagement = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('envio_users')
        .select('id, name, email, created_at, registration_status, phone_number')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(data || []);
      return data || [];
    } catch (err) {
      console.error('Error fetching users:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
      setError(errorMessage);
      return [];
    }
  };

  const fetchUserGroups = async () => {
    try {
      // Try to get user groups from available tables
      // First check if we have a dedicated user_groups table
      let groupsData: any[] = [];
      
      try {
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('role, user_id')
          .order('role');

        if (!rolesError && rolesData) {
          // Group users by role
          const roleGroups: Record<string, any> = {};
          rolesData.forEach(roleItem => {
            if (!roleGroups[roleItem.role]) {
              roleGroups[roleItem.role] = {
                id: roleItem.role,
                name: roleItem.role.charAt(0).toUpperCase() + roleItem.role.slice(1),
                description: `Users with ${roleItem.role} role`,
                user_count: 0
              };
            }
            roleGroups[roleItem.role].user_count++;
          });
          
          groupsData = Object.values(roleGroups);
        }
      } catch (roleError) {
        console.log('No user_roles table available, creating default groups');
      }

      // If no role-based groups, create default groups based on registration status
      if (groupsData.length === 0) {
        const { data: statusData, error: statusError } = await supabase
          .from('envio_users')
          .select('registration_status')
          .not('registration_status', 'is', null);

        if (!statusError && statusData) {
          const statusGroups: Record<string, any> = {};
          statusData.forEach(user => {
            const status = user.registration_status || 'unknown';
            if (!statusGroups[status]) {
              statusGroups[status] = {
                id: status,
                name: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
                description: `Users with ${status} status`,
                user_count: 0
              };
            }
            statusGroups[status].user_count++;
          });
          
          groupsData = Object.values(statusGroups);
        }
      }

      setUserGroups(groupsData);
      return groupsData;
    } catch (err) {
      console.error('Error fetching user groups:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user groups';
      setError(errorMessage);
      return [];
    }
  };

  const refreshAll = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchUsers(),
        fetchUserGroups()
      ]);
      
      console.log('✅ User management data refreshed');
    } catch (err) {
      console.error('❌ Error refreshing user management data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh data';
      setError(errorMessage);
      
      toast({
        title: "Data Refresh Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    refreshAll();
  }, []);

  return {
    users,
    userGroups,
    isLoading,
    error,
    refreshAll,
    fetchUsers,
    fetchUserGroups
  };
};
