
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface EnhancedUser {
  id: string;
  name: string | null;
  email: string | null;
  phone_number: string | null;
  created_at: string;
  gp51_username: string | null;
  gp51_user_type: number;
  registration_status: string;
  assigned_vehicles: any[];
  user_roles: Array<{ role: string }>;
  gp51_sessions: Array<{
    id: string;
    username: string | null;
    token_expires_at: string | null;
  }>;
}

interface EnhancedUserDataResponse {
  users: EnhancedUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  metadata: {
    lastFetch: Date;
    cacheStatus: 'fresh' | 'stale' | 'error';
    errorCount: number;
  };
}

interface UseEnhancedUserDataParams {
  page?: number;
  limit?: number;
  search?: string;
  enabled?: boolean;
  bypassCache?: boolean;
}

export const useEnhancedUserData = (params: UseEnhancedUserDataParams = {}) => {
  const { page = 1, limit = 50, search = '', enabled = true, bypassCache = false } = params;
  
  return useQuery({
    queryKey: ['enhanced-user-data', page, limit, search, bypassCache],
    queryFn: async (): Promise<EnhancedUserDataResponse> => {
      console.log('🔍 Fetching enhanced user data...');
      
      try {
        // First, try the edge function approach
        const { data: edgeFunctionData, error: edgeError } = await supabase.functions.invoke('user-management', {
          body: {
            page: page.toString(), 
            limit: limit.toString(), 
            search: search 
          },
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!edgeError && edgeFunctionData?.users) {
          console.log('✅ Enhanced user data fetched via edge function');
          return {
            users: edgeFunctionData.users,
            pagination: edgeFunctionData.pagination || {
              page,
              limit,
              total: edgeFunctionData.users.length,
              totalPages: Math.ceil(edgeFunctionData.users.length / limit)
            },
            metadata: {
              lastFetch: new Date(),
              cacheStatus: 'fresh',
              errorCount: 0
            }
          };
        }

        console.warn('Edge function failed, falling back to direct database access:', edgeError);

        // Fallback to direct database access
        const offset = (page - 1) * limit;
        
        let userQuery = supabase
          .from('envio_users')
          .select(`
            *,
            gp51_sessions (
              id,
              username,
              token_expires_at
            ),
            user_roles (
              role
            )
          `, { count: 'exact' })
          .order('created_at', { ascending: false });

        if (search.length >= 2) {
          userQuery = userQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone_number.ilike.%${search}%`);
        }

        userQuery = userQuery.range(offset, offset + limit - 1);

        const { data: users, error: usersError, count } = await userQuery;

        if (usersError) {
          console.error('Direct database access failed:', usersError);
          throw new Error(`Database access failed: ${usersError.message}`);
        }

        console.log(`✅ Enhanced user data fetched via direct access: ${users?.length || 0} users`);

        // Transform and enhance user data
        const enhancedUsers: EnhancedUser[] = (users || []).map(user => ({
          id: user.id,
          name: user.name || 'Unknown User',
          email: user.email || '',
          phone_number: user.phone_number || '',
          created_at: user.created_at,
          gp51_username: user.gp51_username || '',
          gp51_user_type: user.gp51_user_type || 3,
          registration_status: user.registration_status || 'pending',
          assigned_vehicles: [], // Will be populated separately if needed
          user_roles: user.user_roles || [{ role: 'user' }],
          gp51_sessions: user.gp51_sessions || []
        }));

        return {
          users: enhancedUsers,
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit)
          },
          metadata: {
            lastFetch: new Date(),
            cacheStatus: edgeError ? 'error' : 'fresh',
            errorCount: edgeError ? 1 : 0
          }
        };

      } catch (error) {
        console.error('Enhanced user data fetch failed completely:', error);
        
        // Return empty but valid response structure
        return {
          users: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0
          },
          metadata: {
            lastFetch: new Date(),
            cacheStatus: 'error',
            errorCount: 1
          }
        };
      }
    },
    enabled,
    refetchInterval: 30000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: bypassCache ? 0 : 15000,
  });
};
