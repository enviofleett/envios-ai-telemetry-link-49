
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface EnhancedUser {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
  needs_password_set?: boolean;
  is_gp51_imported?: boolean;
  import_source?: string;
  gp51_username?: string;
  user_roles: Array<{
    role: string;
  }>;
  gp51_sessions: Array<{
    id: string;
    username: string;
    created_at: string;
    token_expires_at: string;
  }>;
}

interface UserFilters {
  search: string;
  source: string;
  status: string;
  role: string;
}

export const useEnhancedUserData = () => {
  const { user: currentUser } = useAuth();
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    source: 'all',
    status: 'all',
    role: 'all'
  });

  // Fetch users with roles and GP51 sessions
  const { data: users = [], isLoading, error, refetch } = useQuery({
    queryKey: ['enhanced-users'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('user-management');
      if (error) throw error;
      return data.users as EnhancedUser[];
    },
  });

  // Get vehicle counts for each user
  const { data: vehicleCounts = {} } = useQuery({
    queryKey: ['user-vehicle-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('envio_user_id');
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data.forEach(vehicle => {
        if (vehicle.envio_user_id) {
          counts[vehicle.envio_user_id] = (counts[vehicle.envio_user_id] || 0) + 1;
        }
      });
      
      return counts;
    },
  });

  // Filter users based on current filters
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesSearch = 
          user.name.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm) ||
          (user.gp51_username && user.gp51_username.toLowerCase().includes(searchTerm));
        
        if (!matchesSearch) return false;
      }

      // Source filter
      if (filters.source !== 'all') {
        if (filters.source === 'gp51' && !user.is_gp51_imported) return false;
        if (filters.source === 'envio' && user.is_gp51_imported) return false;
      }

      // Status filter
      if (filters.status !== 'all') {
        if (filters.status === 'needs_password' && !user.needs_password_set) return false;
        if (filters.status === 'active' && user.needs_password_set) return false;
      }

      // Role filter
      if (filters.role !== 'all') {
        const userRole = user.user_roles?.[0]?.role || 'user';
        if (userRole !== filters.role) return false;
      }

      return true;
    });
  }, [users, filters]);

  // User statistics
  const statistics = useMemo(() => {
    const total = users.length;
    const gp51Imported = users.filter(u => u.is_gp51_imported).length;
    const envioRegistered = total - gp51Imported;
    const needsPassword = users.filter(u => u.needs_password_set).length;
    const admins = users.filter(u => u.user_roles?.[0]?.role === 'admin').length;

    return { 
      total, 
      gp51Imported, 
      envioRegistered, 
      needsPassword,
      admins 
    };
  }, [users]);

  return {
    users,
    filteredUsers,
    vehicleCounts,
    statistics,
    filters,
    setFilters,
    isLoading,
    error,
    refetch,
    currentUser
  };
};
