
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UserRole {
  role: string;
}

interface GP51Session {
  id: string;
  username: string | null;
  token_expires_at: string | null;
}

interface EnvioUser {
  id: string;
  name: string | null;
  email: string | null;
  phone_number: string | null;
  created_at: string;
  gp51_username: string | null;
  gp51_user_type: number;
  registration_status: string;
  assigned_vehicles: any[];
  user_roles: UserRole[];
  gp51_sessions: GP51Session[];
}

interface UserDataResponse {
  users: EnvioUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const useOptimizedUserData = (page = 1, limit = 50, search = '') => {
  return useQuery({
    queryKey: ['optimized-user-data', page, limit, search],
    queryFn: async (): Promise<UserDataResponse> => {
      const { data, error } = await supabase.functions.invoke('user-management', {
        method: 'GET',
        body: null,
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        }
      }, {
        query: { 
          page: page.toString(), 
          limit: limit.toString(), 
          search: search 
        }
      });

      if (error) {
        console.error('User data fetch error:', error);
        throw new Error(`Failed to fetch user data: ${error.message}`);
      }

      // Ensure the response matches our expected format
      if (!data || typeof data !== 'object') {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from user management API');
      }

      // Handle both direct response and nested response formats
      const responseData = data.users ? data : { users: data, pagination: { page, limit, total: 0, totalPages: 0 } };
      
      // Validate users array
      if (!Array.isArray(responseData.users)) {
        console.error('Users is not an array:', responseData.users);
        return {
          users: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0
          }
        };
      }

      // Transform users to ensure consistent format
      const transformedUsers = responseData.users.map((user: any) => ({
        id: user.id || '',
        name: user.name || 'Unknown',
        email: user.email || '',
        phone_number: user.phone_number || '',
        created_at: user.created_at || new Date().toISOString(),
        gp51_username: user.gp51_username || '',
        gp51_user_type: user.gp51_user_type || 3,
        registration_status: user.registration_status || 'pending',
        assigned_vehicles: user.assigned_vehicles || [],
        user_roles: Array.isArray(user.user_roles) ? user.user_roles : [{ role: 'user' }],
        gp51_sessions: Array.isArray(user.gp51_sessions) ? user.gp51_sessions : []
      }));

      return {
        users: transformedUsers,
        pagination: responseData.pagination || {
          page,
          limit,
          total: transformedUsers.length,
          totalPages: Math.ceil(transformedUsers.length / limit)
        }
      };
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
