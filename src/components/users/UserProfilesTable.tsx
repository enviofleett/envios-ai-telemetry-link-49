
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserProfiles, UserProfile } from '@/hooks/useUserProfiles';
import UserProfilesHeader from './UserProfilesHeader';
import UserProfilesFilters from './UserProfilesFilters';
import UserProfilesTableContent from './UserProfilesTableContent';
import UserProfilesPagination from './UserProfilesPagination';

interface UserProfilesTableProps {
  onUserClick: (user: UserProfile) => void;
  onEditUser: (user: UserProfile) => void;
  onAssignVehicles: (user: UserProfile) => void;
  onCreateUser: () => void;
}

const UserProfilesTable: React.FC<UserProfilesTableProps> = ({
  onUserClick,
  onEditUser,
  onAssignVehicles,
  onCreateUser
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);

  const { profiles, isLoading, error } = useUserProfiles();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">User Profiles</h2>
          <Button disabled>
            <Plus className="w-4 h-4 mr-2" />
            Create User
          </Button>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading user profiles: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <UserProfilesHeader onCreateUser={onCreateUser} />

      <UserProfilesFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
      />

      <UserProfilesTableContent
        profiles={profiles || []}
        onUserClick={onUserClick}
        onEditUser={onEditUser}
        onAssignVehicles={onAssignVehicles}
      />

      <UserProfilesPagination
        page={page}
        totalPages={Math.ceil((profiles?.length || 0) / 20)}
        totalCount={profiles?.length || 0}
        onPageChange={setPage}
      />
    </div>
  );
};

export default UserProfilesTable;
