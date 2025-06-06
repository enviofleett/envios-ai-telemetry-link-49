
import React, { Suspense } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User } from '@/types/user-management';
import UserTableSkeleton from './UserTableSkeleton';

// Lazy load heavy components
const OptimizedUserTableRow = React.lazy(() => import('./OptimizedUserTableRow'));

interface UserTableContentProps {
  users: User[];
  isLoading: boolean;
  debouncedSearch: string;
  selectedUsers: string[];
  handleSelectAll: (checked: boolean) => void;
  handleUserSelect: (userId: string, checked: boolean) => void;
  handleUserEdit: (user: User) => void;
  handleUserDelete: (userId: string) => void;
  handleUserAssignVehicles: (user: User) => void;
  sortBy: string;
  sortOrder: string;
  handleSort: (field: any) => void;
}

const UserTableContent: React.FC<UserTableContentProps> = ({
  users,
  isLoading,
  debouncedSearch,
  selectedUsers,
  handleSelectAll,
  handleUserSelect,
  handleUserEdit,
  handleUserDelete,
  handleUserAssignVehicles,
  sortBy,
  sortOrder,
  handleSort
}) => {
  return (
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
  );
};

export default UserTableContent;
