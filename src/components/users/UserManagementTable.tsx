
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUserManagement } from '@/hooks/useUserManagement';
import { User } from '@/types/user-management';
import UserTableHeader from './UserTableHeader';
import UserTableRow from './UserTableRow';
import UserTablePagination from './UserTablePagination';

interface UserManagementTableProps {
  refreshTrigger?: number;
  onCreateUser: () => void;
  onEditUser: (user: User) => void;
  onImportUsers: () => void;
  onAssignVehicles: (user: User) => void;
}

const UserManagementTable: React.FC<UserManagementTableProps> = ({
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
  } = useUserManagement();

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">
          Error loading users: {error.message}
        </div>
      </div>
    );
  }

  return (
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
                className="cursor-pointer"
                onClick={() => handleSort('name')}
              >
                Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                className="cursor-pointer"
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
                className="cursor-pointer"
                onClick={() => handleSort('created_at')}
              >
                Created {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="w-16">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mr-2"></div>
                    Loading users...
                  </div>
                </TableCell>
              </TableRow>
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
                <UserTableRow
                  key={user.id}
                  user={user}
                  isSelected={selectedUsers.includes(user.id)}
                  onSelect={(checked) => handleSelectUser(user.id, checked)}
                  onEdit={() => onEditUser(user)}
                  onDelete={() => deleteUser(user.id)}
                  onAssignVehicles={() => onAssignVehicles(user)}
                />
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
  );
};

export default UserManagementTable;
