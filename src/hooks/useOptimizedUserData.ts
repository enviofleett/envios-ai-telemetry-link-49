
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  User, 
  UsersResponse, 
  createUserManagementError,
  isUsersResponse,
  UsersResponseSchema 
} from '@/types/user-management';

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
      try {
        console.log('Fetching users with params:', { page, limit, search });
        
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
          throw createUserManagementError(
            'FETCH_USERS_ERROR',
            `Failed to fetch users: ${error.message}`,
            { originalError: error, params: Object.fromEntries(params) }
          );
        }

        // Validate response structure
        try {
          const validatedData = UsersResponseSchema.parse(data);
          console.log('Users data received and validated:', validatedData);
          return validatedData as UsersResponse;
        } catch (validationError) {
          console.error('Invalid response structure:', validationError);
          throw createUserManagementError(
            'VALIDATION_ERROR',
            'Received invalid data structure from server',
            { validationError, receivedData: data }
          );
        }
      } catch (error) {
        if (error && typeof error === 'object' && 'code' in error) {
          throw error; // Re-throw UserManagementError
        }
        
        throw createUserManagementError(
          'NETWORK_ERROR',
          'Network error while fetching users',
          { originalError: error, page, limit, search }
        );
      }
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry validation errors
      if (error && typeof error === 'object' && 'code' in error) {
        const userError = error as any;
        if (userError.code === 'VALIDATION_ERROR') {
          return false;
        }
      }
      return failureCount < 2; // Retry network errors up to 2 times
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Hook for fetching a single user with enhanced error handling
export const useOptimizedSingleUser = (userId: string, enabled = true) => {
  return useQuery({
    queryKey: ['user-single', userId],
    queryFn: async (): Promise<User> => {
      try {
        if (!userId || typeof userId !== 'string') {
          throw createUserManagementError(
            'VALIDATION_ERROR',
            'Invalid user ID provided'
          );
        }

        const { data, error } = await supabase.functions.invoke(`user-management/${userId}`);
        
        if (error) {
          throw createUserManagementError(
            'FETCH_USERS_ERROR',
            `Failed to fetch user: ${error.message}`,
            { userId, originalError: error }
          );
        }

        if (!data?.user) {
          throw createUserManagementError(
            'NOT_FOUND_ERROR',
            'User not found',
            { userId }
          );
        }

        return data.user;
      } catch (error) {
        if (error && typeof error === 'object' && 'code' in error) {
          throw error;
        }
        
        throw createUserManagementError(
          'NETWORK_ERROR',
          'Network error while fetching user',
          { userId, originalError: error }
        );
      }
    },
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error && typeof error === 'object' && 'code' in error) {
        const userError = error as any;
        if (['VALIDATION_ERROR', 'NOT_FOUND_ERROR'].includes(userError.code)) {
          return false;
        }
      }
      return failureCount < 2;
    },
  });
};
