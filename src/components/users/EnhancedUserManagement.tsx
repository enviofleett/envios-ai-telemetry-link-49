
import React, { useState } from 'react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { Navigate } from 'react-router-dom';
import UserProfilesTable from './UserProfilesTable';
import UserProfileModal from './UserProfileModal';
import VehicleAssignmentModal from './VehicleAssignmentModal';
import CreateUserDialog from './CreateUserDialog';
import { UserProfile } from '@/hooks/useUserProfiles';

const EnhancedUserManagement: React.FC = () => {
  const { user, isAdmin } = useUnifiedAuth();
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [editUser, setEditUser] = useState<UserProfile | null>(null);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleUserClick = (user: UserProfile) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleEditUser = (user: UserProfile) => {
    setEditUser(user);
    setShowCreateUser(true);
    setShowUserModal(false);
  };

  const handleAssignVehicles = (user: UserProfile) => {
    setSelectedUser(user);
    setShowVehicleModal(true);
    setShowUserModal(false);
  };

  const handleCreateUser = () => {
    setEditUser(null);
    setShowCreateUser(true);
  };

  return (
    <div className="space-y-6 p-6">
      <UserProfilesTable
        onUserClick={handleUserClick}
        onEditUser={handleEditUser}
        onAssignVehicles={handleAssignVehicles}
        onCreateUser={handleCreateUser}
      />

      <UserProfileModal
        user={selectedUser}
        open={showUserModal}
        onOpenChange={setShowUserModal}
        onEdit={handleEditUser}
        onAssignVehicles={handleAssignVehicles}
      />

      <VehicleAssignmentModal
        user={selectedUser}
        open={showVehicleModal}
        onOpenChange={setShowVehicleModal}
      />

      <CreateUserDialog
        open={showCreateUser}
        onOpenChange={setShowCreateUser}
        editUser={editUser}
      />
    </div>
  );
};

export default EnhancedUserManagement;
