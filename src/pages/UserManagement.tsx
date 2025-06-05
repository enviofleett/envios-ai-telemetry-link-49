
import React, { useState } from 'react';
import UserManagementTable from '@/components/users/UserManagementTable';
import CreateUserDialog from '@/components/users/CreateUserDialog';
import VehicleAssignmentDialog from '@/components/users/VehicleAssignmentDialog';
import ImportUsersDialog from '@/components/users/ImportUsersDialog';

interface User {
  id: string;
  name: string;
  email: string;
  phone_number?: string;
  created_at: string;
  user_roles: Array<{ role: string }>;
  gp51_sessions: Array<{
    id: string;
    username: string;
    token_expires_at: string;
  }>;
  gp51_username?: string;
  gp51_user_type?: number;
  registration_status?: string;
  assigned_vehicles?: string[];
}

const UserManagement = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isVehicleAssignmentOpen, setIsVehicleAssignmentOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleCreateUser = () => {
    setIsCreateDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    // For now, we'll use the create dialog for editing
    // In a full implementation, you'd create a separate EditUserDialog
    setSelectedUser(user);
    setIsCreateDialogOpen(true);
  };

  const handleAssignVehicles = (user: User) => {
    setSelectedUser(user);
    setIsVehicleAssignmentOpen(true);
  };

  const handleImportUsers = () => {
    setIsImportDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage users, roles, and vehicle assignments</p>
        </div>
      </div>

      <UserManagementTable
        onCreateUser={handleCreateUser}
        onEditUser={handleEditUser}
        onImportUsers={handleImportUsers}
        onAssignVehicles={handleAssignVehicles}
      />

      <CreateUserDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      <VehicleAssignmentDialog
        open={isVehicleAssignmentOpen}
        onOpenChange={setIsVehicleAssignmentOpen}
        user={selectedUser}
      />

      <ImportUsersDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
      />
    </div>
  );
};

export default UserManagement;
