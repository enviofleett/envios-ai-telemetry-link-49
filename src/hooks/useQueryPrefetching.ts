
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { userManagementService } from '@/services/userManagementService';

interface UsePrefetchingOptions {
  currentPage: number;
  totalPages?: number;
  search: string;
  enabled?: boolean;
}

export const useQueryPrefetching = ({ 
  currentPage, 
  totalPages, 
  search, 
  enabled = true 
}: UsePrefetchingOptions) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !totalPages) return;

    // Prefetch next page
    if (currentPage < totalPages) {
      queryClient.prefetchQuery({
        queryKey: ['users-optimized', currentPage + 1, 50, search],
        queryFn: () => userManagementService.getUsers(currentPage + 1, 50, { search }),
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    }

    // Prefetch previous page if not the first page
    if (currentPage > 1) {
      queryClient.prefetchQuery({
        queryKey: ['users-optimized', currentPage - 1, 50, search],
        queryFn: () => userManagementService.getUsers(currentPage - 1, 50, { search }),
        staleTime: 5 * 60 * 1000,
      });
    }
  }, [currentPage, totalPages, search, enabled, queryClient]);

  // Background refresh for current page
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      queryClient.invalidateQueries({
        queryKey: ['users-optimized', currentPage, 50, search],
        exact: false,
        refetchType: 'none' // Don't refetch immediately, just mark as stale
      });
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [currentPage, search, enabled, queryClient]);
};
