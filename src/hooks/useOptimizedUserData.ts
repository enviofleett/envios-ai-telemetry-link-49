
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  name: string;
  email: string;
  phone_number?: string;
  created_at: string;
  user_roles: Array<{ role: string }>;
  gp51_sessions: Array<{
    id: string;
    username: string;
    token_expires_at: string;
  }>;
  gp51_username?: string;
  gp51_user_type?: number;
  registration_status?: string;
  assigned_vehicles?: string[];
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface UseOptimizedUserDataOptions {
  page?: number;
  limit?: number;
  search?: string;
  enabled?: boolean;
}

export const useOptimizedUserData = ({
  page = 1,
  limit = 50,
  search = '',
  enabled = true
}: UseOptimizedUserDataOptions = {}) => {
  return useQuery({
    queryKey: ['users-optimized', page, limit, search],
    queryFn: async (): Promise<UsersResponse> => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (search.length >= 2) {
        params.append('search', search);
      }

      const { data, error } = await supabase.functions.invoke('user-management', {
        method: 'GET',
        body: null,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (error) {
        console.error('Error fetching users:', error);
        throw new Error(`Failed to fetch users: ${error.message}`);
      }

      return data as UsersResponse;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

// Hook for fetching a single user
export const useOptimizedSingleUser = (userId: string, enabled = true) => {
  return useQuery({
    queryKey: ['user-single', userId],
    queryFn: async (): Promise<User> => {
      const { data, error } = await supabase.functions.invoke(`user-management/${userId}`);
      
      if (error) {
        throw new Error(`Failed to fetch user: ${error.message}`);
      }

      return data.user;
    },
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
