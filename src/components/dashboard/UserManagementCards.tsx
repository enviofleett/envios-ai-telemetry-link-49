
import React from 'react';
import { User, Users, Folder } from 'lucide-react';
import MetricCard from './MetricCard';

interface UserManagementCardsProps {
  totalUsers: number;
  totalUserGroups: number;
  totalDeviceGroups: number;
  isLoading?: boolean;
}

const UserManagementCards: React.FC<UserManagementCardsProps> = ({
  totalUsers,
  totalUserGroups,
  totalDeviceGroups,
  isLoading = false
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard
        title="Total Users"
        value={totalUsers}
        icon={User}
        color="gray"
        isLoading={isLoading}
        subtitle="System users"
      />
      
      <MetricCard
        title="User Groups"
        value={totalUserGroups}
        icon={Users}
        color="blue"
        isLoading={isLoading}
        subtitle="Management groups"
      />
      
      <MetricCard
        title="Device Groups"
        value={totalDeviceGroups}
        icon={Folder}
        color="green"
        isLoading={isLoading}
        subtitle="Fleet organization"
      />
    </div>
  );
};

export default UserManagementCards;
