
import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useOptimizedUserData } from '@/hooks/useOptimizedUserData';
import { useDebounce } from '@/hooks/useDebounce';
import { User, UserFilters } from '@/types/user-management';
import { userManagementService } from '@/services/userManagementService';

export const useUserManagement = () => {
  const [filters, setFilters] = useState<UserFilters>({ search: '' });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
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

  // Sort users on frontend
  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [users, sortBy, sortOrder]);

  const deleteUserMutation = useMutation({
    mutationFn: userManagementService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-optimized'] });
      toast({ title: 'User deleted successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error deleting user', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: userManagementService.bulkDeleteUsers,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-optimized'] });
      setSelectedUsers([]);
      toast({ title: `${selectedUsers.length} users deleted successfully` });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error deleting users', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const handleSort = (column: 'name' | 'email' | 'created_at') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(sortedUsers.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedUsers([]); // Clear selections when changing pages
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) {
      bulkDeleteMutation.mutate(selectedUsers);
    }
  };

  const handleExport = () => {
    userManagementService.exportUsers(sortedUsers);
  };

  return {
    // Data
    users: sortedUsers,
    pagination,
    isLoading,
    error,
    
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
  };
};
