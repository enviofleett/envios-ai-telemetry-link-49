
import React from 'react';
import { User } from '@/types/user-management';
import OptimizedUserManagementTable from './OptimizedUserManagementTable';

interface UserManagementTableProps {
  refreshTrigger?: number;
  onCreateUser: () => void;
  onEditUser: (user: User) => void;
  onImportUsers: () => void;
  onAssignVehicles: (user: User) => void;
}

const UserManagementTable: React.FC<UserManagementTableProps> = (props) => {
  return <OptimizedUserManagementTable {...props} />;
};

export default UserManagementTable;
