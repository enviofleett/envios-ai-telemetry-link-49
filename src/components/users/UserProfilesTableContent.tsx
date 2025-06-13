
import React from 'react';
import { UserProfile } from '@/hooks/useUserProfiles';
import UserProfileRow from './UserProfileRow';

interface UserProfilesTableContentProps {
  profiles: UserProfile[];
  onUserClick: (user: UserProfile) => void;
  onEditUser: (user: UserProfile) => void;
  onAssignVehicles: (user: UserProfile) => void;
}

export default function UserProfilesTableContent({
  profiles,
  onUserClick,
  onEditUser,
  onAssignVehicles
}: UserProfilesTableContentProps) {
  return (
    <div className="bg-white rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vehicles
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {profiles.map((profile) => (
              <UserProfileRow
                key={profile.id}
                profile={profile}
                onUserClick={onUserClick}
                onEditUser={onEditUser}
                onAssignVehicles={onAssignVehicles}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
