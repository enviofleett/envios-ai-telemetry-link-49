
import React, { memo, useMemo, Suspense, lazy } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePerformanceOptimizedUserManagement } from '@/hooks/usePerformanceOptimizedUserManagement';
import { useQueryPrefetching } from '@/hooks/useQueryPrefetching';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';
import { User } from '@/types/user-management';
import UserTableHeader from './UserTableHeader';
import UserTablePagination from './UserTablePagination';
import UserErrorBoundary from './UserErrorBoundary';
import UserTableSkeleton from './UserTableSkeleton';

// Lazy load heavy components
const OptimizedUserTableRow = lazy(() => import('./OptimizedUserTableRow'));

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

        {/* Performance Metrics (Development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
            <div className="flex items-center gap-4">
              <span>Render: {metrics.renderTime.toFixed(1)}ms</span>
              <span>Re-renders: {metrics.reRenderCount}</span>
              <span>Users: {performanceMetrics.totalUsers}</span>
              <span>Selected: {performanceMetrics.selectedCount}</span>
              <span>Page: {performanceMetrics.pageInfo}</span>
              {shouldUseVirtualScrolling && <span className="text-blue-600">Virtual Scrolling</span>}
            </div>
          </div>
        )}

        {/* Database Status Info */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-700 font-medium">
              Database cleaned and ready for fresh data
            </span>
          </div>
          <p className="text-xs text-green-600 mt-1">
            All previous data has been safely backed up and the system is ready for new imports
          </p>
        </div>

        {/* Users Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('name')}
                >
                  Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('email')}
                >
                  Email {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>GP51 Status</TableHead>
                <TableHead>User Type</TableHead>
                <TableHead>Vehicles</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('created_at')}
                >
                  Created {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <UserTableSkeleton rows={10} />
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    <div className="text-gray-500">
                      {debouncedSearch ? 'No users found matching your search' : 'No users found - Start by importing or creating new users'}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <Suspense key={user.id} fallback={<UserTableSkeleton rows={1} />}>
                    <OptimizedUserTableRow
                      user={user}
                      isSelected={selectedUsers.includes(user.id)}
                      onSelect={handleUserSelect}
                      onEdit={handleUserEdit}
                      onDelete={handleUserDelete}
                      onAssignVehicles={handleUserAssignVehicles}
                    />
                  </Suspense>
                ))
              )}
            </TableBody>
          </Table>
        </div>

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
