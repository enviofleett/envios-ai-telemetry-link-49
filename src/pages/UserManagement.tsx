
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import ImportUsersDialog from '@/components/users/ImportUsersDialog';
import FullGP51ImportDialog from '@/components/admin/FullGP51ImportDialog';
import CreateUserDialog from '@/components/users/CreateUserDialog';
import VehicleAssignmentDialog from '@/components/users/VehicleAssignmentDialog';
import UserManagementHeader from '@/components/users/UserManagementHeader';
import ImportOptionsCard from '@/components/users/ImportOptionsCard';
import UserManagementTabs from '@/components/users/UserManagementTabs';

const UserManagement = () => {
  const { user } = useAuth();
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showFullImportDialog, setShowFullImportDialog] = useState(false);
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);
  const [showVehicleAssignmentDialog, setShowVehicleAssignmentDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleImportComplete = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCreateUser = () => {
    setShowCreateUserDialog(true);
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setShowCreateUserDialog(true);
  };

  const handleImportUsers = () => {
    setShowImportDialog(true);
  };

  const handleAssignVehicles = (user: any) => {
    setSelectedUser(user);
    setShowVehicleAssignmentDialog(true);
  };

  const handleUserDialogClose = () => {
    setShowCreateUserDialog(false);
    setSelectedUser(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleVehicleAssignmentClose = () => {
    setShowVehicleAssignmentDialog(false);
    setSelectedUser(null);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <UserManagementHeader
          onImportUsers={() => setShowImportDialog(true)}
          onFullImport={() => setShowFullImportDialog(true)}
        />

        <ImportOptionsCard
          onImportUsers={() => setShowImportDialog(true)}
          onFullImport={() => setShowFullImportDialog(true)}
        />

        <UserManagementTabs
          refreshTrigger={refreshTrigger}
          onCreateUser={handleCreateUser}
          onEditUser={handleEditUser}
          onImportUsers={handleImportUsers}
          onAssignVehicles={handleAssignVehicles}
        />

        {/* Import Dialogs */}
        <ImportUsersDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          onImportComplete={handleImportComplete}
        />

        <FullGP51ImportDialog
          open={showFullImportDialog}
          onOpenChange={setShowFullImportDialog}
          onImportComplete={handleImportComplete}
        />

        {/* User Management Dialogs */}
        <CreateUserDialog
          open={showCreateUserDialog}
          onOpenChange={handleUserDialogClose}
          editUser={selectedUser}
        />

        <VehicleAssignmentDialog
          open={showVehicleAssignmentDialog}
          onOpenChange={handleVehicleAssignmentClose}
          user={selectedUser}
        />
      </div>
    </div>
  );
};

export default UserManagement;
