
import { useState, useMemo, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useOptimizedUserData } from '@/hooks/useOptimizedUserData';
import { useDebounce } from '@/hooks/useDebounce';
import { 
  User, 
  UserFilters, 
  UserSortField, 
  SortOrder,
  UserManagementError,
  createUserManagementError
} from '@/types/user-management';
import { userManagementService } from '@/services/userManagementService';

// Type guard to check if an error is a UserManagementError
function isUserManagementError(error: any): error is UserManagementError {
  return (
    error &&
    typeof error === 'object' &&
    typeof error.code === 'string' &&
    typeof error.message === 'string' &&
    typeof error.timestamp === 'string'
  );
}

export const usePerformanceOptimizedUserManagement = () => {
  const [filters, setFilters] = useState<UserFilters>({ search: '' });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<UserSortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const pageSize = 50;

  // Debounce search to prevent excessive API calls
  const debouncedSearch = useDebounce(filters.search, 500);

  const { data: usersData, isLoading, error } = useOptimizedUserData({
    page: currentPage,
    limit: pageSize,
    search: debouncedSearch,
  });

  const users = usersData?.users || [];
  const pagination = usersData?.pagination;

  // Memoized sorted users with performance optimization
  const sortedUsers = useMemo(() => {
    if (!users.length) return [];
    
    try {
      return [...users].sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        
        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;
        
        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    } catch (error) {
      console.error('Error sorting users:', error);
      return users;
    }
  }, [users, sortBy, sortOrder]);

  // Memoized callbacks to prevent unnecessary re-renders
  const handleSort = useCallback((column: UserSortField) => {
    if (sortBy === column) {
      setSortOrder(current => current === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  }, [sortBy]);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedUsers(sortedUsers.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  }, [sortedUsers]);

  const handleSelectUser = useCallback((userId: string, checked: boolean) => {
    setSelectedUsers(prev => {
      if (checked) {
        return [...prev, userId];
      } else {
        return prev.filter(id => id !== userId);
      }
    });
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    setSelectedUsers([]); // Clear selections when changing pages
  }, []);

  // Optimized mutation with better error handling
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      try {
        await userManagementService.deleteUser(userId);
      } catch (error) {
        if (isUserManagementError(error)) {
          throw error;
        }
        throw createUserManagementError(
          'DELETE_USER_ERROR',
          'Failed to delete user',
          { userId, originalError: error }
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-optimized'] });
      toast({ 
        title: 'Success', 
        description: 'User deleted successfully' 
      });
    },
    onError: (error: any) => {
      console.error('Delete user error:', error);
      const userError = isUserManagementError(error)
        ? error
        : createUserManagementError('DELETE_USER_ERROR', 'An unexpected error occurred');
      
      toast({ 
        title: 'Error deleting user', 
        description: userError.message || 'An unexpected error occurred', 
        variant: 'destructive' 
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      try {
        await userManagementService.bulkDeleteUsers(userIds);
      } catch (error) {
        if (isUserManagementError(error)) {
          throw error;
        }
        throw createUserManagementError(
          'BULK_DELETE_ERROR',
          'Failed to delete users',
          { userIds, originalError: error }
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-optimized'] });
      setSelectedUsers([]);
      toast({ 
        title: 'Success',
        description: `Users deleted successfully` 
      });
    },
    onError: (error: any) => {
      console.error('Bulk delete error:', error);
      const userError = isUserManagementError(error)
        ? error
        : createUserManagementError('BULK_DELETE_ERROR', 'An unexpected error occurred');
      
      toast({ 
        title: 'Error deleting users', 
        description: userError.message || 'An unexpected error occurred', 
        variant: 'destructive' 
      });
    },
  });

  const handleBulkDelete = useCallback(() => {
    if (selectedUsers.length === 0) {
      toast({
        title: 'No users selected',
        description: 'Please select users to delete',
        variant: 'destructive'
      });
      return;
    }

    if (confirm(`Are you sure you want to delete ${selectedUsers.length} users? This action cannot be undone.`)) {
      bulkDeleteMutation.mutate(selectedUsers);
    }
  }, [selectedUsers, bulkDeleteMutation, toast]);

  const handleExport = useCallback(async () => {
    try {
      await userManagementService.exportUsers(sortedUsers);
      toast({
        title: 'Export successful',
        description: 'Users have been exported to CSV'
      });
    } catch (error) {
      console.error('Export error:', error);
      const userError = isUserManagementError(error)
        ? error
        : createUserManagementError('EXPORT_ERROR', 'Failed to export users');
      
      toast({
        title: 'Export failed',
        description: userError.message,
        variant: 'destructive'
      });
    }
  }, [sortedUsers, toast]);

  // Performance metrics
  const performanceMetrics = useMemo(() => ({
    totalUsers: users.length,
    selectedCount: selectedUsers.length,
    currentSort: `${sortBy} ${sortOrder}`,
    isSearchActive: debouncedSearch.length > 0,
    pageInfo: pagination ? `${currentPage}/${pagination.totalPages}` : 'N/A'
  }), [users.length, selectedUsers.length, sortBy, sortOrder, debouncedSearch, currentPage, pagination]);

  return {
    // Data
    users: sortedUsers,
    pagination,
    isLoading,
    error: error && isUserManagementError(error) ? error : null,
    
    // Filters and search
    filters,
    setFilters,
    debouncedSearch,
    
    // Selection
    selectedUsers,
    handleSelectUser,
    handleSelectAll,
    
    // Sorting
    sortBy,
    sortOrder,
    handleSort,
    
    // Pagination
    currentPage,
    handlePageChange,
    
    // Actions
    deleteUser: deleteUserMutation.mutate,
    handleBulkDelete,
    handleExport,
    
    // Loading states
    isDeleting: deleteUserMutation.isPending,
    isBulkDeleting: bulkDeleteMutation.isPending,
    
    // Performance metrics
    performanceMetrics,
  };
};
