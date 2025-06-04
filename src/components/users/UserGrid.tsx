
import React from 'react';
import { Button } from '@/components/ui/button';
import EnhancedUserCard from '@/components/users/EnhancedUserCard';

interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
  needs_password_set?: boolean;
  is_gp51_imported?: boolean;
  import_source?: string;
  gp51_username?: string;
  user_roles: Array<{
    role: string;
  }>;
  gp51_sessions: Array<{
    id: string;
    username: string;
    created_at: string;
    token_expires_at: string;
  }>;
}

interface UserGridProps {
  isLoading: boolean;
  filteredUsers: User[];
  users: User[];
  vehicleCounts: Record<string, number>;
  currentUserId?: string;
  onEditUser: (user: User) => void;
  onEditRole: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onClearFilters: () => void;
}

const UserGrid: React.FC<UserGridProps> = ({
  isLoading,
  filteredUsers,
  users,
  vehicleCounts,
  currentUserId,
  onEditUser,
  onEditRole,
  onDeleteUser,
  onClearFilters
}) => {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-80"></div>
          </div>
        ))}
      </div>
    );
  }

  if (filteredUsers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">
          {users.length === 0 ? 'No users found' : 'No users match your filters'}
        </div>
        {users.length > 0 && (
          <Button variant="outline" onClick={onClearFilters}>
            Clear Filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {filteredUsers.map((user) => (
        <EnhancedUserCard
          key={user.id}
          user={user}
          vehicleCount={vehicleCounts[user.id] || 0}
          isCurrentUser={user.id === currentUserId}
          onEdit={onEditUser}
          onEditRole={onEditRole}
          onDelete={onDeleteUser}
        />
      ))}
    </div>
  );
};

export default UserGrid;
