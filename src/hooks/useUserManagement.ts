
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string;
}

interface UserGroup {
  id: string;
  name: string;
  description?: string;
  user_count: number;
}

export const useUserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, created_at');

      if (error) throw error;

      const transformedUsers: User[] = (data || []).map(profile => ({
        id: profile.id,
        email: profile.email || '',
        name: profile.full_name || '',
        created_at: profile.created_at
      }));

      setUsers(transformedUsers);
      return transformedUsers;
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
      return [];
    }
  };

  const fetchUserGroups = async () => {
    try {
      // For now, create mock data since user groups table might not exist
      const mockGroups: UserGroup[] = [
        { id: '1', name: 'Administrators', description: 'System administrators', user_count: 5 },
        { id: '2', name: 'Fleet Managers', description: 'Fleet management team', user_count: 12 },
        { id: '3', name: 'Drivers', description: 'Vehicle operators', user_count: 85 },
        { id: '4', name: 'Maintenance', description: 'Vehicle maintenance staff', user_count: 8 }
      ];

      setUserGroups(mockGroups);
      return mockGroups;
    } catch (err) {
      console.error('Error fetching user groups:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user groups');
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
    } catch (err) {
      console.error('Error refreshing user data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  return {
    users,
    userGroups,
    isLoading,
    error,
    fetchUsers,
    fetchUserGroups,
    refreshAll
  };
};
