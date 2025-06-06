
import React, { memo, useMemo } from 'react';
import { usePerformanceOptimizedUserManagement } from '@/hooks/usePerformanceOptimizedUserManagement';
import { useQueryPrefetching } from '@/hooks/useQueryPrefetching';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';
import { User } from '@/types/user-management';
import UserTableHeader from './UserTableHeader';
import UserTablePagination from './UserTablePagination';
import UserErrorBoundary from './UserErrorBoundary';
import UserTablePerformanceMetrics from './UserTablePerformanceMetrics';
import UserTableDatabaseStatus from './UserTableDatabaseStatus';
import UserTableContent from './UserTableContent';

interface OptimizedUserManagementTableProps {
  refreshTrigger?: number;
  onCreateUser: () => void;
  onEditUser: (user: User) => void;
  onImportUsers: () => void;
  onAssignVehicles: (user: User) => void;
}

const VIRTUAL_THRESHOLD = 100; // Switch to virtual scrolling when over 100 users

const OptimizedUserManagementTable = memo<OptimizedUserManagementTableProps>(({
  onCreateUser,
  onEditUser,
  onImportUsers,
  onAssignVehicles,
}) => {
  const {
    users,
    pagination,
    isLoading,
    error,
    filters,
    setFilters,
    debouncedSearch,
    selectedUsers,
    handleSelectUser,
    handleSelectAll,
    sortBy,
    sortOrder,
    handleSort,
    currentPage,
    handlePageChange,
    deleteUser,
    handleBulkDelete,
    handleExport,
    isDeleting,
    isBulkDeleting,
    performanceMetrics,
  } = usePerformanceOptimizedUserManagement();

  const { metrics, logPerformanceWarning } = usePerformanceMonitoring('OptimizedUserManagementTable');

  // Enable prefetching for better UX
  useQueryPrefetching({
    currentPage,
    totalPages: pagination?.totalPages,
    search: debouncedSearch,
    enabled: !isLoading
  });

  // Memoized callbacks to prevent unnecessary re-renders
  const handleUserSelect = useMemo(() => 
    (userId: string, checked: boolean) => handleSelectUser(userId, checked),
    [handleSelectUser]
  );

  const handleUserEdit = useMemo(() => 
    (user: User) => onEditUser(user),
    [onEditUser]
  );

  const handleUserDelete = useMemo(() => 
    (userId: string) => deleteUser(userId),
    [deleteUser]
  );

  const handleUserAssignVehicles = useMemo(() => 
    (user: User) => onAssignVehicles(user),
    [onAssignVehicles]
  );

  // Check if virtual scrolling should be enabled
  const shouldUseVirtualScrolling = useMemo(() => 
    users.length > VIRTUAL_THRESHOLD,
    [users.length]
  );

  // Log performance warnings
  React.useEffect(() => {
    logPerformanceWarning(150); // 150ms threshold for this component
  }, [logPerformanceWarning]);

  if (error) {
    return (
      <UserErrorBoundary>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">
            Error loading users: {error.message}
          </div>
        </div>
      </UserErrorBoundary>
    );
  }

  return (
    <UserErrorBoundary>
      <div className="space-y-4">
        <UserTableHeader
          filters={filters}
          onFiltersChange={setFilters}
          selectedCount={selectedUsers.length}
          onCreateUser={onCreateUser}
          onImportUsers={onImportUsers}
          onExport={handleExport}
          onBulkDelete={handleBulkDelete}
          isBulkDeleting={isBulkDeleting}
          debouncedSearch={debouncedSearch}
          searchValue={filters.search}
        />

        <UserTablePerformanceMetrics
          metrics={metrics}
          performanceMetrics={performanceMetrics}
          shouldUseVirtualScrolling={shouldUseVirtualScrolling}
        />

        <UserTableDatabaseStatus />

        <UserTableContent
          users={users}
          isLoading={isLoading}
          debouncedSearch={debouncedSearch}
          selectedUsers={selectedUsers}
          handleSelectAll={handleSelectAll}
          handleUserSelect={handleUserSelect}
          handleUserEdit={handleUserEdit}
          handleUserDelete={handleUserDelete}
          handleUserAssignVehicles={handleUserAssignVehicles}
          sortBy={sortBy}
          sortOrder={sortOrder}
          handleSort={handleSort}
        />

        {/* Pagination */}
        {pagination && (
          <UserTablePagination
            pagination={pagination}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            pageSize={50}
          />
        )}
      </div>
    </UserErrorBoundary>
  );
});

OptimizedUserManagementTable.displayName = 'OptimizedUserManagementTable';

export default OptimizedUserManagementTable;
